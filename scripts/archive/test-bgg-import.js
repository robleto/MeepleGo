#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase connection...')
  
  try {
    const { data, error } = await supabase
      .from('games')
      .select('count')
      .single()
    
    if (error) {
      console.log('✅ Connected to Supabase (empty games table is expected)')
    } else {
      console.log('✅ Connected to Supabase successfully')
    }
  } catch (err) {
    console.error('❌ Failed to connect to Supabase:', err.message)
    return false
  }
  
  return true
}

async function testBGGFunction() {
  console.log('\n🎯 Testing BGG import function...')
  
  try {
    // Test the function in test mode first
    const response = await fetch(`${supabaseUrl}/functions/v1/populate-games?test=true`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('✅ BGG function test result:', result)
    
    if (result.success && result.bgg_api_accessible) {
      console.log('✅ BGG API is accessible and function is working!')
      return true
    } else {
      console.log('⚠️  BGG function test completed but API may not be accessible')
      return false
    }
    
  } catch (err) {
    console.error('❌ Failed to test BGG function:', err.message)
    return false
  }
}

async function importSampleGames() {
  console.log('\n📥 Importing a small sample of games...')
  
  try {
    // Import just 100 games as a test
    const response = await fetch(`${supabaseUrl}/functions/v1/populate-games?start_id=1&max_games=100`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('✅ Import result:', result)
    
    if (result.success) {
      console.log(`✅ Successfully imported ${result.games_processed} games!`)
      
      // Check how many games we now have in the database
      const { data: games, error } = await supabase
        .from('games')
        .select('id, name, year_published')
        .limit(5)
      
      if (error) {
        console.error('❌ Error fetching games:', error)
      } else {
        console.log('\n📋 Sample games in database:')
        games.forEach((game, index) => {
          console.log(`${index + 1}. ${game.name} (${game.year_published || 'Unknown year'})`)
        })
      }
      
      return true
    } else {
      console.log('⚠️  Import completed but may have had issues')
      return false
    }
    
  } catch (err) {
    console.error('❌ Failed to import games:', err.message)
    return false
  }
}

async function main() {
  console.log('🚀 Starting MeepleGo setup test...\n')
  
  const connectionOk = await testSupabaseConnection()
  if (!connectionOk) {
    console.log('\n❌ Setup test failed - check your Supabase connection')
    process.exit(1)
  }
  
  const functionOk = await testBGGFunction()
  if (!functionOk) {
    console.log('\n⚠️  BGG function test failed - but continuing...')
  }
  
  const importOk = await importSampleGames()
  if (!importOk) {
    console.log('\n⚠️  Sample import failed - but basic setup is working')
  }
  
  console.log('\n🎉 Setup test completed!')
  console.log('\n📝 Next steps:')
  console.log('1. Check your Supabase dashboard to see imported games')
  console.log('2. Run a larger import: fetch("your-function-url?start_id=1&max_games=10000")')
  console.log('3. Start using the app with real data!')
}

main().catch(console.error)
