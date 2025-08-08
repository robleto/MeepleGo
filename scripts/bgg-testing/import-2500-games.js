#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

class BGGImporter {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.existingGameIds = new Set();
    this.processedCount = 0;
    this.storedCount = 0;
    this.skippedCount = 0;
    this.errorCount = 0;
  }

  sanitizeXMLText(text) {
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
  }

  async loadExistingGameIds() {
    console.log('📊 Loading existing game IDs from database...');
    
    const { data, error } = await this.supabase
      .from('games')
      .select('bgg_id');
    
    if (error) {
      console.error('❌ Error loading existing games:', error);
      return;
    }
    
    this.existingGameIds = new Set(data.map(game => game.bgg_id));
    console.log(`✅ Found ${this.existingGameIds.size} existing games in database`);
  }

  parseGame(xmlText, gameId) {
    try {
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
      const usersRatedMatch = xmlText.match(/<usersrated[^>]+value="(\d+)"/);
      
      // Categories
      const categoryMatches = xmlText.match(/<link[^>]+type="boardgamecategory"[^>]+value="([^"]+)"/g);
      const categories = categoryMatches?.map(match => {
        const valueMatch = match.match(/value="([^"]+)"/);
        return valueMatch ? this.sanitizeXMLText(valueMatch[1]) : '';
      }).filter(Boolean) || [];

      // Mechanics
      const mechanicMatches = xmlText.match(/<link[^>]+type="boardgamemechanic"[^>]+value="([^"]+)"/g);
      const mechanics = mechanicMatches?.map(match => {
        const valueMatch = match.match(/value="([^"]+)"/);
        return valueMatch ? this.sanitizeXMLText(valueMatch[1]) : '';
      }).filter(Boolean) || [];

      // Publisher
      const publisherMatch = xmlText.match(/<link[^>]+type="boardgamepublisher"[^>]+value="([^"]+)"/);
      
      if (!nameMatch) {
        throw new Error('Missing required name field');
      }

      const name = this.sanitizeXMLText(nameMatch[1]);
      
      let description = null;
      let summary = null;
      
      if (descMatch) {
        description = this.sanitizeXMLText(descMatch[1]);
        
        // Extract summary (first sentence)
        const summaryMatch = description.match(/^(.+?[.!?])(\s|$)/);
        if (summaryMatch) {
          summary = summaryMatch[1].trim();
        }
      }

      return {
        bgg_id: gameId,
        name: name,
        year_published: yearMatch ? parseInt(yearMatch[1]) : null,
        image_url: imageMatch?.[1] || null,
        thumbnail_url: thumbnailMatch?.[1] || null,
        description: description,
        summary: summary,
        categories: categories,
        mechanics: mechanics,
        min_players: minPlayersMatch ? parseInt(minPlayersMatch[1]) : null,
        max_players: maxPlayersMatch ? parseInt(maxPlayersMatch[1]) : null,
        playtime_minutes: playtimeMatch ? parseInt(playtimeMatch[1]) : null,
        publisher: publisherMatch ? this.sanitizeXMLText(publisherMatch[1]) : null,
        rank: rankMatch ? parseInt(rankMatch[1]) : null,
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
        num_ratings: usersRatedMatch ? parseInt(usersRatedMatch[1]) : null,
        cached_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Parse error: ${error.message}`);
    }
  }

  async fetchGameData(gameId) {
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&type=boardgame&stats=1`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      throw new Error(`Fetch failed: ${error.message}`);
    }
  }

  async storeGame(game) {
    try {
      const { data, error } = await this.supabase
        .from('games')
        .upsert(game, {
          onConflict: 'bgg_id',
          ignoreDuplicates: false
        })
        .select('name, summary');
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      return data[0];
    } catch (error) {
      throw new Error(`Store failed: ${error.message}`);
    }
  }

  async getMoreGamesRange(targetCount = 2500) {
    console.log(`📡 Generating candidate game IDs for ${targetCount} additional games...`);
    
    const gameIds = [];
    let currentId = 1;
    let foundCount = 0;
    
    // Start from ID 1 and find games that aren't in our database yet
    while (foundCount < targetCount * 3 && currentId < 600000) { // Generate 3x more candidates
      if (!this.existingGameIds.has(currentId)) {
        gameIds.push(currentId);
        foundCount++;
      }
      currentId++;
      
      // Optimize search by skipping known empty ranges
      if (currentId > 50000 && currentId < 100000 && foundCount < targetCount * 0.5) {
        currentId = 100000;
      }
      if (currentId > 150000 && currentId < 200000 && foundCount < targetCount * 0.7) {
        currentId = 200000;
      }
      if (currentId > 250000 && currentId < 300000 && foundCount < targetCount * 0.8) {
        currentId = 300000;
      }
      if (currentId > 350000 && currentId < 400000 && foundCount < targetCount * 0.9) {
        currentId = 400000;
      }
    }
    
    console.log(`🎯 Generated ${gameIds.length} candidate game IDs to check`);
    return gameIds;
  }

  async importGames(targetCount = 2500) {
    console.log(`🚀 Starting BGG import for ${targetCount} additional games...`);
    console.log(`🎯 This will expand your collection without duplicates!`);
    
    await this.loadExistingGameIds();
    
    // Get candidate game IDs that don't exist in our database
    const gameIds = await this.getMoreGamesRange(targetCount); 
    console.log(`🔍 Will check ${gameIds.length} candidate game IDs for ${targetCount} new games`);
    
    const startTime = Date.now();
    
    for (const gameId of gameIds) {
      if (this.storedCount >= targetCount) {
        console.log(`🎉 Target of ${targetCount} additional games reached!`);
        break;
      }
      
      this.processedCount++;
      
      // Double-check: Skip if already exists (shouldn't happen but safety first)
      if (this.existingGameIds.has(gameId)) {
        this.skippedCount++;
        continue;
      }
      
      try {
        console.log(`\n📡 [${this.processedCount}] Fetching game ${gameId}...`);
        
        const xmlData = await this.fetchGameData(gameId);
        
        // Check if it's a valid game (not empty response)
        if (!xmlData.includes('<item') || xmlData.includes('Item not found')) {
          console.log(`⚠️ Game ${gameId} not found or invalid`);
          this.skippedCount++;
          continue;
        }
        
        const game = this.parseGame(xmlData, gameId);
        
        console.log(`✅ Parsed: ${game.name} (${game.year_published || 'Unknown'})`);
        if (game.summary) {
          console.log(`   Summary: "${game.summary.substring(0, 100)}${game.summary.length > 100 ? '...' : ''}"`);
        }
        console.log(`   Rating: ${game.rating || 'N/A'}, Players: ${game.min_players}-${game.max_players}, Time: ${game.playtime_minutes}min`);
        
        const storedGame = await this.storeGame(game);
        this.storedCount++;
        this.existingGameIds.add(gameId); // Add to set to avoid duplicates
        
        console.log(`💾 Stored: ${storedGame.name}`);
        
        // Progress update every 50 games for 2500 target
        if (this.storedCount % 50 === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = this.storedCount / elapsed;
          const remaining = targetCount - this.storedCount;
          const eta = remaining / rate;
          
          console.log(`\n📊 Progress: ${this.storedCount}/${targetCount} games stored (${((this.storedCount/targetCount)*100).toFixed(1)}%)`);
          console.log(`⏱️ Rate: ${rate.toFixed(1)} games/sec, ETA: ${Math.round(eta/60)} minutes`);
          console.log(`🔄 Processed: ${this.processedCount}, Errors: ${this.errorCount}, Skipped: ${this.skippedCount}`);
          
          // Database status check
          const { count } = await this.supabase
            .from('games')
            .select('*', { count: 'exact', head: true });
          console.log(`🗄️ Total games in database: ${count}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing game ${gameId}: ${error.message}`);
        this.errorCount++;
        
        // If we get too many consecutive errors, slow down
        if (this.errorCount > 0 && this.errorCount % 15 === 0) {
          console.log(`⚠️ ${this.errorCount} errors encountered, taking a longer break...`);
          await new Promise(resolve => setTimeout(resolve, 10000)); // Extra 10s delay
        }
      }
      
      // Rate limiting - be respectful to BGG (slightly faster for large imports)
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    
    console.log(`\n🎉 Large-scale import completed!`);
    console.log(`📊 Final Results:`);
    console.log(`  • Processed: ${this.processedCount} games`);
    console.log(`  • Stored: ${this.storedCount} new games`);
    console.log(`  • Skipped: ${this.skippedCount} (duplicates/not found)`);
    console.log(`  • Errors: ${this.errorCount}`);
    console.log(`  • Time: ${Math.round(totalTime/60)} minutes (${Math.round(totalTime)} seconds)`);
    console.log(`  • Rate: ${(this.storedCount / totalTime).toFixed(1)} games/sec`);
    
    // Show final database count
    const { count: finalCount } = await this.supabase
      .from('games')
      .select('*', { count: 'exact', head: true });
    console.log(`🗄️ Total games now in database: ${finalCount}`);
    
    // Show some sample results from recent additions
    const { data: recentGames } = await this.supabase
      .from('games')
      .select('name, year_published, rating, summary, categories')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (recentGames?.length > 0) {
      console.log(`\n🏆 Recently added games (sample):`);
      recentGames.forEach((game, index) => {
        console.log(`  ${index + 1}. ${game.name} (${game.year_published || 'Unknown'}) - Rating: ${game.rating || 'N/A'}`);
        if (game.categories?.length > 0) {
          console.log(`     Categories: ${game.categories.slice(0, 3).join(', ')}${game.categories.length > 3 ? '...' : ''}`);
        }
        if (game.summary) {
          console.log(`     "${game.summary.substring(0, 80)}${game.summary.length > 80 ? '...' : ''}"`);
        }
      });
    }
    
    console.log(`\n🚀 Your MeepleGo collection has been significantly expanded!`);
    console.log(`🎮 Ready to explore ${finalCount} board games with advanced filtering!`);
  }
}

// Create and run the importer for 2500 additional games
const importer = new BGGImporter();
importer.importGames(2500).catch(console.error);
