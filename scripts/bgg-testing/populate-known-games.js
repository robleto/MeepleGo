#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Simplified approach - get a few popular games we know work
async function populateWithKnownGames() {
  console.log('🚀 Populating with known popular games...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, serviceKey);
  
  // Popular games that we know exist and work
  const popularGameIds = [
    174430, // Gloomhaven
    233078, // Twilight Imperium: Fourth Edition  
    167791, // Terraforming Mars
    161936, // Pandemic Legacy: Season 1
    182028, // Through the Ages: A New Story of Civilization
    124361, // Codenames
    169786, // Scythe
    173346, // 7 Wonders Duel
    148228, // Splendor
    120677  // Terra Mystica
  ];
  
  let storedCount = 0;
  
  for (const gameId of popularGameIds) {
    try {
      console.log(`\n📡 Fetching game ${gameId}...`);
      
      const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&type=boardgame&stats=1`);
      
      if (!response.ok) {
        console.error(`❌ Failed to fetch game ${gameId}: ${response.status}`);
        continue;
      }
      
      const xmlText = await response.text();
      
      // Simple parsing for name and description
      const nameMatch = xmlText.match(/<name[^>]+type="primary"[^>]+value="([^"]+)"/);
      const yearMatch = xmlText.match(/<yearpublished[^>]+value="(\d+)"/);
      const descMatch = xmlText.match(/<description>([\s\S]*?)<\/description>/);
      const imageMatch = xmlText.match(/<image>([^<]+)<\/image>/);
      const thumbnailMatch = xmlText.match(/<thumbnail>([^<]+)<\/thumbnail>/);
      const minPlayersMatch = xmlText.match(/<minplayers[^>]+value="(\d+)"/);
      const maxPlayersMatch = xmlText.match(/<maxplayers[^>]+value="(\d+)"/);
      const playtimeMatch = xmlText.match(/<playingtime[^>]+value="(\d+)"/);
      const ratingMatch = xmlText.match(/<average[^>]+value="([\d.]+)"/);
      const rankMatch = xmlText.match(/<rank[^>]+name="boardgame"[^>]+value="(\d+)"/);
      
      if (!nameMatch) {
        console.error(`❌ Could not parse name for game ${gameId}`);
        continue;
      }
      
      const name = nameMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      
      let description = null;
      let summary = null;
      
      if (descMatch) {
        description = descMatch[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&nbsp;/g, ' ')
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .trim();
          
        // Extract summary
        const summaryMatch = description.match(/^(.+?[.!?])(\s|$)/);
        if (summaryMatch) {
          summary = summaryMatch[1].trim();
        }
      }
      
      const game = {
        bgg_id: gameId,
        name: name,
        year_published: yearMatch ? parseInt(yearMatch[1]) : null,
        image_url: imageMatch?.[1] || null,
        thumbnail_url: thumbnailMatch?.[1] || null,
        description: description,
        summary: summary,
        categories: [],
        mechanics: [],
        min_players: minPlayersMatch ? parseInt(minPlayersMatch[1]) : null,
        max_players: maxPlayersMatch ? parseInt(maxPlayersMatch[1]) : null,
        playtime_minutes: playtimeMatch ? parseInt(playtimeMatch[1]) : null,
        publisher: null,
        rank: rankMatch ? parseInt(rankMatch[1]) : null,
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
        num_ratings: null,
        cached_at: new Date().toISOString()
      };
      
      console.log(`✅ Parsed: ${game.name}`);
      console.log(`   Summary: "${game.summary || 'No summary'}"`);
      
      // Store in database
      const { data, error } = await supabase
        .from('games')
        .upsert(game, {
          onConflict: 'bgg_id',
          ignoreDuplicates: false
        })
        .select('name, summary');
      
      if (error) {
        console.error(`❌ Error storing ${game.name}:`, error.message);
      } else {
        storedCount++;
        console.log(`💾 Stored: ${data[0].name}`);
      }
      
      // Rate limiting
      console.log('⏳ Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error processing game ${gameId}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Import completed! Stored ${storedCount} games`);
  
  // Show final results
  const { data: allGames } = await supabase
    .from('games')
    .select('name, year_published, rating, summary')
    .order('rating', { ascending: false, nullsLast: true });
  
  if (allGames && allGames.length > 0) {
    console.log(`\n📊 Total games in database: ${allGames.length}`);
    console.log('\n🏆 Top games by rating:');
    allGames.slice(0, 5).forEach((game, index) => {
      console.log(`  ${index + 1}. ${game.name} (${game.year_published || 'Unknown'}) - Rating: ${game.rating || 'N/A'}`);
      if (game.summary) {
        console.log(`     "${game.summary}"`);
      }
    });
  }
}

populateWithKnownGames();
