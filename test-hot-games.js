#!/usr/bin/env node

// Test the current BGG hot games specifically
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testHotGames() {
  console.log('🌶️ Testing BGG hot games specifically...')
  
  try {
    // Get hot games list
    console.log('📡 Fetching hot games list...')
    const hotResponse = await fetch('https://boardgamegeek.com/xmlapi2/hot?type=boardgame')
    if (!hotResponse.ok) {
      throw new Error(`Hot games API failed: ${hotResponse.status}`)
    }
    
    const hotXML = await hotResponse.text()
    console.log(`✅ Hot games XML (${hotXML.length} characters)`)
    
    // Extract IDs
    const hotIds = []
    const itemMatches = hotXML.match(/<item[^>]*>/g)
    for (const match of itemMatches || []) {
      const idMatch = match.match(/id="(\d+)"/)
      if (idMatch) hotIds.push(parseInt(idMatch[1]))
    }
    
    console.log(`🎯 Found ${hotIds.length} hot games:`, hotIds.slice(0, 5), '...')
    
    // Test first 3 games
    if (hotIds.length > 0) {
      const testIds = hotIds.slice(0, 3)
      console.log(`\n🧪 Testing first 3 games: ${testIds.join(', ')}`)
      
      const detailResponse = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${testIds.join(',')}&type=boardgame&stats=1`)
      if (!detailResponse.ok) {
        throw new Error(`Details API failed: ${detailResponse.status}`)
      }
      
      const detailXML = await detailResponse.text()
      console.log(`✅ Details XML (${detailXML.length} characters)`)
      
      // Parse each game
      const itemMatches = detailXML.match(/<item[^>]*>[\s\S]*?<\/item>/g)
      console.log(`📋 Found ${itemMatches?.length || 0} items in response`)
      
      if (itemMatches) {
        for (let i = 0; i < Math.min(itemMatches.length, 3); i++) {
          const itemMatch = itemMatches[i]
          
          const bggIdMatch = itemMatch.match(/<item[^>]+id="(\d+)"/)
          const nameMatch = itemMatch.match(/<name[^>]+type="primary"[^>]+value="([^"]+)"/)
          const yearMatch = itemMatch.match(/<yearpublished[^>]+value="(\d+)"/)
          
          console.log(`\n🔍 Game ${i + 1}:`)
          console.log(`   BGG ID: ${bggIdMatch ? bggIdMatch[1] : 'NOT FOUND'}`)
          console.log(`   Name: ${nameMatch ? nameMatch[1] : 'NOT FOUND'}`)
          console.log(`   Year: ${yearMatch ? yearMatch[1] : 'NOT FOUND'}`)
          
          if (bggIdMatch && nameMatch) {
            const gameData = {
              bgg_id: parseInt(bggIdMatch[1]),
              name: nameMatch[1],
              year_published: yearMatch ? parseInt(yearMatch[1]) : null,
              cached_at: new Date().toISOString()
            }
            
            console.log(`   📝 Attempting to store...`)
            
            const { data, error } = await supabase
              .from('games')
              .upsert(gameData, {
                onConflict: 'bgg_id',
                ignoreDuplicates: false
              })
              .select()
            
            if (error) {
              console.log(`   ❌ Error: ${error.message}`)
            } else {
              console.log(`   ✅ Stored successfully!`)
            }
          } else {
            console.log(`   ❌ Failed to parse this game`)
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testHotGames()
