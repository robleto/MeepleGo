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

  async fetchBGGRankPage(pageNumber) {
    const url = `https://boardgamegeek.com/browse/boardgame/page/${pageNumber}`;
    console.log(`📡 Fetching BGG rank page starting from rank ${(pageNumber - 1) * 100 + 1}...`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      return this.parseRankPageForGameIds(html);
    } catch (error) {
      console.error(`❌ Error fetching rank page ${pageNumber}:`, error.message);
      return [];
    }
  }

  parseRankPageForGameIds(html) {
    const gameIds = [];
    const linkPattern = /href="\/boardgame\/(\d+)\/[^"]*"/g;
    let match;
    
    while ((match = linkPattern.exec(html)) !== null) {
      const gameId = parseInt(match[1]);
      if (gameId && !gameIds.includes(gameId)) {
        gameIds.push(gameId);
      }
    }
    
    // Filter out games we already have
    const newGameIds = gameIds.filter(id => !this.existingGameIds.has(id));
    console.log(`🎯 Found ${newGameIds.length} new games on rank page ${Math.floor((gameIds[0] || 1) / 100) + 1}`);
    
    return newGameIds;
  }

  parseXMLToGame(xmlText) {
    const games = [];
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/g);
    if (!itemMatches) return games;

    for (const itemMatch of itemMatches) {
      try {
        const bggIdMatch = itemMatch.match(/<item[^>]+id="(\d+)"/);
        if (!bggIdMatch) continue;
        const bggId = parseInt(bggIdMatch[1]);

        const nameMatch = itemMatch.match(/<name[^>]+primary="true"[^>]*value="([^"]+)"/);
        if (!nameMatch) continue;
        const name = this.sanitizeXMLText(nameMatch[1]);

        // Parse year
        const yearMatch = itemMatch.match(/<yearpublished[^>]*value="(\d+)"/);
        const yearPublished = yearMatch ? parseInt(yearMatch[1]) : null;

        // Parse image URLs
        const imageMatch = itemMatch.match(/<image[^>]*>([^<]+)</);
        const thumbnailMatch = itemMatch.match(/<thumbnail[^>]*>([^<]+)</);

        // Parse categories
        const categoryMatches = itemMatch.match(/<link[^>]+type="boardgamecategory"[^>]+value="([^"]+)"/g);
        const categories = categoryMatches ? 
          categoryMatches.map(match => {
            const valueMatch = match.match(/value="([^"]+)"/);
            return valueMatch ? this.sanitizeXMLText(valueMatch[1]) : null;
          }).filter(Boolean) : [];

        // Parse mechanics
        const mechanicMatches = itemMatch.match(/<link[^>]+type="boardgamemechanic"[^>]+value="([^"]+)"/g);
        const mechanics = mechanicMatches ? 
          mechanicMatches.map(match => {
            const valueMatch = match.match(/value="([^"]+)"/);
            return valueMatch ? this.sanitizeXMLText(valueMatch[1]) : null;
          }).filter(Boolean) : [];

        // Parse designers
        const designerMatches = itemMatch.match(/<link[^>]+type="boardgamedesigner"[^>]+value="([^"]+)"/g);
        const designers = designerMatches ? 
          designerMatches.map(match => {
            const valueMatch = match.match(/value="([^"]+)"/);
            return valueMatch ? this.sanitizeXMLText(valueMatch[1]) : null;
          }).filter(Boolean) : [];

        // Parse artists  
        const artistMatches = itemMatch.match(/<link[^>]+type="boardgameartist"[^>]+value="([^"]+)"/g);
        const artists = artistMatches ? 
          artistMatches.map(match => {
            const valueMatch = match.match(/value="([^"]+)"/);
            return valueMatch ? this.sanitizeXMLText(valueMatch[1]) : null;
          }).filter(Boolean) : [];

        // Parse player counts
        const minPlayersMatch = itemMatch.match(/<minplayers[^>]*value="(\d+)"/);
        const maxPlayersMatch = itemMatch.match(/<maxplayers[^>]*value="(\d+)"/);
        const minPlayers = minPlayersMatch ? parseInt(minPlayersMatch[1]) : null;
        const maxPlayers = maxPlayersMatch ? parseInt(maxPlayersMatch[1]) : null;

        // Parse playtime
        const playtimeMatch = itemMatch.match(/<playingtime[^>]*value="(\d+)"/);
        const playtimeMinutes = playtimeMatch ? parseInt(playtimeMatch[1]) : null;

        // Parse age
        const ageMatch = itemMatch.match(/<minage[^>]*value="(\d+)"/);
        const age = ageMatch ? parseInt(ageMatch[1]) : null;

        // Parse description and create summary
        const descMatch = itemMatch.match(/<description[^>]*>([^<]+)</);
        let description = null;
        let summary = null;
        if (descMatch) {
          description = this.sanitizeXMLText(descMatch[1]);
          const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
          summary = sentences.length > 0 ? sentences[0].trim() + '.' : null;
          if (summary && summary.length > 500) {
            summary = summary.substring(0, 497) + '...';
          }
        }

        // Parse publisher
        const publisherMatch = itemMatch.match(/<link[^>]+type="boardgamepublisher"[^>]+value="([^"]+)"/);
        const publisher = publisherMatch ? this.sanitizeXMLText(publisherMatch[1]) : null;

        // Parse statistics
        const statisticsMatch = itemMatch.match(/<statistics[^>]*>([\s\S]*?)<\/statistics>/);
        let rating = null;
        let numRatings = null;
        let rank = null;
        let weight = null;

        if (statisticsMatch) {
          const stats = statisticsMatch[1];
          
          const avgRatingMatch = stats.match(/<average[^>]*value="([^"]+)"/);
          rating = avgRatingMatch && avgRatingMatch[1] !== 'N/A' ? parseFloat(avgRatingMatch[1]) : null;

          const numRatingMatch = stats.match(/<usersrated[^>]*value="([^"]+)"/);
          numRatings = numRatingMatch ? parseInt(numRatingMatch[1]) : null;

          const rankMatch = stats.match(/<rank[^>]+name="boardgame"[^>]+value="(\d+)"/);
          rank = rankMatch ? parseInt(rankMatch[1]) : null;

          const weightMatch = stats.match(/<averageweight[^>]*value="([^"]+)"/);
          weight = weightMatch && weightMatch[1] !== 'N/A' ? parseFloat(weightMatch[1]) : null;
        }

        const game = {
          bgg_id: bggId,
          name,
          year_published: yearPublished,
          image_url: imageMatch ? imageMatch[1] : null,
          thumbnail_url: thumbnailMatch ? thumbnailMatch[1] : null,
          categories: categories.length > 0 ? categories : null,
          mechanics: mechanics.length > 0 ? mechanics : null,
          designers: designers.length > 0 ? designers : null,
          artists: artists.length > 0 ? artists : null,
          min_players: minPlayers,
          max_players: maxPlayers,
          playtime_minutes: playtimeMinutes,
          age,
          weight,
          publisher,
          description,
          summary,
          rank,
          rating,
          num_ratings: numRatings,
          cached_at: new Date().toISOString()
        };

        games.push(game);
      } catch (error) {
        console.error('❌ Error parsing game XML:', error.message);
        this.errorCount++;
      }
    }

    return games;
  }

  async fetchGameDetails(gameIds) {
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${gameIds.join(',')}&stats=1`;
    
    console.log(`🎮 Processing games starting from rank ${Math.floor((gameIds[0] || 2501) / 100) * 100 + 1}`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const xmlText = await response.text();
      return this.parseXMLToGame(xmlText);
    } catch (error) {
      console.error(`❌ Error fetching game details:`, error.message);
      this.errorCount++;
      return [];
    }
  }

  async storeGame(game) {
    try {
      const { error } = await this.supabase
        .from('games')
        .insert(game);

      if (error) {
        throw error;
      }

      console.log(`💾 Stored: ${game.name}`);
      this.storedCount++;
      this.existingGameIds.add(game.bgg_id);
    } catch (error) {
      console.error(`❌ Error storing ${game.name}:`, error.message);
      this.errorCount++;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async importGamesByRankRange(startRank, endRank) {
    const startTime = Date.now();
    console.log(`🏆 Starting BGG rank-based import for ranks ${startRank}-${endRank}...`);
    console.log(`🎯 Using BGG's rank-based browse API for precise targeting!`);
    console.log(`📈 This will get games in exact ranking order!`);
    
    await this.loadExistingGameIds();
    
    // Calculate page numbers for rank range (BGG shows 100 games per page)
    const startPage = Math.ceil(startRank / 100);
    const endPage = Math.ceil(endRank / 100);
    
    for (let page = startPage; page <= endPage; page++) {
      try {
        // Fetch game IDs from rank page
        const gameIds = await this.fetchBGGRankPage(page);
        
        if (gameIds.length === 0) {
          console.log(`⏭️ No new games found on page ${page}, skipping...`);
          continue;
        }

        console.log(`\n🎮 Processing games starting from rank ${(page - 1) * 100 + 1}\n`);

        // Process games in smaller batches to be respectful to BGG
        const batchSize = 25;
        for (let i = 0; i < gameIds.length; i += batchSize) {
          const batch = gameIds.slice(i, i + batchSize);
          
          try {
            // Fetch detailed game data
            const games = await this.fetchGameDetails(batch);
            
            // Process each game
            for (const game of games) {
              try {
                console.log(`🏆 [Rank ~${(page - 1) * 100 + 1}+] Fetching game ${game.bgg_id}...`);
                console.log(`✅ Parsed: ${game.name} (${game.year_published || 'Unknown'})`);
                console.log(`   🏆 BGG Rank: ${game.rank || 'Unranked'} | Rating: ${game.rating || 'N/A'} | Players: ${game.min_players || '?'}-${game.max_players || '?'}`);
                
                if (game.summary) {
                  console.log(`   📝 "${game.summary.substring(0, 80)}${game.summary.length > 80 ? '...' : ''}"`);
                }
                
                if (game.categories?.length > 0) {
                  console.log(`   🏷️ Categories: ${game.categories.slice(0, 3).join(', ')}${game.categories.length > 3 ? '...' : ''}`);
                }

                await this.storeGame(game);
                this.processedCount++;
                
                // Progress update every 50 games
                if (this.processedCount % 50 === 0) {
                  const currentTime = Date.now();
                  const elapsed = (currentTime - startTime) / 1000;
                  const rate = this.storedCount / elapsed;
                  const progress = ((page - startPage) / (endPage - startPage + 1)) * 100;
                  
                  console.log(`\n📊 Progress: ${this.storedCount} games stored | ~${progress.toFixed(1)}% through rank range`);
                  console.log(`⏱️ Rate: ${rate.toFixed(1)} games/sec | Current rank range: ~${(page - 1) * 100 + 1}`);
                  console.log(`🔄 Processed: ${this.processedCount}, Errors: ${this.errorCount}, Skipped: ${this.skippedCount}`);
                  
                  // Show current database count
                  const { count } = await this.supabase
                    .from('games')
                    .select('*', { count: 'exact', head: true });
                  console.log(`🗄️ Total games in database: ${count}\n`);
                }
                
                // Small delay between games to be respectful
                await this.delay(100);
                
              } catch (gameError) {
                console.error(`❌ Error processing game ${game.bgg_id}:`, gameError.message);
                this.errorCount++;
              }
            }
            
            // Longer delay between batches
            await this.delay(2000);
            
          } catch (batchError) {
            console.error(`❌ Error processing batch:`, batchError.message);
            this.errorCount++;
            await this.delay(5000); // Longer delay on error
          }
        }
        
        // Delay between pages
        await this.delay(3000);
        
      } catch (pageError) {
        console.error(`❌ Error processing page ${page}:`, pageError.message);
        this.errorCount++;
        await this.delay(5000);
      }
    }

    // Final summary
    console.log(`\n🏆 Rank-based import completed!`);
    const totalTime = (Date.now() - startTime) / 1000;
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
    
    // Show games in the new rank range
    const { data: rankData } = await this.supabase
      .from('games')
      .select('*')
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
importer.importGamesByRankRange(2501, 5000).catch(console.error);
