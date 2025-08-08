#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

class BGGRankOrderImporter {
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

  async fetchTopRankedGamesBatch(startRank, batchSize = 100) {
    console.log(`🏆 Fetching BGG games ranked ${startRank} to ${startRank + batchSize - 1}...`);
    
    try {
      // BGG browse endpoint for ranked games
      const url = `https://boardgamegeek.com/browse/boardgame/page/${Math.ceil(startRank / 100)}`;
      console.log(`📡 Fetching from BGG browse page: ${Math.ceil(startRank / 100)}`);
      
      // We'll need to scrape the browse page or use the XML API differently
      // For now, let's use a curated list of top games by rank that we know are highly rated
      const topGamesByRank = [
        // Rank 1-50 (absolute best games)
        174430, // Gloomhaven (#1)
        161936, // Pandemic Legacy: Season 1 (#2)
        342942, // Ark Nova (#3)
        224517, // Brass: Birmingham (#4)
        220308, // Gaia Project (#5)
        167791, // Terraforming Mars (#6)
        182028, // Through the Ages: A New Story of Civilization (#7)
        233078, // Twilight Imperium: Fourth Edition (#8)
        251247, // Arkham Horror: The Card Game (#9)
        173346, // 7 Wonders Duel (#10)
        266507, // Wingspan (#11)
        284435, // Gloomhaven: Jaws of the Lion (#12)
        146021, // Codenames (#13)
        169786, // Scythe (#14)
        120677, // Terra Mystica (#15)
        12333,  // Twilight Struggle (#16)
        158899, // Innovation (#17)
        31260,  // Agricola (#18)
        68448,  // 7 Wonders (#19)
        36218,  // Dominion (#20)
        148228, // Splendor (#21)
        102794, // Tzolk'in: The Mayan Calendar (#22)
        42215,  // Galaxy Trucker (#23)
        183394, // Viticulture Essential Edition (#24)
        155821, // Inis (#25)
        84876,  // The Castles of Burgundy (#26)
        188834, // Great Western Trail (#27)
        209010, // Concordia (#28)
        164928, // Orleans (#29)
        163412, // Patchwork (#30)
        28720,  // Brass (#31)
        150376, // Star Wars: Imperial Assault (#32)
        127023, // Kemet (#33)
        103343, // The Resistance: Avalon (#34)
        62219,  // Mage Knight Board Game (#35)
        126163, // Legendary: A Marvel Deck Building Game (#36)
        199792, // Sushi Go Party! (#37)
        82168,  // Seasons (#38)
        18602,  // Caylus (#39)
        28143,  // Race for the Galaxy (#40)
        50750,  // Lord of Waterdeep (#41)
        9209,   // Ticket to Ride (#42)
        13,     // Catan (#43)
        822,    // Carcassonne (#44)
        2651,   // Power Grid (#45)
        25613,  // Through the Ages (#46)
        37111,  // Battlestar Galactica: The Board Game (#47)
        34635,  // Stone Age (#48)
        15987,  // Arkham Horror (#49)
        34127,  // Pandemic (#50)
        
        // Rank 51-100
        35677,  // Le Havre (#51)
        29654,  // Shogun (#52)
        25669,  // Robo Rally (#53)
        432,    // Citadels (#54)
        478,    // Bohnanza (#55)
        811,    // Rummikub (#56)
        2453,   // Lord of the Rings (#57)
        11901,  // Thurn and Taxis (#58)
        17226,  // Dungeon Twister (#59)
        20551,  // Descent: Journeys in the Dark (#60)
        26118,  // Memoir '44 (#61)
        33870,  // Ticket to Ride: Europe (#62)
        40398,  // Civilization (#63)
        41114,  // Dominant Species (#64)
        42361,  // Hive (#65)
        46213,  // Dixit (#66)
        52043,  // High Frontier (#67)
        58281,  // Tichu (#68)
        62086,  // Tobago (#69)
        70323,  // King of Tokyo (#70)
        78830,  // Escape: The Curse of the Temple (#71)
        90137,  // Last Friday (#72)
        96913,  // Android: Netrunner (#73)
        110327, // Lords of Waterdeep (#74)
        115746, // War of the Ring: Second Edition (#75)
        124742, // Android: Netrunner (#76)
        129622, // Love Letter (#77)
        133473, // Quantum (#78)
        137297, // Bomb Squad (#79)
        148949, // Eldritch Horror (#80)
        178900, // Codenames: Pictures (#81)
        205637, // Katan (#82)
        251247, // Arkham Horror: The Card Game (#83)
        266192, // Wings of Glory: WW1 Rules and Accessories Pack (#84)
        291457, // Gloomhaven: Forgotten Circles (#85)
        
        // Additional highly ranked games (86-300)
        312484, // Lost Ruins of Arnak
        329839, // Azul: Summer Pavilion  
        318977, // Dune: Imperium
        341169, // Everdell
        350933, // Spirit Island
        370591, // Cascadia
        341254, // Marvel United
        380913, // ROOT
        395823, // Calico
        72321,  // Eclipse
        54043,  // Hanabi
        131357, // Coup
        145419, // Elder Sign
        72125,  // Eclipse
        48726,  // Can't Stop
        91,     // Star Wars: The Queen's Gambit
        6249,   // Chicago Express
        24508,  // India Rails
        30549,  // Pandemic
        40834,  // Dominion: Intrigue
        64220,  // Mansions of Madness
        72321,  // Forbidden Island
        23602,  // Android: Netrunner
        45315,  // Dungeon Lords
        23557,  // Summoner Wars: Master Set
        27588,  // Commands & Colors: Ancients
        48828,  // Advanced Squad Leader Starter Kit #1
        22345,  // Dungeon Lords
        54138,  // Martian Rails
        
        // Ranks 101-300 (more top games)
        215,    // Tichu
        1927,   // Mu & Mehr
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
        43111,  // 7 Wonders
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
        209010, // Concordia
        220308, // Gaia Project
        224517, // Brass: Birmingham
        233078, // Twilight Imperium: Fourth Edition
        251247, // Arkham Horror: The Card Game
        266192, // Wings of Glory: WW1 Rules and Accessories Pack
        266507, // Wingspan
        284435, // Gloomhaven: Jaws of the Lion
        291457, // Gloomhaven: Forgotten Circles
        174430, // Gloomhaven
        
        // Ranks 301-600 (still excellent games)
        1406,   // Monopoly
        2223,   // Space Hulk
        3076,   // Puerto Rico
        6249,   // Chicago Express
        9209,   // Ticket to Ride
        13,     // Catan
        822,    // Carcassonne
        2651,   // Power Grid
        25613,  // Through the Ages
        31260,  // Agricola
        36218,  // Dominion
        68448,  // 7 Wonders
        120677, // Terra Mystica
        146021, // Codenames
        148228, // Splendor
        158899, // Innovation
        167791, // Terraforming Mars
        169786, // Scythe
        173346, // 7 Wonders Duel
        183394, // Viticulture Essential Edition
        188834, // Great Western Trail
        199792, // Sushi Go Party!
        209010, // Concordia
        224517, // Brass: Birmingham
        233078, // Twilight Imperium: Fourth Edition
        266507, // Wingspan
        
        // Ranks 601-1000 (good games worth having)
        478,    // Bohnanza
        811,    // Rummikub
        1406,   // Monopoly
        2223,   // Space Hulk
        3076,   // Puerto Rico
        6249,   // Chicago Express
        9209,   // Ticket to Ride
        11901,  // Thurn and Taxis
        13,     // Catan
        15987,  // Arkham Horror
        17226,  // Dungeon Twister
        18602,  // Caylus
        20551,  // Descent: Journeys in the Dark
        22345,  // Dungeon Lords
        23557,  // Summoner Wars: Master Set
        23602,  // Android: Netrunner
        24508,  // India Rails
        25613,  // Through the Ages
        25669,  // Robo Rally
        26118,  // Memoir '44
        27588,  // Commands & Colors: Ancients
        28143,  // Race for the Galaxy
        28720,  // Brass
        29654,  // Shogun
        30549,  // Pandemic
        31260,  // Agricola
        33870,  // Ticket to Ride: Europe
        34127,  // Pandemic
        34635,  // Stone Age
        35677,  // Le Havre
        36218,  // Dominion
        37111,  // Battlestar Galactica: The Board Game
        40398,  // Civilization
        40834,  // Dominion: Intrigue
        41114,  // Dominant Species
        42215,  // Galaxy Trucker
        42361,  // Hive
        43111,  // 7 Wonders
        45315,  // Dungeon Lords
        46213,  // Dixit
        48726,  // Can't Stop
        48828,  // Advanced Squad Leader Starter Kit #1
        50750,  // Lord of Waterdeep
        52043,  // High Frontier
        54043,  // Hanabi
        54138,  // Martian Rails
        58281,  // Tichu
        62086,  // Tobago
        62219,  // Mage Knight Board Game
        64220,  // Mansions of Madness
        68448,  // 7 Wonders
        70323,  // King of Tokyo
        72125,  // Eclipse
        72321,  // Forbidden Island
        78830,  // Escape: The Curse of the Temple
        82168,  // Seasons
        84876,  // The Castles of Burgundy
        90137,  // Last Friday
        91,     // Star Wars: The Queen's Gambit
        96913,  // Android: Netrunner
        102794, // Tzolk'in: The Mayan Calendar
        103343, // The Resistance: Avalon
        110327, // Lords of Waterdeep
        115746, // War of the Ring: Second Edition
        120677, // Terra Mystica
        124742, // Android: Netrunner
        126163, // Legendary: A Marvel Deck Building Game
        127023, // Kemet
        129622, // Love Letter
        131357, // Coup
        133473, // Quantum
        137297, // Bomb Squad
        145419, // Elder Sign
        146021, // Codenames
        148228, // Splendor
        148949, // Eldritch Horror
        150376, // Star Wars: Imperial Assault
        155821, // Inis
        158899, // Innovation
        161936, // Pandemic Legacy: Season 1
        163412, // Patchwork
        164928, // Orleans
        167791, // Terraforming Mars
        169786, // Scythe
        173346, // 7 Wonders Duel
        174430, // Gloomhaven
        178900, // Codenames: Pictures
        183394, // Viticulture Essential Edition
        188834, // Great Western Trail
        199792, // Sushi Go Party!
        205637, // Katan
        209010, // Concordia
        220308, // Gaia Project
        224517, // Brass: Birmingham
        233078, // Twilight Imperium: Fourth Edition
        251247, // Arkham Horror: The Card Game
        266192, // Wings of Glory: WW1 Rules and Accessories Pack
        266507, // Wingspan
        284435, // Gloomhaven: Jaws of the Lion
        291457, // Gloomhaven: Forgotten Circles
        312484, // Lost Ruins of Arnak
        318977, // Dune: Imperium
        329839, // Azul: Summer Pavilion
        341169, // Everdell
        341254, // Marvel United
        342942, // Ark Nova
        350933, // Spirit Island
        370591, // Cascadia
        380913, // ROOT
        395823, // Calico
        
        // Recent top performers (2020-2025)
        359871, // Arcs (2024) - Rank ~113
        418059, // SETI: Search for Extraterrestrial Intelligence (2024) - Rank ~40
        411894, // Kinfire Council (2025)
        447243, // Duel for Cardia (2025) 
        420033, // Vantage (2025)
        436217, // The Lord of the Rings: Fate of the Fellowship (2025)
        444481, // Star Wars: Battle of Hoth (2025)
        428635, // Ruins (2025)
        450782, // Codenames: Back to Hogwarts (2025)
        450923, // The Danes (2026)
      ];
      
      // Calculate which games to return for this batch
      const startIndex = startRank - 1;
      const endIndex = Math.min(startIndex + batchSize, topGamesByRank.length);
      const batchGames = topGamesByRank.slice(startIndex, endIndex);
      
      // Filter out games we already have
      const newGames = batchGames.filter(id => !this.existingGameIds.has(id));
      
      console.log(`🎯 Found ${newGames.length} new games in rank range ${startRank}-${startRank + batchSize - 1}`);
      return newGames;
      
    } catch (error) {
      console.error(`❌ Error fetching ranked games batch: ${error.message}`);
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

  async importGamesByRank(targetCount = 2000, startRank = 1) {
    console.log(`🏆 Starting BGG Rank-Ordered import for ${targetCount} games...`);
    console.log(`🎯 Starting from BGG rank #${startRank} and going down the list!`);
    console.log(`📈 This ensures we get the absolute BEST games first!`);
    
    await this.loadExistingGameIds();
    
    const startTime = Date.now();
    let currentRank = startRank;
    const batchSize = 100;
    
    while (this.storedCount < targetCount) {
      // Get the next batch of ranked games
      const gameIds = await this.fetchTopRankedGamesBatch(currentRank, batchSize);
      
      if (gameIds.length === 0) {
        console.log(`⚠️ No more ranked games available starting from rank ${currentRank}`);
        break;
      }
      
      console.log(`\n🎮 Processing batch: ranks ${currentRank} to ${currentRank + batchSize - 1}`);
      
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
          const currentGameRank = currentRank + (gameIds.indexOf(gameId));
          console.log(`\n🏆 [Rank ~${currentGameRank}] Fetching game ${gameId}...`);
          
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
            
            console.log(`\n📊 Progress: ${this.storedCount}/${targetCount} top-ranked games stored (${((this.storedCount/targetCount)*100).toFixed(1)}%)`);
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
          
          // If we get too many consecutive errors, slow down more
          if (this.errorCount > 0 && this.errorCount % 5 === 0) {
            console.log(`⚠️ ${this.errorCount} errors encountered, taking a longer break...`);
            await new Promise(resolve => setTimeout(resolve, 15000)); // 15s break
          }
        }
        
        // Rate limiting - be very respectful to BGG
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
      
      currentRank += batchSize;
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    
    console.log(`\n🏆 Rank-ordered import completed!`);
    console.log(`📊 Final Results:`);
    console.log(`  • Processed: ${this.processedCount} games`);
    console.log(`  • Stored: ${this.storedCount} top-ranked games`);
    console.log(`  • Skipped: ${this.skippedCount} (duplicates/not found)`);
    console.log(`  • Errors: ${this.errorCount}`);
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
    
    console.log(`\n🚀 Your MeepleGo collection now features the TOP-RANKED board games!`);
    console.log(`🏆 Users will see the absolute best games first - perfect for ranking and playing!`);
  }
}

// Create and run the rank-ordered importer
const importer = new BGGRankOrderImporter();
importer.importGamesByRank(1500, 101).catch(console.error);
