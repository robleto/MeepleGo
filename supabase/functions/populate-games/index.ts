import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Improved rate limiting with exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// BGG API rate limiting settings
const BGG_RATE_LIMIT = {
  MIN_DELAY: 2000,    // Minimum 2 seconds between requests
  MAX_DELAY: 30000,   // Maximum 30 seconds for retries
  MAX_RETRIES: 3,     // Maximum retry attempts
  BATCH_SIZE: 25,     // Smaller batch size to be more respectful
  ERROR_DELAY: 5000   // Delay on errors
};

function parseXMLToGame(xmlText: string): any[] {
  const games: any[] = [];
  const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/g);
  if (!itemMatches) return games;

  // Helper function to sanitize XML entities
  const sanitizeXMLText = (text: string): string => {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#039;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&nbsp;/g, ' ')        // Non-breaking space to regular space
      .replace(/&mdash;/g, '—')       // Em dash
      .replace(/&ndash;/g, '–')       // En dash
      .replace(/&hellip;/g, '...')    // Ellipsis
      .replace(/&lsquo;/g, "'")       // Left single quote
      .replace(/&rsquo;/g, "'")       // Right single quote
      .replace(/&quot;/g, '"')        // Double quote
      .replace(/&#10;/g, '\n')        // Line break
      .replace(/&#13;/g, '\r')        // Carriage return
      .replace(/\s+/g, ' ')           // Normalize multiple spaces to single space
      .trim();
  };

  for (const itemMatch of itemMatches) {
    try {
      // ✅ BASIC GAME INFO
      const bggIdMatch = itemMatch.match(/<item[^>]+id="(\d+)"/);
      const nameMatch = itemMatch.match(/<name[^>]+type="primary"[^>]+value="([^"]+)"/);
      const yearMatch = itemMatch.match(/<yearpublished[^>]+value="(\d+)"/);
      
      // ✅ IMAGES - Fixed to ensure they're not skipped
      const imageMatch = itemMatch.match(/<image>([^<]+)<\/image>/);
      const thumbnailMatch = itemMatch.match(/<thumbnail>([^<]+)<\/thumbnail>/);
      
      // ✅ DESCRIPTION - Fixed with non-greedy multiline regex
      const descriptionMatch = itemMatch.match(/<description>([\s\S]*?)<\/description>/);
      
      // ✅ PLAYER INFO
      const minPlayersMatch = itemMatch.match(/<minplayers[^>]+value="(\d+)"/);
      const maxPlayersMatch = itemMatch.match(/<maxplayers[^>]+value="(\d+)"/);
      const playtimeMatch = itemMatch.match(/<playingtime[^>]+value="(\d+)"/);
      
      // ✅ CATEGORIES - Fixed to always return arrays
      const categoryMatches = itemMatch.match(/<link[^>]+type="boardgamecategory"[^>]+value="([^"]+)"/g);
      const categories = categoryMatches?.map(match => {
        const valueMatch = match.match(/value="([^"]+)"/);
        return valueMatch ? sanitizeXMLText(valueMatch[1]) : '';
      }).filter(Boolean) || [];

      // ✅ MECHANICS - Fixed to always return arrays  
      const mechanicMatches = itemMatch.match(/<link[^>]+type="boardgamemechanic"[^>]+value="([^"]+)"/g);
      const mechanics = mechanicMatches?.map(match => {
        const valueMatch = match.match(/value="([^"]+)"/);
        return valueMatch ? sanitizeXMLText(valueMatch[1]) : '';
      }).filter(Boolean) || [];

      // ✅ PUBLISHER
      const publisherMatch = itemMatch.match(/<link[^>]+type="boardgamepublisher"[^>]+value="([^"]+)"/);
      const publisher = publisherMatch ? sanitizeXMLText(publisherMatch[1]) : null;

      // ✅ RATINGS DATA from statistics section
      const usersRatedMatch = itemMatch.match(/<usersrated[^>]+value="(\d+)"/);
      const averageRatingMatch = itemMatch.match(/<average[^>]+value="([\d.]+)"/);
      const rankMatch = itemMatch.match(/<rank[^>]+name="boardgame"[^>]+value="(\d+)"/);

      if (bggIdMatch && nameMatch) {
        // ✅ Process description and extract summary
        const fullDescription = descriptionMatch ? sanitizeXMLText(descriptionMatch[1]) : null;
        let summary = null;
        
        if (fullDescription) {
          // Extract first sentence using regex: ^(.+?[.!?])(\s|$)
          const summaryMatch = fullDescription.match(/^(.+?[.!?])(\s|$)/);
          if (summaryMatch) {
            summary = summaryMatch[1].trim();
          }
        }
        
        const game = {
          bgg_id: parseInt(bggIdMatch[1]),
          name: sanitizeXMLText(nameMatch[1]),
          year_published: yearMatch ? parseInt(yearMatch[1]) : null,
          
          // ✅ Images - ensure these are properly extracted
          image_url: imageMatch?.[1] || null,
          thumbnail_url: thumbnailMatch?.[1] || null,
          
          // ✅ Description - properly sanitized
          description: fullDescription,
          
          // ➕ TODO: Summary - first sentence from description (column needs to be added to DB)
          // summary: summary,
          
          // ✅ Arrays - always return arrays, even empty ones (for current schema)
          categories: categories.length > 0 ? categories : [],
          mechanics: mechanics.length > 0 ? mechanics : [],
          
          // ✅ Player info
          min_players: minPlayersMatch ? parseInt(minPlayersMatch[1]) : null,
          max_players: maxPlayersMatch ? parseInt(maxPlayersMatch[1]) : null,
          playtime_minutes: playtimeMatch ? parseInt(playtimeMatch[1]) : null,
          
          // ✅ Publisher
          publisher,
          
          // ✅ Ratings data
          rank: rankMatch ? parseInt(rankMatch[1]) : null,
          rating: averageRatingMatch ? parseFloat(averageRatingMatch[1]) : null,
          num_ratings: usersRatedMatch ? parseInt(usersRatedMatch[1]) : null
        };
        
        games.push(game);
        console.log(`✅ Parsed game: ${game.name} (BGG ${game.bgg_id})`);
        console.log(`   Players: ${game.min_players}-${game.max_players}, Time: ${game.playtime_minutes}min`);
        console.log(`   Rating: ${game.rating}, Rank: ${game.rank}`);
        console.log(`   Categories: [${game.categories.slice(0,3).join(', ')}${game.categories.length > 3 ? '...' : ''}] (${game.categories.length})`);
        console.log(`   Mechanics: [${game.mechanics.slice(0,3).join(', ')}${game.mechanics.length > 3 ? '...' : ''}] (${game.mechanics.length})`);
        console.log(`   Images: ${game.image_url ? '✅' : '❌'} Description: ${game.description ? '✅' : '❌'}`);
        // TODO: Add summary logging when column is added to DB
        // console.log(`   Summary: "${summary}"`);
      } else {
        console.warn(`⚠️ Could not parse game from XML segment (missing ID or name)`);
      }
    } catch (error) {
      console.error('❌ Error parsing game item:', error);
    }
  }

  console.log(`📊 Successfully parsed ${games.length} games from XML response`);
  return games;
}

async function fetchHotGameIds(): Promise<number[]> {
  console.log("📡 Fetching BGG hot games list...");
  
  let retries = 0;
  while (retries < BGG_RATE_LIMIT.MAX_RETRIES) {
    try {
      const response = await fetch("https://boardgamegeek.com/xmlapi2/hot?type=boardgame");
      
      if (response.status === 429) {
        console.warn(`⏳ Rate limited, retrying in ${BGG_RATE_LIMIT.ERROR_DELAY}ms...`);
        await delay(BGG_RATE_LIMIT.ERROR_DELAY * (retries + 1));
        retries++;
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch hot list: ${response.status}`);
      }
      
      const xmlText = await response.text();
      const ids: number[] = [];

      const itemMatches = xmlText.match(/<item[^>]*>/g);
      for (const match of itemMatches ?? []) {
        const idMatch = match.match(/id="(\d+)"/);
        if (idMatch) ids.push(parseInt(idMatch[1]));
      }

      console.log(`✅ Found ${ids.length} hot games`);
      return ids;
      
    } catch (error) {
      console.error(`❌ Attempt ${retries + 1} failed:`, error);
      retries++;
      if (retries < BGG_RATE_LIMIT.MAX_RETRIES) {
        await delay(BGG_RATE_LIMIT.ERROR_DELAY * retries);
      }
    }
  }
  
  throw new Error("Failed to fetch hot games after maximum retries");
}

async function fetchAndStoreGames(supabase: any, ids: number[]) {
  let storedCount = 0;
  let errorCount = 0;
  const totalBatches = Math.ceil(ids.length / BGG_RATE_LIMIT.BATCH_SIZE);

  console.log(`🔄 Processing ${ids.length} games in ${totalBatches} batches of ${BGG_RATE_LIMIT.BATCH_SIZE}`);

  for (let i = 0; i < ids.length; i += BGG_RATE_LIMIT.BATCH_SIZE) {
    const batch = ids.slice(i, i + BGG_RATE_LIMIT.BATCH_SIZE);
    const batchNumber = Math.floor(i / BGG_RATE_LIMIT.BATCH_SIZE) + 1;
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${batch.join(",")}&type=boardgame&stats=1`;

    console.log(`📦 Batch ${batchNumber}/${totalBatches}: Fetching games ${batch.join(",")}`);

    let retries = 0;
    while (retries < BGG_RATE_LIMIT.MAX_RETRIES) {
      try {
        const res = await fetch(url);
        
        if (res.status === 429) {
          console.warn(`⏳ Rate limited on batch ${batchNumber}, waiting...`);
          await delay(BGG_RATE_LIMIT.ERROR_DELAY * (retries + 1));
          retries++;
          continue;
        }
        
        if (!res.ok) {
          console.warn(`⚠️ Failed to fetch batch ${batchNumber}: HTTP ${res.status}`);
          errorCount++;
          break;
        }

        const xmlText = await res.text();
        
        // Check for valid XML response
        if (!xmlText.includes('<item')) {
          console.warn(`⚠️ Invalid XML response for batch ${batchNumber}`);
          errorCount++;
          break;
        }
        
        const games = parseXMLToGame(xmlText);
        console.log(`📝 Parsed ${games.length} games from batch ${batchNumber}`);

        // Store games in database
        for (const game of games) {
          try {
            const { error } = await supabase.from("games").upsert({
              ...game,
              cached_at: new Date().toISOString()
            }, {
              onConflict: "bgg_id",
              ignoreDuplicates: false
            });

            if (error) {
              console.error(`❌ Error saving game ${game.bgg_id}:`, error.message);
              errorCount++;
            } else {
              storedCount++;
            }
          } catch (dbError) {
            console.error(`❌ Database error for game ${game.bgg_id}:`, dbError);
            errorCount++;
          }
        }

        // Success - break out of retry loop
        break;
        
      } catch (err) {
        console.error(`❌ Network error on batch ${batchNumber}, attempt ${retries + 1}:`, err);
        retries++;
        if (retries < BGG_RATE_LIMIT.MAX_RETRIES) {
          await delay(BGG_RATE_LIMIT.ERROR_DELAY * retries);
        }
      }
    }

    // Rate limiting delay between batches
    if (i + BGG_RATE_LIMIT.BATCH_SIZE < ids.length) {
      console.log(`⏳ Waiting ${BGG_RATE_LIMIT.MIN_DELAY}ms before next batch...`);
      await delay(BGG_RATE_LIMIT.MIN_DELAY);
    }
  }

  console.log(`🎉 Import completed: ${storedCount} games stored, ${errorCount} errors`);
  return { storedCount, errorCount };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      // @ts-ignore: Deno global is available in edge functions
      Deno.env.get("SUPABASE_URL") ?? "",
      // @ts-ignore: Deno global is available in edge functions  
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("🌶️ Starting BGG hot games import...");
    const hotIds = await fetchHotGameIds();
    console.log(`🧠 Got ${hotIds.length} hot games to process.`);

    const result = await fetchAndStoreGames(supabase, hotIds);

    return new Response(JSON.stringify({
      success: true,
      message: "BGG hot games import completed successfully",
      games_found: hotIds.length,
      games_stored: result.storedCount,
      errors: result.errorCount,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });

  } catch (error) {
    console.error("❌ Error in handler:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
