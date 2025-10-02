#!/usr/bin/env node
/**
 * Cleanup Supabase auth users created for email deliverability tests.
 *
 * Deletes users that were created by scripts using the metadata flag
 * `created_by: "deliverability_test"` or whose email matches a provided
 * list. Run with `--dry-run` to preview which accounts would be removed.
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required)')
  process.exit(1)
}

const dryRun = process.argv.includes('--dry-run')
const tag = process.env.CLEANUP_TEST_USER_TAG || 'deliverability_test'
const additionalEmails = (process.env.CLEANUP_TEST_USER_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)
const emailAllowlist = new Set(additionalEmails)

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function listAllUsers(perPage = 200) {
  const users = []
  let page = 1
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    if (!data?.users?.length) break
    users.push(...data.users)
    if (data.users.length < perPage) break
    page += 1
  }
  return users
}

function shouldDeleteUser(user) {
  if (!user) return false
  const email = (user.email || '').toLowerCase()
  const meta = user.user_metadata || {}
  if (meta.created_by === tag || meta.test_account === true) return true
  if (emailAllowlist.has(email)) return true
  return false
}

async function main() {
  console.log('🧹 Checking Supabase auth users for test accounts…')
  console.log(`Supabase URL: ${SUPABASE_URL}`)
  console.log(`Deletion tag: ${tag}`)
  if (emailAllowlist.size) {
    console.log(`Explicit email targets (${emailAllowlist.size}):`)
    for (const email of emailAllowlist) console.log(`  • ${email}`)
  }
  console.log(dryRun ? 'Mode: DRY RUN (no deletions will occur)' : 'Mode: LIVE (accounts will be deleted)')

  const users = await listAllUsers()
  if (!users.length) {
    console.log('No users found in project.')
    return
  }

  const targets = users.filter(shouldDeleteUser)
  if (!targets.length) {
    console.log('No matching test users found. ✅')
    return
  }

  console.log(`Found ${targets.length} matching user(s):`)
  for (const user of targets) {
    const email = user.email || '(no email)'
    console.log(`  • ${email} (id: ${user.id})`)
  }

  if (dryRun) {
    console.log('Dry run complete. No users were deleted.')
    return
  }

  let deleted = 0
  for (const user of targets) {
    const { error } = await supabase.auth.admin.deleteUser(user.id)
    if (error) {
      console.error(`  ⚠️ Failed to delete ${user.email || user.id}: ${error.message}`)
    } else {
      deleted += 1
      console.log(`  ✅ Deleted ${user.email || user.id}`)
    }
  }

  console.log(`Finished. Deleted ${deleted}/${targets.length} accounts.`)
}

main().catch((error) => {
  console.error('Cleanup failed:', error.message)
  process.exit(1)
})
