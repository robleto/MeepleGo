#!/usr/bin/env node
/**
 * Email Deliverability Testing Script for MeepleGo Production Launch
 *
 * This script helps test email deliverability across major providers
 * and validates that authentication emails are working properly.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { performance } = require('perf_hooks')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

function getArgValue(name) {
  const prefix = `${name}=`
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith(prefix)) return arg.slice(prefix.length)
  }
  return null
}

const rawEmailList =
  getArgValue('--emails') || process.env.DELIVERABILITY_TEST_EMAILS || ''
const allowPlaceholders = process.argv.includes('--allow-placeholders')
const cooldownMs = Number(getArgValue('--cooldown-ms') || '0')

const TEST_EMAILS = Array.from(
  new Set(
    rawEmailList
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean)
  )
)

function looksLikePlaceholder(email) {
  const lowered = email.toLowerCase()
  return (
    lowered.includes('example.com') ||
    lowered.includes('example.org') ||
    lowered.includes('example.net') ||
    lowered.startsWith('test+') ||
    lowered.includes('@test.com') ||
    lowered.includes('@test.co') ||
    lowered.includes('no-reply@')
  )
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

if (!TEST_EMAILS.length) {
  console.error(
    '❌ No deliverability test emails provided. Supply a comma-separated list via --emails="addr1,addr2" or DELIVERABILITY_TEST_EMAILS.'
  )
  process.exit(1)
}

if (!allowPlaceholders && TEST_EMAILS.some(looksLikePlaceholder)) {
  console.error(
    '❌ Detected placeholder-style addresses. Provide real inboxes or rerun with --allow-placeholders if intentional.'
  )
  TEST_EMAILS.forEach((email) => console.error(`   • ${email}`))
  process.exit(1)
}

async function testEmailDeliverability() {
  console.log('🚀 Starting Email Deliverability Test for MeepleGo')
  console.log('='.repeat(60))
  console.log(`Site URL: ${SITE_URL}`)
  console.log(`Supabase URL: ${SUPABASE_URL}`)
  console.log('')

  const results = []

  for (const email of TEST_EMAILS) {
    console.log(`📧 Testing email delivery to: ${email}`)

    const testResult = {
      email,
      provider: email.split('@')[1],
      tests: {
        signup: null,
        magicLink: null,
        passwordReset: null,
      },
      timing: {},
    }

    try {
      // Test 1: Signup Confirmation Email
      console.log('  🔸 Testing signup confirmation email...')
      const signupStart = performance.now()

      const { data: signupData, error: signupError } =
        await supabase.auth.admin.createUser({
          email,
          email_confirm: false,
          user_metadata: {
            test_account: true,
            created_by: 'deliverability_test',
          },
        })

      if (signupError) {
        testResult.tests.signup = `Error: ${signupError.message}`
        console.log(`    ❌ Signup test failed: ${signupError.message}`)
      } else {
        const signupEnd = performance.now()
        testResult.timing.signup = Math.round(signupEnd - signupStart)
        testResult.tests.signup = 'Success - Check inbox for confirmation email'
        console.log(
          `    ✅ Signup confirmation sent (${testResult.timing.signup}ms)`
        )
      }

      if (cooldownMs > 0) {
        console.log(
          `    ⏳ Waiting ${cooldownMs}ms before next test to satisfy rate limits...`
        )
        await new Promise((resolve) => setTimeout(resolve, cooldownMs))
      }

      // Wait a bit between tests
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Test 2: Magic Link Email
      console.log('  🔸 Testing magic link email...')
      const magicStart = performance.now()

      const { error: magicError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${SITE_URL}/auth/callback`,
        },
      })

      if (magicError) {
        testResult.tests.magicLink = `Error: ${magicError.message}`
        console.log(`    ❌ Magic link test failed: ${magicError.message}`)
      } else {
        const magicEnd = performance.now()
        testResult.timing.magicLink = Math.round(magicEnd - magicStart)
        testResult.tests.magicLink = 'Success - Check inbox for magic link'
        console.log(`    ✅ Magic link sent (${testResult.timing.magicLink}ms)`)
      }

      if (cooldownMs > 0) {
        console.log(
          `    ⏳ Waiting ${cooldownMs}ms before next test to satisfy rate limits...`
        )
        await new Promise((resolve) => setTimeout(resolve, cooldownMs))
      }

      // Wait a bit between tests
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Test 3: Password Reset Email
      console.log('  🔸 Testing password reset email...')
      const resetStart = performance.now()

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${SITE_URL}/update-password`,
        }
      )

      if (resetError) {
        testResult.tests.passwordReset = `Error: ${resetError.message}`
        console.log(`    ❌ Password reset test failed: ${resetError.message}`)
      } else {
        const resetEnd = performance.now()
        testResult.timing.passwordReset = Math.round(resetEnd - resetStart)
        testResult.tests.passwordReset =
          'Success - Check inbox for password reset'
        console.log(
          `    ✅ Password reset sent (${testResult.timing.passwordReset}ms)`
        )
      }
    } catch (error) {
      console.log(`    ❌ Unexpected error: ${error.message}`)
      testResult.tests.error = error.message
    }

    results.push(testResult)
    console.log('')
  }

  // Print summary
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))

  results.forEach((result) => {
    console.log(`\n📧 ${result.email} (${result.provider})`)
    console.log(`  Signup: ${result.tests.signup}`)
    console.log(`  Magic Link: ${result.tests.magicLink}`)
    console.log(`  Password Reset: ${result.tests.passwordReset}`)

    if (Object.keys(result.timing).length > 0) {
      const times = Object.entries(result.timing)
        .map(([test, time]) => `${test}: ${time}ms`)
        .join(', ')
      console.log(`  Timing: ${times}`)
    }
  })

  console.log('\n📋 NEXT STEPS')
  console.log('='.repeat(60))
  console.log('1. Check the inbox for each test email address')
  console.log('2. Verify emails are delivered to inbox (not spam)')
  console.log('3. Check email headers for SPF/DKIM/DMARC pass status')
  console.log('4. Test the actual links in the emails')
  console.log('5. Monitor delivery timing (should be < 30 seconds)')

  console.log('\n🔍 EMAIL HEADER VERIFICATION')
  console.log('Look for these headers in received emails:')
  console.log('  - Authentication-Results: spf=pass')
  console.log('  - Authentication-Results: dkim=pass')
  console.log('  - Authentication-Results: dmarc=pass')

  console.log('\n🧹 CLEANUP')
  console.log('Use `npm run cleanup:test-email-users -- --dry-run` to preview accounts before deletion.')
  console.log('If you prefer manual SQL, remove the following users:')
  results.forEach((result) => {
    if (result.tests.signup && result.tests.signup.includes('Success')) {
      console.log(`  DELETE FROM auth.users WHERE email = '${result.email}';`)
    }
  })
}

async function testDNSRecords() {
  console.log('\n🌐 DNS RECORDS CHECK')
  console.log('='.repeat(60))

  const domain = 'meeplego.com'
  const { spawn } = require('child_process')

  const checkDNS = (recordType, name) => {
    return new Promise((resolve) => {
      const dig = spawn('dig', [recordType, name, '+short'])
      let output = ''

      dig.stdout.on('data', (data) => {
        output += data.toString()
      })

      dig.on('close', (code) => {
        resolve(output.trim())
      })

      dig.on('error', (error) => {
        resolve(`Error: ${error.message}`)
      })
    })
  }

  try {
    console.log('Checking SPF record...')
    const spf = await checkDNS('TXT', domain)
    console.log(`SPF: ${spf.includes('v=spf1') ? '✅' : '❌'} ${spf}`)

    console.log('Checking DMARC record...')
    const dmarc = await checkDNS('TXT', `_dmarc.${domain}`)
    console.log(`DMARC: ${dmarc.includes('v=DMARC1') ? '✅' : '❌'} ${dmarc}`)
  } catch (error) {
    console.log(`❌ DNS check failed: ${error.message}`)
    console.log(
      '💡 You can manually check DNS records at: https://mxtoolbox.com/'
    )
  }
}

// Main execution
async function main() {
  try {
    await testEmailDeliverability()
    await testDNSRecords()

    console.log('\n✨ Email deliverability test completed!')
    console.log('📧 Check your test email inboxes and verify delivery.')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { testEmailDeliverability, testDNSRecords }
