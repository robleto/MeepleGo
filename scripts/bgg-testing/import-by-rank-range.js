#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

class BGGRankBasedImporter {
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

  async fetchBGGRankPage(startRank) {
    console.log(`📡 Fetching BGG rank page starting from rank ${startRank}...`);
    
    try {
      // Use BGG's rank-based browse endpoint
      const url = `https://boardgamegeek.com/browse/boardgame?sort=rank&rankobjecttype=subtype&rankobjectid=1&rank=${startRank}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract game IDs from the HTML
      const gameIds = [];
      // Look for BGG game links in the format /boardgame/XXXXX/
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
      
      console.log(`🎯 Found ${gameIds.length} new games on rank page ${startRank}`);
      return gameIds;
      
    } catch (error) {
      console.error(`❌ Error fetching rank page ${startRank}: ${error.message}`);
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
      
      this.retryCount = 0;
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

  async importGamesByRankRange(startRank = 1001, endRank = 2500) {
    console.log(`🏆 Starting BGG rank-based import for ranks ${startRank}-${endRank}...`);
    console.log(`🎯 Using BGG's rank-based browse API for precise targeting!`);
    console.log(`📈 This will get games in exact ranking order!`);
    
    await this.loadExistingGameIds();
    
    const startTime = Date.now();
    let currentRank = startRank;
    const targetCount = endRank - startRank + 1;
    
    while (currentRank <= endRank) {
      // Get games from the current rank page (100 at a time)
      const gameIds = await this.fetchBGGRankPage(currentRank);
      
      if (gameIds.length === 0) {
        console.log(`⚠️ No games found starting at rank ${currentRank}, moving to next batch...`);
        currentRank += 100; // BGG typically shows 100 games per page
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      
      console.log(`\n🎮 Processing games starting from rank ${currentRank}`);
      
      for (const gameId of gameIds) {
        this.processedCount++;
        
        // Skip if already exists
        if (this.existingGameIds.has(gameId)) {
          this.skippedCount++;
          console.log(`⏭️ Skipping existing game ${gameId}`);
          continue;
        }
        
        try {
          console.log(`\n🏆 [Rank ~${currentRank}+] Fetching game ${gameId}...`);
          
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
          
          // Progress update every 50 games
          if (this.storedCount % 50 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const rate = this.storedCount / elapsed;
            const progress = ((currentRank - startRank) / (endRank - startRank)) * 100;
            
            console.log(`\n📊 Progress: ${this.storedCount} games stored | ~${progress.toFixed(1)}% through rank range`);
            console.log(`⏱️ Rate: ${rate.toFixed(1)} games/sec | Current rank range: ~${currentRank}`);
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
          
          if (this.errorCount > 0 && this.errorCount % 10 === 0) {
            console.log(`⚠️ ${this.errorCount} errors encountered, taking a longer break...`);
            await new Promise(resolve => setTimeout(resolve, 15000)); // 15s break
          }
        }
        
        // Rate limiting - be respectful to BGG
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
      
      // Move to next rank batch
      currentRank += 100;
      
      // Longer delay between rank pages
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    
    console.log(`\n🏆 Rank-based import completed!`);
    console.log(`📊 Final Results:`);
    console.log(`  • Target rank range: ${startRank}-${endRank}`);
    console.log(`  • Processed: ${this.processedCount} games`);
    console.log(`  • Stored: ${this.storedCount} new games`);
    console.log(`  • Skipped: ${this.skippedCount} (duplicates/not found)`);
    console.log(`  • Errors: ${this.errorCount}`);
    console.log(`  • Time: ${Math.round(totalTime/60)} minutes`);
    console.log(`  • Rate: ${(this.storedCount / totalTime).toFixed(1)} games/sec`);
    
    // Show final database count
    const { count: finalCount } = await this.supabase
      .from('games')
      .select('*', { count: 'exact', head: true });
    console.log(`🗄️ Total games now in database: ${finalCount}`);
    
    // Show rank distribution in target range
    const { data: rankData } = await this.supabase
      .from('games')
      .select('rank')
      .not('rank', 'is', null)
      .gte('rank', startRank)
      .lte('rank', endRank)
      .order('rank');
    
    if (rankData?.length > 0) {
      console.log(`\n📈 Games with ranks ${startRank}-${endRank}: ${rankData.length}`);
      console.log(`🥇 Coverage: rank ${rankData[0].rank} to ${rankData[rankData.length - 1].rank}`);
    }
    
    // Show sample games from this batch
    const { data: sampleGames } = await this.supabase
      .from('games')
      .select('name, year_published, rating, rank, categories')
      .not('rank', 'is', null)
      .gte('rank', startRank)
      .lte('rank', endRank)
      .order('rank')
      .limit(10);
    
    if (sampleGames?.length > 0) {
      console.log(`\n🎮 Sample games from rank range ${startRank}-${endRank}:`);
      sampleGames.forEach((game, index) => {
        console.log(`  ${index + 1}. ${game.name} (${game.year_published || 'Unknown'}) - Rank: ${game.rank} | Rating: ${game.rating || 'N/A'}`);
        if (game.categories?.length > 0) {
          console.log(`     🏷️ ${game.categories.slice(0, 2).join(', ')}`);
        }
      });
    }
    
    console.log(`\n🚀 Your MeepleGo collection now spans BGG ranks 1-${endRank}!`);
    console.log(`🏆 Users can explore games across the full spectrum of board game rankings!`);
  }
}

// Create and run the rank-based importer
const importer = new BGGRankBasedImporter();

// Allow CLI args: node import-by-rank-range.js <startRank> <endRank>
const [, , startArg, endArg] = process.argv;
const startRank = Number(startArg);
const endRank = Number(endArg);

if (!Number.isFinite(startRank)) {
  console.log('ℹ️ Usage: node scripts/bgg-testing/import-by-rank-range.js <startRank> [endRank]');
  console.log('   Example: node scripts/bgg-testing/import-by-rank-range.js 2501 5000');
}

const resolvedStart = Number.isFinite(startRank) ? startRank : 1001;
// If end not provided, fetch 100 pages (~10,000 ranks) by default
const resolvedEnd = Number.isFinite(endRank) ? endRank : (resolvedStart + 100 * 100 - 1);

importer.importGamesByRankRange(resolvedStart, resolvedEnd).catch(console.error);
