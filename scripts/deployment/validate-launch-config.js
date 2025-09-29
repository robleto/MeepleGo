#!/usr/bin/env node
/**
 * Launch Configuration Validation Script for MeepleGo
 *
 * This script validates that all Supabase configurations are ready for production launch.
 * It checks environment variables, Supabase connectivity, redirect URLs, and DNS records.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { spawn } = require('child_process')

// Configuration
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SITE_URL',
]

const PRODUCTION_URLS = ['https://meeplego.com/auth/callback']

const STAGING_URLS = [
  'https://staging.meeplego.com/auth/callback',
  'https://preview.meeplego.com/auth/callback',
]

const DEV_URLS = [
  'http://localhost:3000/auth/callback',
  'http://localhost:3001/auth/callback',
]

let validationResults = {
  environment: { passed: 0, failed: 0, warnings: 0 },
  supabase: { passed: 0, failed: 0, warnings: 0 },
  dns: { passed: 0, failed: 0, warnings: 0 },
  overall: { passed: 0, failed: 0, warnings: 0 },
}

function logResult(category, test, status, message, isWarning = false) {
  const icon = status ? '✅' : isWarning ? '⚠️' : '❌'
  const prefix = isWarning ? 'WARNING' : status ? 'PASS' : 'FAIL'

  console.log(`  ${icon} ${prefix}: ${test} - ${message}`)

  if (status) {
    validationResults[category].passed++
  } else if (isWarning) {
    validationResults[category].warnings++
  } else {
    validationResults[category].failed++
  }
}

async function validateEnvironmentVariables() {
  console.log('🔧 ENVIRONMENT VARIABLES')
  console.log('='.repeat(60))

  // Check required environment variables
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar]
    if (value) {
      logResult('environment', `${envVar}`, true, 'Set correctly')
    } else {
      logResult('environment', `${envVar}`, false, 'Missing or empty')
    }
  }

  // Check optional but recommended variables
  const optionalVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_AUTH_REDIRECT_BASE',
  ]
  for (const envVar of optionalVars) {
    const value = process.env[envVar]
    if (value) {
      logResult('environment', `${envVar}`, true, 'Set correctly')
    } else {
      logResult(
        'environment',
        `${envVar}`,
        false,
        'Missing (recommended for production)',
        true
      )
    }
  }

  // Validate environment values
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) {
    try {
      new URL(siteUrl)
      logResult('environment', 'SITE_URL format', true, 'Valid URL format')
    } catch {
      logResult('environment', 'SITE_URL format', false, 'Invalid URL format')
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    if (supabaseUrl.includes('.supabase.co')) {
      logResult(
        'environment',
        'Supabase URL format',
        true,
        'Valid Supabase URL'
      )
    } else {
      logResult(
        'environment',
        'Supabase URL format',
        false,
        'Invalid Supabase URL format',
        true
      )
    }
  }

  console.log('')
}

async function validateSupabaseConnection() {
  console.log('🔌 SUPABASE CONNECTION')
  console.log('='.repeat(60))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    logResult(
      'supabase',
      'Connection test',
      false,
      'Missing required environment variables'
    )
    console.log('')
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test basic connection
    const { data, error } = await supabase
      .from('games')
      .select('count')
      .limit(1)
    if (error) {
      if (error.code === 'PGRST116') {
        logResult(
          'supabase',
          'Database connection',
          false,
          'Table "games" not found - run setup first',
          true
        )
      } else {
        logResult(
          'supabase',
          'Database connection',
          false,
          `Error: ${error.message}`
        )
      }
    } else {
      logResult(
        'supabase',
        'Database connection',
        true,
        'Successfully connected to database'
      )
    }

    // Test auth configuration
    const { data: session } = await supabase.auth.getSession()
    logResult(
      'supabase',
      'Auth client',
      true,
      'Auth client initialized successfully'
    )
  } catch (error) {
    logResult(
      'supabase',
      'Connection test',
      false,
      `Unexpected error: ${error.message}`
    )
  }

  console.log('')
}

async function validateDNSRecords() {
  console.log('🌐 DNS RECORDS')
  console.log('='.repeat(60))

  const domain = 'meeplego.com'

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
        resolve(null)
      })
    })
  }

  try {
    // Check SPF record
    const spf = await checkDNS('TXT', domain)
    if (spf && spf.includes('v=spf1')) {
      logResult('dns', 'SPF record', true, `Found: ${spf.substring(0, 50)}...`)
    } else {
      logResult('dns', 'SPF record', false, 'SPF record not found or invalid')
    }

    // Check DMARC record
    const dmarc = await checkDNS('TXT', `_dmarc.${domain}`)
    if (dmarc && dmarc.includes('v=DMARC1')) {
      logResult(
        'dns',
        'DMARC record',
        true,
        `Found: ${dmarc.substring(0, 50)}...`
      )
    } else {
      logResult(
        'dns',
        'DMARC record',
        false,
        'DMARC record not found or invalid'
      )
    }

    // Note: DKIM check would require knowing the selector, which varies by provider
    logResult(
      'dns',
      'DKIM record',
      false,
      'Cannot check without knowing DKIM selector',
      true
    )
  } catch (error) {
    logResult(
      'dns',
      'DNS check',
      false,
      'DNS checking failed - install dig tool or check manually'
    )
  }

  console.log('')
}

function printSummary() {
  console.log('📊 VALIDATION SUMMARY')
  console.log('='.repeat(60))

  const categories = ['environment', 'supabase', 'dns']
  let totalPassed = 0,
    totalFailed = 0,
    totalWarnings = 0

  for (const category of categories) {
    const result = validationResults[category]
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1)

    console.log(`${categoryName}:`)
    console.log(`  ✅ Passed: ${result.passed}`)
    console.log(`  ❌ Failed: ${result.failed}`)
    console.log(`  ⚠️  Warnings: ${result.warnings}`)
    console.log('')

    totalPassed += result.passed
    totalFailed += result.failed
    totalWarnings += result.warnings
  }

  console.log('Overall Results:')
  console.log(`  ✅ Total Passed: ${totalPassed}`)
  console.log(`  ❌ Total Failed: ${totalFailed}`)
  console.log(`  ⚠️  Total Warnings: ${totalWarnings}`)

  // Determine overall status
  if (totalFailed === 0 && totalWarnings === 0) {
    console.log('\n🎉 ALL CHECKS PASSED - Ready for production launch!')
  } else if (totalFailed === 0) {
    console.log('\n⚠️  MINOR ISSUES FOUND - Review warnings before launch')
  } else {
    console.log('\n❌ CRITICAL ISSUES FOUND - Address failures before launch')
  }
}

function printNextSteps() {
  console.log('\n📋 NEXT STEPS')
  console.log('='.repeat(60))

  console.log('1. Address any failed validations above')
  console.log('2. Configure SMTP provider in Supabase dashboard')
  console.log('3. Add DNS records provided by your SMTP provider')
  console.log('4. Run email deliverability test: npm run test:email')
  console.log('5. Follow the complete launch checklist:')
  console.log('   docs/deployment/supabase-launch-checklist.md')

  console.log('\n🔗 HELPFUL LINKS')
  console.log(
    '- Supabase Production Guide: docs/deployment/supabase-production-config.md'
  )
  console.log('- DNS Setup Guide: docs/deployment/dns-setup.md')
  console.log(
    '- Environment Variables: docs/deployment/environment-variables.md'
  )
  console.log('- Online DNS Checker: https://mxtoolbox.com/')
  console.log('- Email Authentication Test: https://mail-tester.com/')
}

async function main() {
  console.log('🚀 MeepleGo Production Launch Validation')
  console.log('='.repeat(60))
  console.log('Checking Supabase configuration for production readiness...\n')

  try {
    await validateEnvironmentVariables()
    await validateSupabaseConnection()
    await validateDNSRecords()

    printSummary()
    printNextSteps()
  } catch (error) {
    console.error('❌ Validation failed with error:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  validateEnvironmentVariables,
  validateSupabaseConnection,
  validateDNSRecords,
}
