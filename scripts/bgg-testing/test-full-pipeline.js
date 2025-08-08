#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Copy our exact parsing function
function parseXMLToGame(xmlText) {
  const games = [];
  const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/g);
  if (!itemMatches) return games;

  // Helper function to sanitize XML entities
  const sanitizeXMLText = (text) => {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#039;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&nbsp;/g, ' ')        
      .replace(/&mdash;/g, '—')       
      .replace(/&ndash;/g, '–')       
      .replace(/&hellip;/g, '...')    
      .replace(/&lsquo;/g, "'")       
      .replace(/&rsquo;/g, "'")       
      .replace(/&quot;/g, '"')        
      .replace(/&#10;/g, '\n')        
      .replace(/&#13;/g, '\r')        
      .replace(/\s+/g, ' ')           
      .trim();
  };

  console.log(`🔍 Found ${itemMatches.length} item matches in XML`);

  for (const itemMatch of itemMatches) {
    try {
      // Basic parsing like the edge function
      const bggIdMatch = itemMatch.match(/<item[^>]+id="(\d+)"/);
      const nameMatch = itemMatch.match(/<name[^>]+type="primary"[^>]+value="([^"]+)"/);
      const yearMatch = itemMatch.match(/<yearpublished[^>]+value="(\d+)"/);
      
      if (bggIdMatch && nameMatch) {
        const descriptionMatch = itemMatch.match(/<description>([\s\S]*?)<\/description>/);
        const fullDescription = descriptionMatch ? sanitizeXMLText(descriptionMatch[1]) : null;
        
        let summary = null;
        if (fullDescription) {
          const summaryMatch = fullDescription.match(/^(.+?[.!?])(\s|$)/);
          if (summaryMatch) {
            summary = summaryMatch[1].trim();
          }
        }
        
        const game = {
          bgg_id: parseInt(bggIdMatch[1]),
          name: sanitizeXMLText(nameMatch[1]),
          year_published: yearMatch ? parseInt(yearMatch[1]) : null,
          description: fullDescription,
          summary: summary,
          categories: [],
          mechanics: [],
          min_players: null,
          max_players: null,
          playtime_minutes: null,
          publisher: null,
          rank: null,
          rating: null,
          num_ratings: null
        };
        
        games.push(game);
        console.log(`✅ Parsed: ${game.name} (${game.bgg_id})`);
        console.log(`   Summary: "${game.summary || 'No summary'}"`);
      } else {
        console.warn(`⚠️ Missing required fields for item`);
      }
    } catch (error) {
      console.error('❌ Error parsing item:', error);
    }
  }

  return games;
}

async function localTest() {
  console.log('🧪 Testing full import pipeline locally...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, serviceKey);
  
  try {
    // Get just a few games for testing
    console.log('📡 Fetching hot games...');
    const hotResponse = await fetch('https://boardgamegeek.com/xmlapi2/hot?type=boardgame');
    const hotXml = await hotResponse.text();
    
    const idMatches = hotXml.match(/<item[^>]*id="(\d+)"/g);
    const gameIds = idMatches.slice(0, 3).map(match => {
      const idMatch = match.match(/id="(\d+)"/);
      return idMatch ? idMatch[1] : null;
    }).filter(Boolean);
    
    console.log(`🎯 Testing with IDs: ${gameIds.join(', ')}`);
    
    // Get game details
    console.log('📡 Fetching game details...');
    const detailUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${gameIds.join(',')}&type=boardgame&stats=1`;
    const detailResponse = await fetch(detailUrl);
    const detailXml = await detailResponse.text();
    
    console.log(`📊 XML Response length: ${detailXml.length}`);
    
    // Parse games
    console.log('🔍 Parsing games...');
    const games = parseXMLToGame(detailXml);
    console.log(`📊 Parsed ${games.length} games`);
    
    if (games.length === 0) {
      console.log('❌ No games parsed - stopping test');
      return;
    }
    
    // Try to store one game
    const testGame = games[0];
    console.log('💾 Testing database insert...');
    console.log('📋 Game object:', JSON.stringify(testGame, null, 2));
    
    const { data, error } = await supabase
      .from('games')
      .upsert({
        ...testGame,
        cached_at: new Date().toISOString()
      }, {
        onConflict: 'bgg_id',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error('❌ Database error:', error);
    } else {
      console.log('✅ Successfully stored game!');
      console.log('📊 Stored data:', data[0]);
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error.message);
  }
}

localTest();
