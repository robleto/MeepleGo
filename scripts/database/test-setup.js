#!/usr/bin/env node

// Test script to verify Supabase connection and BGG edge function
// Run this after setting up the database schema

const testSupabaseConnection = async () => {
  const { createClient } = require('@supabase/supabase-js')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    console.log(
      'Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
    )
    return false
  }

  console.log('🔗 Testing Supabase connection...')

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test basic connection
    const { data, error } = await supabase
      .from('games')
      .select('count(*)')
      .limit(1)

    if (error) {
      console.error('❌ Supabase connection failed:', error.message)
      return false
    }

    console.log('✅ Supabase connection successful!')
    console.log(`📊 Current games in database: ${data?.[0]?.count || 0}`)

    return true
  } catch (error) {
    console.error('❌ Error testing Supabase:', error.message)
    return false
  }
}

const testBGGFunction = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL')
    return false
  }

  console.log('🎲 Testing BGG edge function...')

  try {
    // Test the edge function in test mode
    const response = await fetch(
      `${supabaseUrl}/functions/v1/populate-games?test=true`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error(
        '❌ BGG function request failed:',
        response.status,
        response.statusText
      )
      return false
    }

    const result = await response.json()

    if (result.success) {
      console.log('✅ BGG edge function is working!')
      console.log(`🔥 Hot games found: ${result.hot_games_found}`)
      console.log(
        `🌐 BGG API accessible: ${result.bgg_api_accessible ? 'Yes' : 'No'}`
      )
    } else {
      console.error('❌ BGG function returned error:', result.error)
      return false
    }

    return true
  } catch (error) {
    console.error('❌ Error testing BGG function:', error.message)
    return false
  }
}

const runTests = async () => {
  console.log('🚀 MeepleGo Setup Test')
  console.log('====================\n')

  // Load environment variables
  require('dotenv').config({ path: '.env.local' })

  const supabaseOk = await testSupabaseConnection()
  console.log()

  const bggOk = await testBGGFunction()
  console.log()

  if (supabaseOk && bggOk) {
    console.log('🎉 All tests passed! Your setup is ready.')
    console.log(
      '\nTo populate games from BGG, run the edge function without test mode:'
    )
    console.log(
      `curl -X GET "${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/populate-games?max_games=1000" \\`
    )
    console.log(
      `  -H "Authorization: Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}"`
    )
  } else {
    console.log('❌ Some tests failed. Please check the setup.')
    process.exit(1)
  }
}

runTests().catch(console.error)
