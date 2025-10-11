#!/usr/bin/env node
/**
 * Check invite code usage and statistics for MeepleGo private beta
 * 
 * Usage:
 *   node scripts/deployment/check-invite-codes.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkInviteCodes() {
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

  console.log('\n🎲 MeepleGo Invite Code Status\n')

  // Get all invite codes
  const { data: codes, error } = await supabase
    .from('invite_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching invite codes:', error.message)
    process.exit(1)
  }

  if (!codes || codes.length === 0) {
    console.log('ℹ️  No invite codes found')
    return
  }

  console.log('📊 Invite Codes:\n')
  console.log('─'.repeat(100))

  for (const code of codes) {
    const remaining = code.max_uses - code.current_uses
    const percentUsed = ((code.current_uses / code.max_uses) * 100).toFixed(1)
    const isExpired = code.expires_at && new Date(code.expires_at) < new Date()
    const isActive = !isExpired && remaining > 0

    console.log(`Code: ${code.code}`)
    console.log(`Status: ${isActive ? '✅ Active' : '⛔ Inactive'}`)
    console.log(`Usage: ${code.current_uses}/${code.max_uses} (${percentUsed}% used, ${remaining} remaining)`)
    
    if (code.expires_at) {
      const expiryDate = new Date(code.expires_at).toLocaleDateString()
      console.log(`Expires: ${expiryDate}${isExpired ? ' ⚠️ EXPIRED' : ''}`)
    } else {
      console.log('Expires: Never')
    }
    
    if (code.notes) {
      console.log(`Notes: ${code.notes}`)
    }
    
    console.log(`Created: ${new Date(code.created_at).toLocaleDateString()}`)
    console.log('─'.repeat(100))
  }

  // Get user statistics
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('invite_code_used, created_at')
    .not('invite_code_used', 'is', null)

  if (profileError) {
    console.error('⚠️  Could not fetch user statistics:', profileError.message)
    return
  }

  if (profiles && profiles.length > 0) {
    console.log('\n👥 User Statistics:\n')
    
    // Group by invite code
    const codeUsage = profiles.reduce((acc, profile) => {
      const code = profile.invite_code_used
      if (!acc[code]) {
        acc[code] = []
      }
      acc[code].push(profile)
      return acc
    }, {})

    for (const [code, users] of Object.entries(codeUsage)) {
      console.log(`${code}: ${users.length} user${users.length === 1 ? '' : 's'}`)
      
      // Show most recent signups
      const recent = users
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3)
      
      if (recent.length > 0) {
        console.log('  Recent signups:')
        recent.forEach(u => {
          console.log(`  - ${new Date(u.created_at).toLocaleString()}`)
        })
      }
      console.log()
    }

    console.log(`📈 Total users with invite codes: ${profiles.length}`)

    // Success criteria check
    console.log('\n🎯 Success Criteria Check:\n')
    console.log(`Target: 10-20 initial users`)
    console.log(`Current: ${profiles.length} users`)
    
    if (profiles.length >= 10 && profiles.length <= 20) {
      console.log('✅ Within target range!')
    } else if (profiles.length < 10) {
      console.log(`⚠️  Need ${10 - profiles.length} more users to reach minimum`)
    } else {
      console.log('✅ Exceeded initial target!')
    }
  } else {
    console.log('\nℹ️  No users have signed up yet')
  }

  console.log('\n✨ Done!\n')
}

// Run the check
checkInviteCodes().catch((err) => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
