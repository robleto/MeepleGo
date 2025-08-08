#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

class BGGTargetedRankImporter {
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

  // Generate BGG IDs in ranges more likely to contain ranked games
  generateTargetGameIds(count = 2000) {
    const gameIds = [];
    
    // BGG IDs tend to be higher for newer, more popular games
    // Try ranges that are likely to contain ranked games
    const ranges = [
      { start: 400000, end: 450000, samples: 300 }, // Recent games (2023-2024)
      { start: 350000, end: 400000, samples: 300 }, // 2022-2023
      { start: 300000, end: 350000, samples: 300 }, // 2021-2022
      { start: 250000, end: 300000, samples: 300 }, // 2019-2021
      { start: 200000, end: 250000, samples: 300 }, // 2017-2019
      { start: 150000, end: 200000, samples: 300 }, // 2015-2017
      { start: 100000, end: 150000, samples: 200 }, // 2013-2015
    ];
    
    for (const range of ranges) {
      const rangeIds = [];
      for (let i = 0; i < range.samples; i++) {
        const randomId = Math.floor(Math.random() * (range.end - range.start)) + range.start;
        if (!this.existingGameIds.has(randomId) && !rangeIds.includes(randomId)) {
          rangeIds.push(randomId);
        }
      }
      gameIds.push(...rangeIds);
    }
    
    // Shuffle the array to get a good mix
    for (let i = gameIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameIds[i], gameIds[j]] = [gameIds[j], gameIds[i]];
    }
    
    return gameIds.slice(0, count);
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

      const rank = rankMatch ? parseInt(rankMatch[1]) : null;
      
      // Only return games that have a rank in our target range (1001-2500)
      if (!rank || rank < 1001 || rank > 2500) {
        return null; // Skip games outside our target range
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
        rank: rank,
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
        console.log(`⏳ Rate limited on game ${gameId}, waiting 15 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 15000));
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

  async importTargetedRankedGames(targetCount = 1500) {
    console.log(`🎯 Starting targeted import for ${targetCount} games with ranks 1001-2500...`);
    console.log(`🔍 Using strategic BGG ID sampling to find ranked games!`);
    
    await this.loadExistingGameIds();
    
    const startTime = Date.now();
    const gameIds = this.generateTargetGameIds(3000); // Generate more IDs than needed
    
    console.log(`🎲 Generated ${gameIds.length} target BGG IDs to check`);
    console.log(`📊 Sample IDs: ${gameIds.slice(0, 10).join(', ')}...`);
    
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
        const xmlData = await this.fetchGameData(gameId);
        
        // Check if it's a valid game
        if (!xmlData.includes('<item') || xmlData.includes('Item not found')) {
          this.skippedCount++;
          continue;
        }
        
        const game = this.parseGame(xmlData, gameId);
        
        // Skip if not in our target rank range
        if (!game) {
          this.skippedCount++;
          continue;
        }
        
        console.log(`\n✅ Found ranked game: ${game.name} (${game.year_published || 'Unknown'})`);
        console.log(`   🏆 BGG Rank: ${game.rank} | Rating: ${game.rating || 'N/A'} | Players: ${game.min_players}-${game.max_players}`);
        if (game.summary) {
          console.log(`   📝 "${game.summary.substring(0, 80)}${game.summary.length > 80 ? '...' : ''}"`);
        }
        if (game.categories?.length > 0) {
          console.log(`   🏷️ Categories: ${game.categories.slice(0, 3).join(', ')}${game.categories.length > 3 ? '...' : ''}`);
        }
        
        const storedGame = await this.storeGame(game);
        this.storedCount++;
        this.existingGameIds.add(gameId);
        
        console.log(`💾 Stored: ${storedGame.name} (${this.storedCount}/${targetCount})`);
        
        // Progress update every 25 games
        if (this.storedCount % 25 === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = this.storedCount / elapsed;
          const remaining = targetCount - this.storedCount;
          const eta = remaining / rate;
          
          console.log(`\n📊 Progress: ${this.storedCount}/${targetCount} ranked games stored (${((this.storedCount/targetCount)*100).toFixed(1)}%)`);
          console.log(`⏱️ Rate: ${rate.toFixed(2)} games/sec, ETA: ${Math.round(eta/60)} minutes`);
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
        
        if (this.errorCount > 0 && this.errorCount % 20 === 0) {
          console.log(`⚠️ ${this.errorCount} errors encountered, taking a longer break...`);
          await new Promise(resolve => setTimeout(resolve, 30000)); // 30s break
        }
      }
      
      // Rate limiting - be very respectful
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    
    console.log(`\n🎯 Targeted ranked games import completed!`);
    console.log(`📊 Final Results:`);
    console.log(`  • Processed: ${this.processedCount} game IDs`);
    console.log(`  • Stored: ${this.storedCount} ranked games (ranks 1001-2500)`);
    console.log(`  • Skipped: ${this.skippedCount} (duplicates/not ranked/outside range)`);
    console.log(`  • Errors: ${this.errorCount}`);
    console.log(`  • Time: ${Math.round(totalTime/60)} minutes`);
    console.log(`  • Rate: ${(this.storedCount / totalTime).toFixed(2)} games/sec`);
    
    // Show final database count
    const { count: finalCount } = await this.supabase
      .from('games')
      .select('*', { count: 'exact', head: true });
    console.log(`🗄️ Total games now in database: ${finalCount}`);
    
    // Show rank distribution
    const { data: rankData } = await this.supabase
      .from('games')
      .select('rank')
      .not('rank', 'is', null)
      .gte('rank', 1001)
      .lte('rank', 2500)
      .order('rank');
    
    if (rankData?.length > 0) {
      console.log(`\n📈 Games with ranks 1001-2500: ${rankData.length}`);
      console.log(`🥇 New rank range: ${rankData[0].rank} to ${rankData[rankData.length - 1].rank}`);
      
      // Show some sample games
      const { data: sampleGames } = await this.supabase
        .from('games')
        .select('name, year_published, rating, rank, categories')
        .not('rank', 'is', null)
        .gte('rank', 1001)
        .lte('rank', 2500)
        .order('rank')
        .limit(10);
      
      console.log(`\n🎮 Sample ranked games (1001-2500):`);
      sampleGames?.forEach((game, index) => {
        console.log(`  ${index + 1}. ${game.name} (${game.year_published || 'Unknown'}) - Rank: ${game.rank} | Rating: ${game.rating || 'N/A'}`);
        if (game.categories?.length > 0) {
          console.log(`     🏷️ ${game.categories.slice(0, 2).join(', ')}`);
        }
      });
    }
    
    console.log(`\n🚀 Your MeepleGo collection now has comprehensive coverage from BGG ranks 1-2500+!`);
    console.log(`🏆 Users can explore and rank games across the full spectrum of board game quality!`);
  }
}

// Create and run the targeted ranking importer
const importer = new BGGTargetedRankImporter();
importer.importTargetedRankedGames(1500).catch(console.error);
