#!/usr/bin/env node
/**
 * Test Row Level Security (RLS) policies to ensure non-owner users cannot
 * read or write data belonging to other users.
 * 
 * Usage:
 *   node scripts/development-tools/test-rls-policies.js
 * 
 * Environment variables required:
 *   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (for creating test users)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY (for testing as regular users)
 * 
 * This script:
 *   1. Creates two test users (owner and non-owner)
 *   2. Creates test data as the owner
 *   3. Attempts to access/modify owner's data as non-owner
 *   4. Validates that all RLS policies work correctly
 *   5. Cleans up test data and users
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

// Admin client with service role (bypasses RLS)
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

// Test configuration
const TEST_EMAIL_PREFIX = 'rls-test'
const OWNER_EMAIL = `${TEST_EMAIL_PREFIX}-owner-${Date.now()}@example.com`
const NON_OWNER_EMAIL = `${TEST_EMAIL_PREFIX}-nonowner-${Date.now()}@example.com`
const TEST_PASSWORD = 'Test123!@#SecurePassword'

let ownerUserId = null
let nonOwnerUserId = null
let testGameId = null
let testRankingId = null
let testPrivateListId = null
let testPublicListId = null
let testListItemId = null
let testAwardId = null

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
}

function logTest(testName, passed, details = '') {
  results.total++
  if (passed) {
    results.passed++
    console.log(`  ✅ ${testName}`)
  } else {
    results.failed++
    console.log(`  ❌ ${testName}`)
    if (details) console.log(`     ${details}`)
  }
  results.tests.push({ testName, passed, details })
}

async function createTestUser(email, password) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username: email.split('@')[0],
      full_name: `Test User ${email.split('@')[0]}`
    }
  })
  
  if (error) throw new Error(`Failed to create user ${email}: ${error.message}`)
  return data.user
}

async function deleteTestUser(userId) {
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) {
    console.warn(`⚠️  Failed to delete user ${userId}: ${error.message}`)
  }
}

async function signInAs(email, password) {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false }
  })
  
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw new Error(`Failed to sign in as ${email}: ${error.message}`)
  
  // Return a client with the user's session
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${data.session.access_token}`
      }
    }
  })
}

async function setupTestData() {
  console.log('\n📝 Setting up test data...')
  
  // Create a test game (games are public, so we use admin client)
  const { data: game, error: gameError } = await adminClient
    .from('games')
    .insert({
      bgg_id: 999999990 + Math.floor(Math.random() * 10), // Random BGG ID to avoid conflicts
      name: `RLS Test Game ${Date.now()}`,
      year_published: 2024,
      min_players: 2,
      max_players: 4
    })
    .select()
    .single()
  
  if (gameError) throw new Error(`Failed to create test game: ${gameError.message}`)
  testGameId = game.id
  console.log(`  ✓ Created test game: ${game.name}`)
  
  // Sign in as owner and create their data
  const ownerClient = await signInAs(OWNER_EMAIL, TEST_PASSWORD)
  
  // Create owner's ranking
  const { data: ranking, error: rankingError } = await ownerClient
    .from('rankings')
    .insert({
      user_id: ownerUserId,
      game_id: testGameId,
      ranking: 9,
      played_it: true,
      notes: 'Owner\'s private notes'
    })
    .select()
    .single()
  
  if (rankingError) throw new Error(`Failed to create ranking: ${rankingError.message}`)
  testRankingId = ranking.id
  console.log(`  ✓ Created owner's ranking`)
  
  // Create owner's private list
  const { data: privateList, error: privateListError } = await ownerClient
    .from('game_lists')
    .insert({
      user_id: ownerUserId,
      name: 'Owner Private List',
      description: 'This should not be visible to non-owner',
      is_public: false
    })
    .select()
    .single()
  
  if (privateListError) throw new Error(`Failed to create private list: ${privateListError.message}`)
  testPrivateListId = privateList.id
  console.log(`  ✓ Created owner's private list`)
  
  // Create owner's public list
  const { data: publicList, error: publicListError } = await ownerClient
    .from('game_lists')
    .insert({
      user_id: ownerUserId,
      name: 'Owner Public List',
      description: 'This should be visible to everyone',
      is_public: true
    })
    .select()
    .single()
  
  if (publicListError) throw new Error(`Failed to create public list: ${publicListError.message}`)
  testPublicListId = publicList.id
  console.log(`  ✓ Created owner's public list`)
  
  // Add item to public list
  const { data: listItem, error: listItemError } = await ownerClient
    .from('game_list_items')
    .insert({
      list_id: testPublicListId,
      game_id: testGameId,
      ranking: 1
    })
    .select()
    .single()
  
  if (listItemError) throw new Error(`Failed to create list item: ${listItemError.message}`)
  testListItemId = listItem.id
  console.log(`  ✓ Added game to owner's public list`)
  
  // Create owner's award
  const { data: award, error: awardError } = await ownerClient
    .from('awards')
    .insert({
      user_id: ownerUserId,
      year: 2024,
      category: 'Best Game',
      winner_id: testGameId
    })
    .select()
    .single()
  
  if (awardError) throw new Error(`Failed to create award: ${awardError.message}`)
  testAwardId = award.id
  console.log(`  ✓ Created owner's award`)
}

async function testProfileAccess() {
  console.log('\n🔒 Testing Profile RLS Policies...')
  
  const nonOwnerClient = await signInAs(NON_OWNER_EMAIL, TEST_PASSWORD)
  
  // Test: Non-owner cannot read owner's profile
  const { data: readProfile, error: readError } = await nonOwnerClient
    .from('profiles')
    .select('*')
    .eq('id', ownerUserId)
    .maybeSingle()
  
  logTest(
    'Non-owner CANNOT read owner\'s profile',
    !readProfile && !readError,
    readProfile ? `Found profile data: ${JSON.stringify(readProfile)}` : ''
  )
  
  // Test: Non-owner cannot update owner's profile
  const { error: updateError } = await nonOwnerClient
    .from('profiles')
    .update({ bio: 'Hacked!' })
    .eq('id', ownerUserId)
  
  logTest(
    'Non-owner CANNOT update owner\'s profile',
    !!updateError,
    !updateError ? 'Update succeeded when it should have failed' : ''
  )
  
  // Test: Non-owner can read their own profile
  const { data: ownProfile, error: ownError } = await nonOwnerClient
    .from('profiles')
    .select('*')
    .eq('id', nonOwnerUserId)
    .maybeSingle()
  
  logTest(
    'Non-owner CAN read their own profile',
    !!ownProfile && !ownError,
    !ownProfile ? 'Could not read own profile' : ''
  )
}

async function testRankingsAccess() {
  console.log('\n🔒 Testing Rankings RLS Policies...')
  
  const nonOwnerClient = await signInAs(NON_OWNER_EMAIL, TEST_PASSWORD)
  
  // Test: Non-owner cannot read owner's rankings
  const { data: readRankings, error: readError } = await nonOwnerClient
    .from('rankings')
    .select('*')
    .eq('id', testRankingId)
    .maybeSingle()
  
  logTest(
    'Non-owner CANNOT read owner\'s rankings',
    !readRankings,
    readRankings ? `Found ranking: ${JSON.stringify(readRankings)}` : ''
  )
  
  // Test: Non-owner cannot update owner's rankings
  const { error: updateError } = await nonOwnerClient
    .from('rankings')
    .update({ ranking: 1, notes: 'Hacked!' })
    .eq('id', testRankingId)
  
  logTest(
    'Non-owner CANNOT update owner\'s rankings',
    !!updateError,
    !updateError ? 'Update succeeded when it should have failed' : ''
  )
  
  // Test: Non-owner cannot delete owner's rankings
  const { error: deleteError } = await nonOwnerClient
    .from('rankings')
    .delete()
    .eq('id', testRankingId)
  
  logTest(
    'Non-owner CANNOT delete owner\'s rankings',
    !!deleteError,
    !deleteError ? 'Delete succeeded when it should have failed' : ''
  )
  
  // Test: Non-owner can create their own ranking
  const { data: ownRanking, error: createError } = await nonOwnerClient
    .from('rankings')
    .insert({
      user_id: nonOwnerUserId,
      game_id: testGameId,
      ranking: 5,
      played_it: false
    })
    .select()
    .single()
  
  logTest(
    'Non-owner CAN create their own ranking',
    !!ownRanking && !createError,
    createError ? createError.message : ''
  )
  
  // Clean up non-owner's ranking
  if (ownRanking) {
    await nonOwnerClient.from('rankings').delete().eq('id', ownRanking.id)
  }
}

async function testListsAccess() {
  console.log('\n🔒 Testing Game Lists RLS Policies...')
  
  const nonOwnerClient = await signInAs(NON_OWNER_EMAIL, TEST_PASSWORD)
  
  // Test: Non-owner cannot read owner's private list
  const { data: readPrivate, error: readPrivateError } = await nonOwnerClient
    .from('game_lists')
    .select('*')
    .eq('id', testPrivateListId)
    .maybeSingle()
  
  logTest(
    'Non-owner CANNOT read owner\'s private list',
    !readPrivate,
    readPrivate ? `Found private list: ${readPrivate.name}` : ''
  )
  
  // Test: Non-owner CAN read owner's public list
  const { data: readPublic, error: readPublicError } = await nonOwnerClient
    .from('game_lists')
    .select('*')
    .eq('id', testPublicListId)
    .maybeSingle()
  
  logTest(
    'Non-owner CAN read owner\'s public list',
    !!readPublic && !readPublicError,
    !readPublic ? 'Could not read public list' : ''
  )
  
  // Test: Non-owner cannot update owner's list (even public)
  const { error: updateError } = await nonOwnerClient
    .from('game_lists')
    .update({ name: 'Hacked List!' })
    .eq('id', testPublicListId)
  
  logTest(
    'Non-owner CANNOT update owner\'s public list',
    !!updateError,
    !updateError ? 'Update succeeded when it should have failed' : ''
  )
  
  // Test: Non-owner cannot delete owner's list
  const { error: deleteError } = await nonOwnerClient
    .from('game_lists')
    .delete()
    .eq('id', testPrivateListId)
  
  logTest(
    'Non-owner CANNOT delete owner\'s list',
    !!deleteError,
    !deleteError ? 'Delete succeeded when it should have failed' : ''
  )
  
  // Test: Non-owner can create their own list
  const { data: ownList, error: createError } = await nonOwnerClient
    .from('game_lists')
    .insert({
      user_id: nonOwnerUserId,
      name: 'Non-owner\'s List',
      is_public: false
    })
    .select()
    .single()
  
  logTest(
    'Non-owner CAN create their own list',
    !!ownList && !createError,
    createError ? createError.message : ''
  )
  
  // Clean up non-owner's list
  if (ownList) {
    await nonOwnerClient.from('game_lists').delete().eq('id', ownList.id)
  }
}

async function testListItemsAccess() {
  console.log('\n🔒 Testing List Items RLS Policies...')
  
  const nonOwnerClient = await signInAs(NON_OWNER_EMAIL, TEST_PASSWORD)
  
  // Test: Non-owner CAN read items in owner's public list
  const { data: readPublicItems, error: readError } = await nonOwnerClient
    .from('game_list_items')
    .select('*')
    .eq('list_id', testPublicListId)
  
  logTest(
    'Non-owner CAN read items in owner\'s public list',
    !!readPublicItems && readPublicItems.length > 0 && !readError,
    !readPublicItems || readPublicItems.length === 0 ? 'Could not read public list items' : ''
  )
  
  // Test: Non-owner cannot modify items in owner's public list
  const { error: updateError } = await nonOwnerClient
    .from('game_list_items')
    .update({ ranking: 999 })
    .eq('id', testListItemId)
  
  logTest(
    'Non-owner CANNOT update items in owner\'s list',
    !!updateError,
    !updateError ? 'Update succeeded when it should have failed' : ''
  )
  
  // Test: Non-owner cannot add items to owner's list
  const { error: insertError } = await nonOwnerClient
    .from('game_list_items')
    .insert({
      list_id: testPublicListId,
      game_id: testGameId,
      ranking: 2
    })
  
  logTest(
    'Non-owner CANNOT add items to owner\'s list',
    !!insertError,
    !insertError ? 'Insert succeeded when it should have failed' : ''
  )
  
  // Test: Non-owner cannot delete items from owner's list
  const { error: deleteError } = await nonOwnerClient
    .from('game_list_items')
    .delete()
    .eq('id', testListItemId)
  
  logTest(
    'Non-owner CANNOT delete items from owner\'s list',
    !!deleteError,
    !deleteError ? 'Delete succeeded when it should have failed' : ''
  )
}

async function testAwardsAccess() {
  console.log('\n🔒 Testing Awards RLS Policies...')
  
  const nonOwnerClient = await signInAs(NON_OWNER_EMAIL, TEST_PASSWORD)
  
  // Test: Non-owner cannot read owner's awards
  const { data: readAwards, error: readError } = await nonOwnerClient
    .from('awards')
    .select('*')
    .eq('id', testAwardId)
    .maybeSingle()
  
  logTest(
    'Non-owner CANNOT read owner\'s awards',
    !readAwards,
    readAwards ? `Found award: ${JSON.stringify(readAwards)}` : ''
  )
  
  // Test: Non-owner cannot update owner's awards
  const { error: updateError } = await nonOwnerClient
    .from('awards')
    .update({ category: 'Hacked Award!' })
    .eq('id', testAwardId)
  
  logTest(
    'Non-owner CANNOT update owner\'s awards',
    !!updateError,
    !updateError ? 'Update succeeded when it should have failed' : ''
  )
  
  // Test: Non-owner cannot delete owner's awards
  const { error: deleteError } = await nonOwnerClient
    .from('awards')
    .delete()
    .eq('id', testAwardId)
  
  logTest(
    'Non-owner CANNOT delete owner\'s awards',
    !!deleteError,
    !deleteError ? 'Delete succeeded when it should have failed' : ''
  )
  
  // Test: Non-owner can create their own award
  const { data: ownAward, error: createError } = await nonOwnerClient
    .from('awards')
    .insert({
      user_id: nonOwnerUserId,
      year: 2024,
      category: 'Non-owner Award',
      winner_id: testGameId
    })
    .select()
    .single()
  
  logTest(
    'Non-owner CAN create their own award',
    !!ownAward && !createError,
    createError ? createError.message : ''
  )
  
  // Clean up non-owner's award
  if (ownAward) {
    await nonOwnerClient.from('awards').delete().eq('id', ownAward.id)
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...')
  
  // Delete test data (in reverse order of dependencies)
  if (testAwardId) {
    await adminClient.from('awards').delete().eq('id', testAwardId)
    console.log('  ✓ Deleted test award')
  }
  
  if (testListItemId) {
    await adminClient.from('game_list_items').delete().eq('id', testListItemId)
    console.log('  ✓ Deleted test list item')
  }
  
  if (testPublicListId) {
    await adminClient.from('game_lists').delete().eq('id', testPublicListId)
    console.log('  ✓ Deleted test public list')
  }
  
  if (testPrivateListId) {
    await adminClient.from('game_lists').delete().eq('id', testPrivateListId)
    console.log('  ✓ Deleted test private list')
  }
  
  if (testRankingId) {
    await adminClient.from('rankings').delete().eq('id', testRankingId)
    console.log('  ✓ Deleted test ranking')
  }
  
  if (testGameId) {
    await adminClient.from('games').delete().eq('id', testGameId)
    console.log('  ✓ Deleted test game')
  }
  
  // Delete test users
  if (nonOwnerUserId) {
    await deleteTestUser(nonOwnerUserId)
    console.log('  ✓ Deleted non-owner test user')
  }
  
  if (ownerUserId) {
    await deleteTestUser(ownerUserId)
    console.log('  ✓ Deleted owner test user')
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(70))
  console.log('🔐 MeepleGo Row Level Security (RLS) Policy Tests')
  console.log('='.repeat(70))
  
  try {
    // Create test users
    console.log('\n👥 Creating test users...')
    const owner = await createTestUser(OWNER_EMAIL, TEST_PASSWORD)
    ownerUserId = owner.id
    console.log(`  ✓ Created owner: ${OWNER_EMAIL}`)
    
    const nonOwner = await createTestUser(NON_OWNER_EMAIL, TEST_PASSWORD)
    nonOwnerUserId = nonOwner.id
    console.log(`  ✓ Created non-owner: ${NON_OWNER_EMAIL}`)
    
    // Setup test data
    await setupTestData()
    
    // Run RLS tests
    await testProfileAccess()
    await testRankingsAccess()
    await testListsAccess()
    await testListItemsAccess()
    await testAwardsAccess()
    
    // Print summary
    console.log('\n' + '='.repeat(70))
    console.log('📊 Test Summary')
    console.log('='.repeat(70))
    console.log(`Total Tests: ${results.total}`)
    console.log(`✅ Passed: ${results.passed}`)
    console.log(`❌ Failed: ${results.failed}`)
    
    if (results.failed > 0) {
      console.log('\n⚠️  Failed Tests:')
      results.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.testName}`)
        if (t.details) console.log(`    ${t.details}`)
      })
    }
    
    console.log('\n' + '='.repeat(70))
    
    if (results.failed === 0) {
      console.log('✅ All RLS policies are working correctly!')
      console.log('   Non-owner users cannot access or modify owner data.')
    } else {
      console.log('❌ Some RLS policies failed!')
      console.log('   Please review the schema.sql file and update policies.')
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message)
    throw error
  } finally {
    // Always cleanup
    await cleanupTestData()
  }
}

// Run tests
runTests()
  .then(() => {
    process.exit(results.failed > 0 ? 1 : 0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
