#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkGamesTable() {
  console.log('🔍 Checking games table...')

  try {
    // Get count of games
    const { count, error: countError } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Error getting count:', countError)
      return
    }

    console.log(`📊 Total games in database: ${count || 0}`)

    // Get a few sample games
    const { data: sampleGames, error: sampleError } = await supabase
      .from('games')
      .select('id, name, bgg_id, year_published, cached_at')
      .limit(5)
      .order('created_at', { ascending: false })

    if (sampleError) {
      console.error('❌ Error getting sample games:', sampleError)
      return
    }

    if (sampleGames && sampleGames.length > 0) {
      console.log('\n📋 Recent games:')
      sampleGames.forEach((game, index) => {
        console.log(
          `${index + 1}. ${game.name} (BGG ID: ${game.bgg_id}, Year: ${game.year_published || 'Unknown'})`
        )
      })
    } else {
      console.log('📭 No games found in database')
    }

    // Test inserting a single game manually
    console.log('\n🧪 Testing manual game insertion...')

    const testGame = {
      bgg_id: 999999,
      name: 'Test Game',
      year_published: 2024,
      cached_at: new Date().toISOString(),
    }

    const { data: insertData, error: insertError } = await supabase
      .from('games')
      .upsert(testGame, {
        onConflict: 'bgg_id',
        ignoreDuplicates: false,
      })
      .select()

    if (insertError) {
      console.error('❌ Error inserting test game:', insertError)
    } else {
      console.log('✅ Test game inserted successfully:', insertData)

      // Clean up test game
      await supabase.from('games').delete().eq('bgg_id', 999999)

      console.log('🧹 Test game cleaned up')
    }
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

checkGamesTable()
