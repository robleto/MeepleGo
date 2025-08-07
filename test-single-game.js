#!/usr/bin/env node

// Test a single BGG game to understand what's happening
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSingleGameImport() {
  console.log('🧪 Testing single game import...')
  
  try {
    // Test with Gloomhaven (known good game)
    const bggId = 174430
    console.log(`📡 Fetching BGG data for game ID ${bggId}...`)
    
    const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&type=boardgame&stats=1`)
    if (!response.ok) {
      throw new Error(`BGG API failed: ${response.status}`)
    }
    
    const xmlText = await response.text()
    console.log(`✅ Received XML (${xmlText.length} characters)`)
    
    // Parse using our improved parsing function
    function parseXMLToGame(xmlText) {
      try {
        // Extract basic game info - using attribute values, not inner text
        const bggIdMatch = xmlText.match(/<item[^>]+id="(\d+)"/)
        const nameMatch = xmlText.match(/<name[^>]+type="primary"[^>]+value="([^"]+)"/)
        const yearMatch = xmlText.match(/<yearpublished[^>]+value="(\d+)"/)
        const minPlayersMatch = xmlText.match(/<minplayers[^>]+value="(\d+)"/)
        const maxPlayersMatch = xmlText.match(/<maxplayers[^>]+value="(\d+)"/)
        const playtimeMatch = xmlText.match(/<playingtime[^>]+value="(\d+)"/)
        const publisherMatch = xmlText.match(/<link[^>]+type="boardgamepublisher"[^>]+value="([^"]+)"/)
        
        // Extract rating info from statistics section - these have different patterns
        const ratingMatch = xmlText.match(/<average[^>]+value="([^"]+)"/)
        const rankMatch = xmlText.match(/<rank[^>]+type="subtype"[^>]+name="boardgame"[^>]+value="(\d+)"/)
        const numRatingsMatch = xmlText.match(/<usersrated[^>]+value="(\d+)"/)
        
        if (!bggIdMatch || !nameMatch) {
          console.log('❌ Missing required fields (ID or name)')
          return null
        }
        
        const gameData = {
          bgg_id: parseInt(bggIdMatch[1]),
          name: nameMatch[1],
          year_published: yearMatch ? parseInt(yearMatch[1]) : null,
          min_players: minPlayersMatch ? parseInt(minPlayersMatch[1]) : null,
          max_players: maxPlayersMatch ? parseInt(maxPlayersMatch[1]) : null,
          playtime_minutes: playtimeMatch ? parseInt(playtimeMatch[1]) : null,
          publisher: publisherMatch ? publisherMatch[1] : null,
          rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
          rank: rankMatch ? parseInt(rankMatch[1]) : null,
          num_ratings: numRatingsMatch ? parseInt(numRatingsMatch[1]) : null,
          cached_at: new Date().toISOString()
        }
        
        return gameData
      } catch (error) {
        console.error('❌ Parse error:', error.message)
        return null
      }
    }
    
    const gameData = parseXMLToGame(xmlText)
    
    console.log('🔍 Parsing results:')
    if (gameData) {
      console.log('   BGG ID:', gameData.bgg_id)
      console.log('   Name:', gameData.name)
      console.log('   Year:', gameData.year_published)
      console.log('   Players:', `${gameData.min_players}-${gameData.max_players}`)
      console.log('   Playtime:', gameData.playtime_minutes, 'minutes')
      console.log('   Publisher:', gameData.publisher)
      console.log('   Rating:', gameData.rating)
      console.log('   Rank:', gameData.rank)
      console.log('   Num Ratings:', gameData.num_ratings)
    } else {
      console.log('   ❌ Failed to parse game data')
    }
    
    if (gameData) {
      
      console.log('📝 Attempting to insert game:', gameData)
      
      const { data, error } = await supabase
        .from('games')
        .upsert(gameData, {
          onConflict: 'bgg_id',
          ignoreDuplicates: false
        })
        .select()
      
      if (error) {
        console.error('❌ Database error:', error)
      } else {
        console.log('✅ Successfully inserted:', data)
      }
    } else {
      console.error('❌ Failed to parse game data')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testSingleGameImport()
