#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Copy our exact parsing function from the edge function
function parseXMLToGame(xmlText) {
  const games = [];
  const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/g);
  if (!itemMatches) return games;

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

  for (const itemMatch of itemMatches) {
    try {
      // BASIC GAME INFO
      const bggIdMatch = itemMatch.match(/<item[^>]+id="(\d+)"/);
      const nameMatch = itemMatch.match(/<name[^>]+type="primary"[^>]+value="([^"]+)"/);
      const yearMatch = itemMatch.match(/<yearpublished[^>]+value="(\d+)"/);
      
      // IMAGES
      const imageMatch = itemMatch.match(/<image>([^<]+)<\/image>/);
      const thumbnailMatch = itemMatch.match(/<thumbnail>([^<]+)<\/thumbnail>/);
      
      // DESCRIPTION
      const descriptionMatch = itemMatch.match(/<description>([\s\S]*?)<\/description>/);
      
      // PLAYER INFO
      const minPlayersMatch = itemMatch.match(/<minplayers[^>]+value="(\d+)"/);
      const maxPlayersMatch = itemMatch.match(/<maxplayers[^>]+value="(\d+)"/);
      const playtimeMatch = itemMatch.match(/<playingtime[^>]+value="(\d+)"/);
      
      // CATEGORIES
      const categoryMatches = itemMatch.match(/<link[^>]+type="boardgamecategory"[^>]+value="([^"]+)"/g);
      const categories = categoryMatches?.map(match => {
        const valueMatch = match.match(/value="([^"]+)"/);
        return valueMatch ? sanitizeXMLText(valueMatch[1]) : '';
      }).filter(Boolean) || [];

      // MECHANICS
      const mechanicMatches = itemMatch.match(/<link[^>]+type="boardgamemechanic"[^>]+value="([^"]+)"/g);
      const mechanics = mechanicMatches?.map(match => {
        const valueMatch = match.match(/value="([^"]+)"/);
        return valueMatch ? sanitizeXMLText(valueMatch[1]) : '';
      }).filter(Boolean) || [];

      // PUBLISHER
      const publisherMatch = itemMatch.match(/<link[^>]+type="boardgamepublisher"[^>]+value="([^"]+)"/);
      const publisher = publisherMatch ? sanitizeXMLText(publisherMatch[1]) : null;

      // RATINGS DATA
      const usersRatedMatch = itemMatch.match(/<usersrated[^>]+value="(\d+)"/);
      const averageRatingMatch = itemMatch.match(/<average[^>]+value="([\d.]+)"/);
      const rankMatch = itemMatch.match(/<rank[^>]+name="boardgame"[^>]+value="(\d+)"/);

      if (bggIdMatch && nameMatch) {
        // Process description and extract summary
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
          
          image_url: imageMatch?.[1] || null,
          thumbnail_url: thumbnailMatch?.[1] || null,
          
          description: fullDescription,
          summary: summary,
          
          categories: categories.length > 0 ? categories : [],
          mechanics: mechanics.length > 0 ? mechanics : [],
          
          min_players: minPlayersMatch ? parseInt(minPlayersMatch[1]) : null,
          max_players: maxPlayersMatch ? parseInt(maxPlayersMatch[1]) : null,
          playtime_minutes: playtimeMatch ? parseInt(playtimeMatch[1]) : null,
          
          publisher,
          
          rank: rankMatch ? parseInt(rankMatch[1]) : null,
          rating: averageRatingMatch ? parseFloat(averageRatingMatch[1]) : null,
          num_ratings: usersRatedMatch ? parseInt(usersRatedMatch[1]) : null
        };
        
        games.push(game);
        console.log(`✅ Parsed: ${game.name} (BGG ${game.bgg_id})`);
        console.log(`   Summary: "${game.summary || 'No summary'}"`);
      }
    } catch (error) {
      console.error('❌ Error parsing game item:', error);
    }
  }

  return games;
}

async function populateLocalBGGData() {
  console.log('🚀 Starting local BGG data population...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, serviceKey);
  let storedCount = 0;
  let errorCount = 0;
  
  try {
    // Get hot games list
    console.log('📡 Fetching BGG hot games...');
    const hotResponse = await fetch('https://boardgamegeek.com/xmlapi2/hot?type=boardgame');
    const hotXml = await hotResponse.text();
    
    const idMatches = hotXml.match(/<item[^>]*id="(\d+)"/g);
    const gameIds = idMatches?.map(match => {
      const idMatch = match.match(/id="(\d+)"/);
      return idMatch ? parseInt(idMatch[1]) : null;
    }).filter(Boolean) || [];
    
    console.log(`🎯 Found ${gameIds.length} hot games to process`);
    
    // Process in batches of 25
    const batchSize = 25;
    for (let i = 0; i < gameIds.length; i += batchSize) {
      const batch = gameIds.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(gameIds.length / batchSize);
      
      console.log(`\n📦 Batch ${batchNumber}/${totalBatches}: Processing ${batch.length} games`);
      
      // Fetch game details
      const detailUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${batch.join(',')}&type=boardgame&stats=1`;
      const detailResponse = await fetch(detailUrl);
      
      if (!detailResponse.ok) {
        console.error(`❌ Failed to fetch batch ${batchNumber}: ${detailResponse.status}`);
        errorCount++;
        continue;
      }
      
      const detailXml = await detailResponse.text();
      
      // Parse games
      const games = parseXMLToGame(detailXml);
      console.log(`📝 Parsed ${games.length} games from batch ${batchNumber}`);
      
      // Store games
      for (const game of games) {
        try {
          const { data, error } = await supabase
            .from('games')
            .upsert({
              ...game,
              cached_at: new Date().toISOString()
            }, {
              onConflict: 'bgg_id',
              ignoreDuplicates: false
            })
            .select('bgg_id, name, summary');
          
          if (error) {
            console.error(`❌ Error storing ${game.name}:`, error.message);
            errorCount++;
          } else {
            storedCount++;
            console.log(`💾 Stored: ${data[0].name}`);
            if (data[0].summary) {
              console.log(`   Summary: "${data[0].summary}"`);
            }
          }
        } catch (dbError) {
          console.error(`❌ Database error for ${game.name}:`, dbError);
          errorCount++;
        }
      }
      
      // Rate limiting
      if (i + batchSize < gameIds.length) {
        console.log('⏳ Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n🎉 Import completed!`);
    console.log(`📊 Results: ${storedCount} games stored, ${errorCount} errors`);
    
    // Show sample of what was stored
    const { data: sampleGames } = await supabase
      .from('games')
      .select('name, year_published, summary')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (sampleGames && sampleGames.length > 0) {
      console.log('\n📋 Recently stored games:');
      sampleGames.forEach(game => {
        console.log(`  • ${game.name} (${game.year_published || 'Unknown'})`);
        if (game.summary) {
          console.log(`    "${game.summary}"`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error in import:', error.message);
  }
}

populateLocalBGGData();
