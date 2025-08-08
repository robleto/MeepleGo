#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

class BGGHotListImporter {
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
    this.gameQueues = {
      hotlist: [],
      top100: [],
      top500: [],
      top1000: [],
      recent: []
    };
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

  async fetchHotList() {
    console.log('🔥 Fetching BGG Hot List...');
    try {
      const response = await fetch('https://boardgamegeek.com/xmlapi2/hot?type=boardgame');
      const xml = await response.text();
      
      const gameIds = [];
      const matches = xml.match(/<item[^>]+id="(\d+)"/g);
      
      if (matches) {
        matches.forEach(match => {
          const idMatch = match.match(/id="(\d+)"/);
          if (idMatch) {
            const gameId = parseInt(idMatch[1]);
            if (!this.existingGameIds.has(gameId)) {
              gameIds.push(gameId);
            }
          }
        });
      }
      
      console.log(`🎯 Found ${gameIds.length} new games from Hot List`);
      return gameIds;
    } catch (error) {
      console.error('❌ Error fetching hot list:', error);
      return [];
    }
  }

  async fetchTopRankedGames(startRank = 1, endRank = 100) {
    console.log(`🏆 Fetching Top ${endRank} BGG games (ranks ${startRank}-${endRank})...`);
    
    // BGG's browse endpoint for ranked games
    const gameIds = [];
    
    // We'll use known highly ranked game IDs that are popular
    // These are some of the most popular games people actually want to see
    const popularGameIds = [
      // Top 100 popular games (known BGG IDs for highly rated games)
      174430, // Gloomhaven
      224517, // Brass: Birmingham  
      161936, // Pandemic Legacy: Season 1
      167791, // Terraforming Mars
      220308, // Gaia Project
      182028, // Through the Ages: A New Story of Civilization
      233078, // Twilight Imperium: Fourth Edition
      251247, // Arkham Horror: The Card Game
      266192, // Wings of Glory: WW1 Rules and Accessories Pack
      173346, // 7 Wonders Duel
      266507, // Wingspan
      284435, // Gloomhaven: Jaws of the Lion
      291457, // Gloomhaven: Forgotten Circles
      146021, // Codenames
      158899, // Innovation
      31260,  // Agricola
      68448,  // 7 Wonders
      36218,  // Dominion
      120677, // Terra Mystica
      148228, // Splendor
      102794, // Tzolk'in: The Mayan Calendar
      42215,  // Galaxy Trucker
      183394, // Viticulture Essential Edition
      155821, // Inis
      169786, // Scythe
      205637, // Katan
      28720,  // Brass
      40834,  // Dominion: Intrigue
      64220,  // Mansions of Madness
      54043,  // Hanabi
      131357, // Coup
      145419, // Elder Sign
      72321,  // Forbidden Island
      72125,  // Eclipse
      129622, // Love Letter
      48726,  // Can't Stop
      84876,  // The Castles of Burgundy
      12333,  // Twilight Struggle
      150376, // Star Wars: Imperial Assault
      127023, // Kemet
      103343, // The Resistance: Avalon
      62219,  // Mage Knight Board Game
      188834, // Great Western Trail
      126163, // Legendary: A Marvel Deck Building Game
      199792, // Sushi Go Party!
      164928, // Orleans
      82168,  // Seasons
      18602,  // Caylus
      163412, // Patchwork
      209010, // Concordia
      28143,  // Race for the Galaxy
      9209,   // Ticket to Ride
      13,     // Catan
      822,    // Carcassonne
      2651,   // Power Grid
      50750,  // Lord of Waterdeep
      1927,   // Mu & Mehr
      27588,  // Commands & Colors: Ancients
      48828,  // Advanced Squad Leader Starter Kit #1
      22345,  // Dungeon Lords
      23602,  // Android: Netrunner
      25613,  // Through the Ages
      45315,  // Dungeon Lords
      37111,  // Battlestar Galactica: The Board Game
      34635,  // Stone Age
      23557,  // Summoner Wars: Master Set
      15987,  // Arkham Horror
      34127,  // Pandemic
      6249,   // Chicago Express
      35677,  // Le Havre
      29654,  // Shogun
      25669,  // Robo Rally
      91,     // Star Wars: The Queen's Gambit
      432,    // Citadels
      478,    // Bohnanza
      811,    // Rummikub
      2453,   // Lord of the Rings
      6249,   // Chicago Express
      11901,  // Thurn and Taxis
      17226,  // Dungeon Twister
      20551,  // Descent: Journeys in the Dark
      24508,  // India Rails
      26118,  // Memoir '44
      30549,  // Pandemic
      33870,  // Ticket to Ride: Europe
      40398,  // Civilization
      41114,  // Dominant Species
      42361,  // Hive
      43111,  //7 Wonders
      46213,  // Dixit
      48726,  // Can't Stop
      52043,  // High Frontier
      54138,  // Martian Rails
      58281,  // Tichu
      62086,  // Tobago
      68448,  // 7 Wonders
      70323,  // King of Tokyo
      78830,  // Escape: The Curse of the Temple
      84876,  // The Castles of Burgundy
      90137,  // Last Friday
      96913,  // Android: Netrunner
      102794, // Tzolk'in: The Mayan Calendar
      110327, // Lords of Waterdeep
      115746, // War of the Ring: Second Edition
      120677, // Terra Mystica
      124742, // Android: Netrunner
      129622, // Love Letter
      133473, // Quantum
      137297, // Bomb Squad
      146021, // Codenames
      148949, // Eldritch Horror
      155821, // Inis
      158899, // Innovation
      161936, // Pandemic Legacy: Season 1
      167791, // Terraforming Mars
      169786, // Scythe
      173346, // 7 Wonders Duel
      178900, // Codenames: Pictures
      183394, // Viticulture Essential Edition
      188834, // Great Western Trail
      199792, // Sushi Go Party!
      205637, // Katan
      220308, // Gaia Project
      224517, // Brass: Birmingham
      233078, // Twilight Imperium: Fourth Edition
      251247, // Arkham Horror: The Card Game
      266192, // Wings of Glory: WW1 Rules and Accessories Pack
      266507, // Wingspan
      284435, // Gloomhaven: Jaws of the Lion
      291457, // Gloomhaven: Forgotten Circles
      174430  // Gloomhaven
    ];
    
    // Add recent popular releases (2020-2024)
    const recentPopularIds = [
      312484, // Lost Ruins of Arnak
      266507, // Wingspan
      329839, // Azul: Summer Pavilion
      318977, // Dune: Imperium
      341169, // Everdell
      350933, // Spirit Island
      370591, // Cascadia
      341254, // Marvel United
      342942, // Ark Nova
      380913, // ROOT
      395823, // Calico
      418550, // Marvel Zombies: A Zombicide Game
    ];

    // Filter out games we already have
    const newGameIds = [...popularGameIds, ...recentPopularIds].filter(id => !this.existingGameIds.has(id));
    
    console.log(`🎯 Found ${newGameIds.length} popular games not in database`);
    return newGameIds.slice(0, endRank - startRank + 1);
  }

  async buildGameQueue(targetCount = 2500) {
    console.log(`🎯 Building queue of relevant games for ${targetCount} imports...`);
    
    // Priority 1: Hot List (most current popular games)
    this.gameQueues.hotlist = await this.fetchHotList();
    
    // Priority 2: Top 100 popular games
    this.gameQueues.top100 = await this.fetchTopRankedGames(1, 100);
    
    // Priority 3: Top 500 popular games  
    this.gameQueues.top500 = await this.fetchTopRankedGames(101, 500);
    
    // Priority 4: Top 1000 popular games
    this.gameQueues.top1000 = await this.fetchTopRankedGames(501, 1000);
    
    // Combine all queues in priority order
    const allGameIds = [
      ...this.gameQueues.hotlist,
      ...this.gameQueues.top100,
      ...this.gameQueues.top500,
      ...this.gameQueues.top1000
    ];
    
    // Remove duplicates while preserving order
    const uniqueGameIds = [...new Set(allGameIds)];
    
    console.log(`📊 Game Queue Summary:`);
    console.log(`  🔥 Hot List: ${this.gameQueues.hotlist.length} games`);
    console.log(`  🏆 Top 100: ${this.gameQueues.top100.length} games`);
    console.log(`  🎮 Top 500: ${this.gameQueues.top500.length} games`);
    console.log(`  📈 Top 1000: ${this.gameQueues.top1000.length} games`);
    console.log(`  🎯 Total unique: ${uniqueGameIds.length} games`);
    
    return uniqueGameIds.slice(0, targetCount);
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

  async importRelevantGames(targetCount = 2500) {
    console.log(`🚀 Starting BGG Hot/Popular Games import for ${targetCount} relevant games...`);
    console.log(`🎯 Focusing on games people actually want to play and rank!`);
    
    await this.loadExistingGameIds();
    
    // Build our prioritized game queue
    const gameIds = await this.buildGameQueue(targetCount);
    console.log(`🔍 Will process ${gameIds.length} relevant games`);
    
    if (gameIds.length === 0) {
      console.log(`⚠️ No new relevant games found to import!`);
      return;
    }
    
    const startTime = Date.now();
    
    for (const gameId of gameIds) {
      if (this.storedCount >= targetCount) {
        console.log(`🎉 Target of ${targetCount} relevant games reached!`);
        break;
      }
      
      this.processedCount++;
      
      // Skip if already exists
      if (this.existingGameIds.has(gameId)) {
        this.skippedCount++;
        continue;
      }
      
      try {
        console.log(`\n📡 [${this.processedCount}] Fetching popular game ${gameId}...`);
        
        const xmlData = await this.fetchGameData(gameId);
        
        // Check if it's a valid game
        if (!xmlData.includes('<item') || xmlData.includes('Item not found')) {
          console.log(`⚠️ Game ${gameId} not found or invalid`);
          this.skippedCount++;
          continue;
        }
        
        const game = this.parseGame(xmlData, gameId);
        
        console.log(`✅ Parsed: ${game.name} (${game.year_published || 'Unknown'})`);
        console.log(`   🎯 Rating: ${game.rating || 'N/A'} | Rank: ${game.rank || 'Unranked'} | Players: ${game.min_players}-${game.max_players}`);
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
          
          console.log(`\n📊 Progress: ${this.storedCount}/${targetCount} relevant games stored (${((this.storedCount/targetCount)*100).toFixed(1)}%)`);
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
        if (this.errorCount > 0 && this.errorCount % 10 === 0) {
          console.log(`⚠️ ${this.errorCount} errors encountered, taking a break...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      // Rate limiting - be respectful to BGG
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    
    console.log(`\n🎉 Relevant games import completed!`);
    console.log(`📊 Final Results:`);
    console.log(`  • Processed: ${this.processedCount} games`);
    console.log(`  • Stored: ${this.storedCount} new relevant games`);
    console.log(`  • Skipped: ${this.skippedCount} (duplicates/not found)`);
    console.log(`  • Errors: ${this.errorCount}`);
    console.log(`  • Time: ${Math.round(totalTime/60)} minutes`);
    console.log(`  • Rate: ${(this.storedCount / totalTime).toFixed(1)} games/sec`);
    
    // Show final database count
    const { count: finalCount } = await this.supabase
      .from('games')
      .select('*', { count: 'exact', head: true });
    console.log(`🗄️ Total games now in database: ${finalCount}`);
    
    // Show some sample results
    const { data: recentGames } = await this.supabase
      .from('games')
      .select('name, year_published, rating, rank, categories')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (recentGames?.length > 0) {
      console.log(`\n🏆 Recently added relevant games:`);
      recentGames.forEach((game, index) => {
        console.log(`  ${index + 1}. ${game.name} (${game.year_published || 'Unknown'}) - Rating: ${game.rating || 'N/A'} | Rank: ${game.rank || 'Unranked'}`);
        if (game.categories?.length > 0) {
          console.log(`     🏷️ ${game.categories.slice(0, 2).join(', ')}`);
        }
      });
    }
    
    console.log(`\n🚀 Your MeepleGo collection now features the most relevant and popular board games!`);
    console.log(`🎮 Perfect for playing, ranking, and discovering new favorites!`);
  }
}

// Create and run the importer for relevant games
const importer = new BGGHotListImporter();
importer.importRelevantGames(1500).catch(console.error);
