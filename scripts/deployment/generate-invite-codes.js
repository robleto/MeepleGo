#!/usr/bin/env node
/**
 * Generate and insert invite codes for MeepleGo private beta
 * 
 * Usage:
 *   node scripts/deployment/generate-invite-codes.js
 * 
 * This script helps create new invite codes with various options.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve))
}

async function generateInviteCode() {
  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing Supabase environment variables')
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
    process.exit(1)
  }

  // Create Supabase client with service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('\n🎲 MeepleGo Invite Code Generator\n')
  
  // Gather information
  const code = (await question('Enter invite code (e.g., BETA2025): ')).trim().toUpperCase()
  if (!code) {
    console.error('❌ Invite code is required')
    rl.close()
    return
  }

  // Check if code already exists
  const { data: existing } = await supabase
    .from('invite_codes')
    .select('code')
    .eq('code', code)
    .maybeSingle()

  if (existing) {
    console.error(`❌ Invite code "${code}" already exists`)
    rl.close()
    return
  }

  const maxUsesInput = await question('Maximum uses (default: 10): ')
  const maxUses = maxUsesInput.trim() ? parseInt(maxUsesInput, 10) : 10

  if (isNaN(maxUses) || maxUses < 1) {
    console.error('❌ Invalid max uses value')
    rl.close()
    return
  }

  const expiresInput = await question('Expiration date (YYYY-MM-DD, or leave empty for no expiration): ')
  let expiresAt = null
  if (expiresInput.trim()) {
    expiresAt = new Date(expiresInput.trim() + 'T23:59:59Z').toISOString()
    if (isNaN(new Date(expiresAt).getTime())) {
      console.error('❌ Invalid date format')
      rl.close()
      return
    }
  }

  const notes = await question('Notes (optional description): ')

  console.log('\n📝 Invite Code Summary:')
  console.log(`Code: ${code}`)
  console.log(`Max Uses: ${maxUses}`)
  console.log(`Expires: ${expiresAt ? new Date(expiresAt).toLocaleDateString() : 'Never'}`)
  console.log(`Notes: ${notes || 'None'}`)
  
  const confirm = await question('\nCreate this invite code? (yes/no): ')
  
  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log('❌ Cancelled')
    rl.close()
    return
  }

  // Insert the invite code
  const { data, error } = await supabase
    .from('invite_codes')
    .insert({
      code,
      max_uses: maxUses,
      current_uses: 0,
      expires_at: expiresAt,
      notes: notes || null
    })
    .select()

  if (error) {
    console.error('❌ Error creating invite code:', error.message)
    rl.close()
    return
  }

  console.log('\n✅ Invite code created successfully!')
  console.log(`\nShare this code with users: ${code}`)
  console.log(`\nUsers can sign up at: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://meeplego.com'}/signup`)
  
  rl.close()
}

// Run the generator
generateInviteCode().catch((err) => {
  console.error('❌ Error:', err.message)
  rl.close()
  process.exit(1)
})
