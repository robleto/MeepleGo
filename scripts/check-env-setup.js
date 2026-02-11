#!/usr/bin/env node

// Simple script to check environment setup before running the population script

const fs = require('fs')
const path = require('path')

console.log('🔧 Checking environment setup...\n')

// Check if .env file exists
const envPath = path.join(__dirname, '../.env.local')
const envExists = fs.existsSync(envPath)

if (!envExists) {
  console.log('❌ .env.local file not found')
  console.log('📝 Please create a .env.local file in your project root with:')
  console.log('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  console.log('   (You can find these in your Supabase project settings)')
  process.exit(1)
}

// Load environment variables
require('dotenv').config({ path: envPath })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log(`✅ .env.local file found`)
console.log(
  `${supabaseUrl ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Missing'}`
)
console.log(
  `${supabaseServiceKey ? '✅' : '❌'} SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'Set' : 'Missing'}`
)

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('\n❌ Missing required environment variables')
  console.log(
    '📝 Please ensure both NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
  )
  process.exit(1)
}

console.log('\n✅ Environment setup looks good!')
console.log('\n📋 Next steps:')
console.log('Awards data now pulls from AwardsAPI.')
console.log(
  'If you need to validate the API, open /awards and /awards/industry in the app.'
)
