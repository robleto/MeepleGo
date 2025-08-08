#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

class BGGDynamicRankImporter {
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
    this.retryCount = 0;
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

  async fetchBGGBrowsePage(pageNum) {
    console.log(`📡 Fetching BGG browse page ${pageNum}...`);
    
    try {
      // Use BGG's browse endpoint which returns ranked games
      const url = `https://boardgamegeek.com/browse/boardgame/page/${pageNum}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract game IDs from the HTML
      const gameIds = [];
      const regex = /\/boardgame\/(\d+)\//g;
      let match;
      const seenIds = new Set();
      
      while ((match = regex.exec(html)) !== null) {
        const gameId = parseInt(match[1]);
        if (!seenIds.has(gameId) && !this.existingGameIds.has(gameId)) {
          gameIds.push(gameId);
          seenIds.add(gameId);
        }
      }
      
      console.log(`🎯 Found ${gameIds.length} new games on page ${pageNum}`);
      return gameIds;
      
    } catch (error) {
      console.error(`❌ Error fetching browse page ${pageNum}: ${error.message}`);
      return [];
    }
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
      
      if (response.status === 429) {
        // Rate limited - wait longer and retry
        console.log(`⏳ Rate limited on game ${gameId}, waiting 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        this.retryCount++;
        
        if (this.retryCount < 3) {
          return await this.fetchGameData(gameId);
        } else {
          throw new Error('Rate limit retry exhausted');
        }
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      this.retryCount = 0; // Reset on success
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

  async importGamesByBGGRanking(targetCount = 1000, startPage = 1) {
    console.log(`🏆 Starting BGG Dynamic Ranking import for ${targetCount} games...`);
    console.log(`🎯 Starting from BGG browse page ${startPage} and going through ranked games!`);
    console.log(`📈 This fetches games in actual BGG ranking order!`);
    
    await this.loadExistingGameIds();
    
    const startTime = Date.now();
    let currentPage = startPage;
    let consecutiveEmptyPages = 0;
    
    while (this.storedCount < targetCount && consecutiveEmptyPages < 3) {
      // Get games from the current browse page
      const gameIds = await this.fetchBGGBrowsePage(currentPage);
      
      if (gameIds.length === 0) {
        consecutiveEmptyPages++;
        console.log(`⚠️ No new games found on page ${currentPage} (${consecutiveEmptyPages}/3 empty pages)`);
        currentPage++;
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait before trying next page
        continue;
      }
      
      consecutiveEmptyPages = 0; // Reset counter
      console.log(`\n🎮 Processing page ${currentPage} with ${gameIds.length} games`);
      
      for (const gameId of gameIds) {
        if (this.storedCount >= targetCount) {
          console.log(`🎉 Target of ${targetCount} games reached!`);
          break;
        }
        
        this.processedCount++;
        
        // Skip if already exists
        if (this.existingGameIds.has(gameId)) {
          this.skippedCount++;
          continue;
        }
        
        try {
          console.log(`\n🏆 [Page ${currentPage}] Fetching game ${gameId}...`);
          
          const xmlData = await this.fetchGameData(gameId);
          
          // Check if it's a valid game
          if (!xmlData.includes('<item') || xmlData.includes('Item not found')) {
            console.log(`⚠️ Game ${gameId} not found or invalid`);
            this.skippedCount++;
            continue;
          }
          
          const game = this.parseGame(xmlData, gameId);
          
          console.log(`✅ Parsed: ${game.name} (${game.year_published || 'Unknown'})`);
          console.log(`   🏆 BGG Rank: ${game.rank || 'Unranked'} | Rating: ${game.rating || 'N/A'} | Players: ${game.min_players}-${game.max_players}`);
          if (game.summary) {
            console.log(`   📝 "${game.summary.substring(0, 80)}${game.summary.length > 80 ? '...' : ''}"`);
          }
          if (game.categories?.length > 0) {
            console.log(`   🏷️ Categories: ${game.categories.slice(0, 3).join(', ')}${game.categories.length > 3 ? '...' : ''}`);
          }
          
          const storedGame = await this.storeGame(game);
          this.storedCount++;
          this.existingGameIds.add(gameId);
          
          console.log(`💾 Stored: ${storedGame.name}`);
          
          // Progress update every 25 games
          if (this.storedCount % 25 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const rate = this.storedCount / elapsed;
            const remaining = targetCount - this.storedCount;
            const eta = remaining / rate;
            
            console.log(`\n📊 Progress: ${this.storedCount}/${targetCount} ranked games stored (${((this.storedCount/targetCount)*100).toFixed(1)}%)`);
            console.log(`⏱️ Rate: ${rate.toFixed(1)} games/sec, ETA: ${Math.round(eta/60)} minutes`);
            console.log(`🔄 Processed: ${this.processedCount}, Errors: ${this.errorCount}, Skipped: ${this.skippedCount}`);
            console.log(`📄 Current page: ${currentPage}`);
            
            // Database status check
            const { count } = await this.supabase
              .from('games')
              .select('*', { count: 'exact', head: true });
            console.log(`🗄️ Total games in database: ${count}`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing game ${gameId}: ${error.message}`);
          this.errorCount++;
          
          // If we get too many consecutive errors, slow down more
          if (this.errorCount > 0 && this.errorCount % 5 === 0) {
            console.log(`⚠️ ${this.errorCount} errors encountered, taking a longer break...`);
            await new Promise(resolve => setTimeout(resolve, 15000)); // 15s break
          }
        }
        
        // Rate limiting - be very respectful to BGG
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
      
      currentPage++;
      
      // Small delay between pages
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    
    console.log(`\n🏆 Dynamic ranking import completed!`);
    console.log(`📊 Final Results:`);
    console.log(`  • Processed: ${this.processedCount} games`);
    console.log(`  • Stored: ${this.storedCount} ranked games`);
    console.log(`  • Skipped: ${this.skippedCount} (duplicates/not found)`);
    console.log(`  • Errors: ${this.errorCount}`);
    console.log(`  • Pages processed: ${currentPage - startPage}`);
    console.log(`  • Time: ${Math.round(totalTime/60)} minutes`);
    console.log(`  • Rate: ${(this.storedCount / totalTime).toFixed(1)} games/sec`);
    
    // Show final database count
    const { count: finalCount } = await this.supabase
      .from('games')
      .select('*', { count: 'exact', head: true });
    console.log(`🗄️ Total games now in database: ${finalCount}`);
    
    // Show the best games we added
    const { data: topGames } = await this.supabase
      .from('games')
      .select('name, year_published, rating, rank, categories')
      .order('rank', { ascending: true, nullsLast: true })
      .limit(10);
    
    if (topGames?.length > 0) {
      console.log(`\n🥇 Top 10 ranked games in your collection:`);
      topGames.forEach((game, index) => {
        console.log(`  ${index + 1}. ${game.name} (${game.year_published || 'Unknown'}) - Rank: ${game.rank || 'Unranked'} | Rating: ${game.rating || 'N/A'}`);
        if (game.categories?.length > 0) {
          console.log(`     🏷️ ${game.categories.slice(0, 2).join(', ')}`);
        }
      });
    }
    
    console.log(`\n🚀 Your MeepleGo collection now features games from BGG's actual ranking system!`);
    console.log(`🏆 Users will see a comprehensive collection of highly-ranked games!`);
  }
}

// Create and run the dynamic ranking importer
const importer = new BGGDynamicRankImporter();
importer.importGamesByBGGRanking(1000, 2).catch(console.error);
