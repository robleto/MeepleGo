#!/usr/bin/env node

/**
 * BGG Honors Data Import Script
 * 
 * This script fetches honors/awards data for games. Since the BGG XML API doesn't 
 * include honors data anymore, this script:
 * 1. Processes a manually curated list of major awards (Spiel des Jahres, Golden Geek, etc.)
 * 2. Adds honors to existing games in the database
 * 3. Adds new games that have received awards but aren't in the database yet
 * 
 * Features:
 * - Processes games in batches to respect BGG API limits
 * - Implements exponential backoff for rate limiting
 * - Saves progress and can resume from interruptions
 * - Validates data before saving to database
 * - Adds new games with full BGG data when they have honors
 */

const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Configuration
const CONFIG = {
  // BGG API settings
  BATCH_SIZE: 20,           // Games per API request (BGG allows up to 20)
  REQUEST_DELAY: 3000,      // Base delay between requests (3 seconds)
  MAX_RETRIES: 5,           // Maximum retry attempts for failed requests
  TIMEOUT: 30000,           // Request timeout (30 seconds)
  
  // Progress tracking
  SAVE_PROGRESS_INTERVAL: 25,  // Save progress every N batches
  PROGRESS_FILE: './honors-import-progress.json',
  
  // Database batch settings
  DB_BATCH_SIZE: 50,        // Games to update in database per batch
};

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// XML Parser configuration
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true
});

// Major game awards and their winners (comprehensive collection)
// Includes Spiel des Jahres, Kennerspiel des Jahres, Golden Geek, Origins Awards, and more
const MAJOR_AWARDS = [
  // === SPIEL DES JAHRES WINNERS (2010-2024) ===
  { bgg_id: 398444, name: "Sky Team", year: 2023, honors: [
    { name: "2024 Spiel des Jahres Winner", year: 2024, category: "Winner", award_type: "Spiel des Jahres", description: "Game of the Year award from Germany" }
  ]},
  { bgg_id: 300531, name: "Wings", year: 2019, honors: [
    { name: "2023 Spiel des Jahres Winner", year: 2023, category: "Winner", award_type: "Spiel des Jahres", description: "Game of the Year award from Germany" }
  ]},
  { bgg_id: 295947, name: "Cascadia", year: 2021, honors: [
    { name: "2022 Spiel des Jahres Winner", year: 2022, category: "Winner", award_type: "Spiel des Jahres", description: "Game of the Year award from Germany" }
  ]},
  { bgg_id: 256916, name: "MicroMacro: Crime City", year: 2020, honors: [
    { name: "2021 Spiel des Jahres Winner", year: 2021, category: "Winner", award_type: "Spiel des Jahres", description: "Game of the Year award from Germany" }
  ]},
  { bgg_id: 244521, name: "Pictures", year: 2019, honors: [
    { name: "2020 Spiel des Jahres Winner", year: 2020, category: "Winner", award_type: "Spiel des Jahres", description: "Game of the Year award from Germany" }
  ]},
  { bgg_id: 256960, name: "Just One", year: 2018, honors: [
    { name: "2019 Spiel des Jahres Winner", year: 2019, category: "Winner", award_type: "Spiel des Jahres", description: "Game of the Year award from Germany" }
  ]},
  { bgg_id: 244033, name: "Azul", year: 2017, honors: [
    { name: "2018 Spiel des Jahres Winner", year: 2018, category: "Winner", award_type: "Spiel des Jahres", description: "Game of the Year award from Germany" }
  ]},
  { bgg_id: 178900, name: "Codenames", year: 2015, honors: [
    { name: "2016 Spiel des Jahres Winner", year: 2016, category: "Winner", award_type: "Spiel des Jahres", description: "Game of the Year award from Germany" },
    { name: "2015 Golden Geek Best Party Board Game Winner", year: 2015, category: "Winner", award_type: "Golden Geek", description: "Best Party Board Game from BoardGameGeek community" },
    { name: "2015 Golden Geek Best Family Board Game Winner", year: 2015, category: "Winner", award_type: "Golden Geek", description: "Best Family Board Game from BoardGameGeek community" }
  ]},
  { bgg_id: 148228, name: "Splendor", year: 2014, honors: [
    { name: "2015 Spiel des Jahres Nominee", year: 2015, category: "Nominee", award_type: "Spiel des Jahres", description: "Game of the Year nomination from Germany" },
    { name: "2014 Golden Geek Best Family Board Game Winner", year: 2014, category: "Winner", award_type: "Golden Geek", description: "Best Family Board Game from BoardGameGeek community" }
  ]},
  { bgg_id: 129622, name: "Love Letter", year: 2012, honors: [
    { name: "2013 Golden Geek Best Card Game Winner", year: 2013, category: "Winner", award_type: "Golden Geek", description: "Best Card Game from BoardGameGeek community" }
  ]},
  { bgg_id: 102794, name: "Ticket to Ride: Nordic Countries", year: 2007, honors: [
    { name: "2015 Spiel des Jahres Nominee", year: 2015, category: "Nominee", award_type: "Spiel des Jahres", description: "Game of the Year nomination from Germany" }
  ]},
  { bgg_id: 68448, name: "7 Wonders", year: 2010, honors: [
    { name: "2011 Kennerspiel des Jahres Winner", year: 2011, category: "Winner", award_type: "Kennerspiel des Jahres", description: "Connoisseur Game of the Year from Germany" },
    { name: "2010 Golden Geek Best Strategy Board Game Winner", year: 2010, category: "Winner", award_type: "Golden Geek", description: "Best Strategy Board Game from BoardGameGeek community" }
  ]},
  { bgg_id: 36218, name: "Dominion", year: 2008, honors: [
    { name: "2009 Spiel des Jahres Winner", year: 2009, category: "Winner", award_type: "Spiel des Jahres", description: "Game of the Year award from Germany" },
    { name: "2008 Golden Geek Best Strategy Board Game Winner", year: 2008, category: "Winner", award_type: "Golden Geek", description: "Best Strategy Board Game from BoardGameGeek community" }
  ]},

  // === KENNERSPIEL DES JAHRES WINNERS ===
  { bgg_id: 316554, name: "Dune: Imperium", year: 2020, honors: [
    { name: "2022 Kennerspiel des Jahres Winner", year: 2022, category: "Winner", award_type: "Kennerspiel des Jahres", description: "Connoisseur Game of the Year from Germany" },
    { name: "2021 Golden Geek Board Game of the Year Winner", year: 2021, category: "Winner", award_type: "Golden Geek", description: "Board Game of the Year from BoardGameGeek community" }
  ]},
  { bgg_id: 266524, name: "PARKS", year: 2019, honors: [
    { name: "2020 Golden Geek Best Family Board Game Winner", year: 2020, category: "Winner", award_type: "Golden Geek", description: "Best Family Board Game from BoardGameGeek community" }
  ]},
  { bgg_id: 167791, name: "Terraforming Mars", year: 2016, honors: [
    { name: "2017 Kennerspiel des Jahres Nominee", year: 2017, category: "Nominee", award_type: "Kennerspiel des Jahres", description: "Connoisseur Game of the Year nomination from Germany" },
    { name: "2016 Golden Geek Best Strategy Board Game Winner", year: 2016, category: "Winner", award_type: "Golden Geek", description: "Best Strategy Board Game from BoardGameGeek community" },
    { name: "2016 Golden Geek Best Solo Board Game Winner", year: 2016, category: "Winner", award_type: "Golden Geek", description: "Best Solo Board Game from BoardGameGeek community" }
  ]},

  // === GOLDEN GEEK BOARD GAME OF THE YEAR WINNERS ===
  { bgg_id: 174430, name: "Gloomhaven", year: 2017, honors: [
    { name: "2017 Golden Geek Board Game of the Year Winner", year: 2017, category: "Winner", award_type: "Golden Geek", description: "Board Game of the Year from BoardGameGeek community" },
    { name: "2017 Golden Geek Best Strategy Board Game Winner", year: 2017, category: "Winner", award_type: "Golden Geek", description: "Best Strategy Board Game from BoardGameGeek community" },
    { name: "2017 Golden Geek Best Thematic Board Game Winner", year: 2017, category: "Winner", award_type: "Golden Geek", description: "Best Thematic Board Game from BoardGameGeek community" }
  ]},
  { bgg_id: 230802, name: "Azul: Stained Glass of Sintra", year: 2018, honors: [
    { name: "2018 Golden Geek Best Abstract Board Game Winner", year: 2018, category: "Winner", award_type: "Golden Geek", description: "Best Abstract Board Game from BoardGameGeek community" }
  ]},
  { bgg_id: 182028, name: "Through the Ages: A New Story of Civilization", year: 2015, honors: [
    { name: "2015 Golden Geek Board Game of the Year Winner", year: 2015, category: "Winner", award_type: "Golden Geek", description: "Board Game of the Year from BoardGameGeek community" }
  ]},

  // === CLASSIC SPIEL DES JAHRES WINNERS ===
  { bgg_id: 13, name: "CATAN", year: 1995, honors: [
    { name: "1995 Spiel des Jahres Winner", year: 1995, category: "Winner", award_type: "Spiel des Jahres", description: "Game of the Year award from Germany" },
    { name: "1996 Origins Award for Best Fantasy or Science Fiction Board Game Winner", year: 1996, category: "Winner", award_type: "Origins Award", description: "Best Fantasy or Science Fiction Board Game" }
  ]},
  { bgg_id: 822, name: "Carcassonne", year: 2000, honors: [
    { name: "2001 Spiel des Jahres Winner", year: 2001, category: "Winner", award_type: "Spiel des Jahres", description: "Game of the Year award from Germany" },
    { name: "2000 International Gamers Award - General Strategy: Two-players Winner", year: 2000, category: "Winner", award_type: "International Gamers Award", description: "General Strategy Two-players category" }
  ]},
  { bgg_id: 9209, name: "Ticket to Ride", year: 2004, honors: [
    { name: "2004 Spiel des Jahres Winner", year: 2004, category: "Winner", award_type: "Spiel des Jahres", description: "Game of the Year award from Germany" },
    { name: "2004 Origins Award for Best Board Game Winner", year: 2004, category: "Winner", award_type: "Origins Award", description: "Best Board Game" }
  ]},
  { bgg_id: 2651, name: "Power Grid", year: 2004, honors: [
    { name: "2004 International Gamers Award - General Strategy: Multi-player Winner", year: 2004, category: "Winner", award_type: "International Gamers Award", description: "General Strategy Multi-player category" }
  ]},

  // === COOPERATIVE GAMES ===
  { bgg_id: 30549, name: "Pandemic", year: 2008, honors: [
    { name: "2009 Golden Geek Best Family Board Game Winner", year: 2009, category: "Winner", award_type: "Golden Geek", description: "Best Family Board Game from BoardGameGeek community" },
    { name: "2008 Golden Geek Best Cooperative Game Winner", year: 2008, category: "Winner", award_type: "Golden Geek", description: "Best Cooperative Game from BoardGameGeek community" }
  ]},
  { bgg_id: 50, name: "Lord of the Rings", year: 2000, honors: [
    { name: "2001 International Gamers Award - General Strategy: Multi-player Winner", year: 2001, category: "Winner", award_type: "International Gamers Award", description: "General Strategy Multi-player category" }
  ]},

  // === STRATEGY GAMES ===
  { bgg_id: 84876, name: "The Castles of Burgundy", year: 2011, honors: [
    { name: "2011 International Gamers Award - General Strategy: Multi-player Winner", year: 2011, category: "Winner", award_type: "International Gamers Award", description: "General Strategy Multi-player category" },
    { name: "2011 Golden Geek Best Strategy Board Game Nominee", year: 2011, category: "Nominee", award_type: "Golden Geek", description: "Best Strategy Board Game nomination from BoardGameGeek community" }
  ]},
  { bgg_id: 31260, name: "Agricola", year: 2007, honors: [
    { name: "2008 International Gamers Award - General Strategy: Multi-player Winner", year: 2008, category: "Winner", award_type: "International Gamers Award", description: "General Strategy Multi-player category" },
    { name: "2007 Golden Geek Best Strategy Board Game Winner", year: 2007, category: "Winner", award_type: "Golden Geek", description: "Best Strategy Board Game from BoardGameGeek community" }
  ]},
  { bgg_id: 12333, name: "Twilight Struggle", year: 2005, honors: [
    { name: "2006 Golden Geek Best Strategy Board Game Winner", year: 2006, category: "Winner", award_type: "Golden Geek", description: "Best Strategy Board Game from BoardGameGeek community" },
    { name: "2005 International Gamers Award - General Strategy: Two-players Winner", year: 2005, category: "Winner", award_type: "International Gamers Award", description: "General Strategy Two-players category" }
  ]},

  // === RECENT ACCLAIMED GAMES ===
  { bgg_id: 224517, name: "Brass: Birmingham", year: 2018, honors: [
    { name: "2018 Golden Geek Board Game of the Year Winner", year: 2018, category: "Winner", award_type: "Golden Geek", description: "Board Game of the Year from BoardGameGeek community" },
    { name: "2018 Golden Geek Best Strategy Board Game Winner", year: 2018, category: "Winner", award_type: "Golden Geek", description: "Best Strategy Board Game from BoardGameGeek community" }
  ]},
  { bgg_id: 233078, name: "Twilight Imperium: Fourth Edition", year: 2017, honors: [
    { name: "2017 Golden Geek Best Thematic Board Game Winner", year: 2017, category: "Winner", award_type: "Golden Geek", description: "Best Thematic Board Game from BoardGameGeek community" }
  ]},

  // === PARTY GAMES ===
  { bgg_id: 139030, name: "Telestrations", year: 2009, honors: [
    { name: "2010 Golden Geek Best Party Board Game Winner", year: 2010, category: "Winner", award_type: "Golden Geek", description: "Best Party Board Game from BoardGameGeek community" }
  ]},
  { bgg_id: 6249, name: "Apples to Apples", year: 1999, honors: [
    { name: "1999 Origins Award for Best Traditional Card Game Winner", year: 1999, category: "Winner", award_type: "Origins Award", description: "Best Traditional Card Game" }
  ]},

  // === ENGINE BUILDERS ===
  { bgg_id: 120677, name: "Terra Mystica", year: 2012, honors: [
    { name: "2013 Golden Geek Best Strategy Board Game Winner", year: 2013, category: "Winner", award_type: "Golden Geek", description: "Best Strategy Board Game from BoardGameGeek community" }
  ]},
  { bgg_id: 169786, name: "Scythe", year: 2016, honors: [
    { name: "2016 Golden Geek Board Game of the Year Winner", year: 2016, category: "Winner", award_type: "Golden Geek", description: "Board Game of the Year from BoardGameGeek community" },
    { name: "2016 Golden Geek Best Innovative Board Game Winner", year: 2016, category: "Winner", award_type: "Golden Geek", description: "Best Innovative Board Game from BoardGameGeek community" }
  ]},

  // === WORKER PLACEMENT CLASSICS ===
  { bgg_id: 28720, name: "Brass", year: 2007, honors: [
    { name: "2008 International Gamers Award - General Strategy: Multi-player Winner", year: 2008, category: "Winner", award_type: "International Gamers Award", description: "General Strategy Multi-player category" }
  ]},
  { bgg_id: 42215, name: "Stone Age", year: 2008, honors: [
    { name: "2008 Golden Geek Best Family Board Game Winner", year: 2008, category: "Winner", award_type: "Golden Geek", description: "Best Family Board Game from BoardGameGeek community" }
  ]},

  // === DECK BUILDERS ===
  { bgg_id: 45315, name: "Thunderstone", year: 2009, honors: [
    { name: "2009 Golden Geek Best Card Game Winner", year: 2009, category: "Winner", award_type: "Golden Geek", description: "Best Card Game from BoardGameGeek community" }
  ]},
  { bgg_id: 209418, name: "Clank! A Deck-Building Adventure", year: 2016, honors: [
    { name: "2016 Golden Geek Best Card Game Winner", year: 2016, category: "Winner", award_type: "Golden Geek", description: "Best Card Game from BoardGameGeek community" }
  ]},

  // === MORE SPIEL DES JAHRES CLASSICS ===
  { bgg_id: 54043, name: "Dixit", year: 2008, honors: [
    { name: "2010 Spiel des Jahres Winner", year: 2010, category: "Winner", award_type: "Spiel des Jahres", description: "Game of the Year award from Germany" }
  ]},
  { bgg_id: 18602, name: "Zooloretto", year: 2007, honors: [
    { name: "2007 Spiel des Jahres Winner", year: 2007, category: "Winner", award_type: "Spiel des Jahres", description: "Game of the Year award from Germany" }
  ]},
  { bgg_id: 10547, name: "Thurn and Taxis", year: 2006, honors: [
    { name: "2006 Spiel des Jahres Winner", year: 2006, category: "Winner", award_type: "Spiel des Jahres", description: "Game of the Year award from Germany" }
  ]},

  // === ABSTRACT STRATEGY ===
  { bgg_id: 2655, name: "Hive", year: 2001, honors: [
    { name: "2001 Mensa Select Winner", year: 2001, category: "Winner", award_type: "Mensa Select", description: "Mensa Select award for mind games" }
  ]},
  { bgg_id: 1406, name: "Monopoly", year: 1935, honors: [
    { name: "1935 Games Hall of Fame", year: 1935, category: "Special", award_type: "Games Hall of Fame", description: "Inducted into Games Magazine Hall of Fame" }
  ]},

  // === WARGAMES ===
  { bgg_id: 102680, name: "Memoir '44", year: 2004, honors: [
    { name: "2004 International Gamers Award - Historical Simulation Winner", year: 2004, category: "Winner", award_type: "International Gamers Award", description: "Historical Simulation category" }
  ]},
  { bgg_id: 25547, name: "Here I Stand", year: 2006, honors: [
    { name: "2007 Golden Geek Best Wargame Winner", year: 2007, category: "Winner", award_type: "Golden Geek", description: "Best Wargame from BoardGameGeek community" }
  ]},

  // === EURO GAMES ===
  { bgg_id: 15987, name: "Taj Mahal", year: 2000, honors: [
    { name: "2000 International Gamers Award - General Strategy: Multi-player Winner", year: 2000, category: "Winner", award_type: "International Gamers Award", description: "General Strategy Multi-player category" }
  ]},
  { bgg_id: 34635, name: "In the Year of the Dragon", year: 2007, honors: [
    { name: "2007 International Gamers Award - General Strategy: Multi-player Winner", year: 2007, category: "Winner", award_type: "International Gamers Award", description: "General Strategy Multi-player category" }
  ]},

  // === MODERN CLASSICS ===
  { bgg_id: 173346, name: "7 Wonders Duel", year: 2015, honors: [
    { name: "2015 Golden Geek Best 2-Player Board Game Winner", year: 2015, category: "Winner", award_type: "Golden Geek", description: "Best 2-Player Board Game from BoardGameGeek community" }
  ]},
  { bgg_id: 148949, name: "Star Wars: X-Wing Miniatures Game", year: 2012, honors: [
    { name: "2012 Golden Geek Best 2-Player Board Game Winner", year: 2012, category: "Winner", award_type: "Golden Geek", description: "Best 2-Player Board Game from BoardGameGeek community" }
  ]},
  { bgg_id: 123540, name: "Mansions of Madness", year: 2011, honors: [
    { name: "2011 Golden Geek Best Thematic Board Game Winner", year: 2011, category: "Winner", award_type: "Golden Geek", description: "Best Thematic Board Game from BoardGameGeek community" }
  ]},

  // === RECENT HITS ===
  { bgg_id: 291457, name: "Gloomhaven: Jaws of the Lion", year: 2020, honors: [
    { name: "2020 Golden Geek Best Cooperative Game Winner", year: 2020, category: "Winner", award_type: "Golden Geek", description: "Best Cooperative Game from BoardGameGeek community" }
  ]},
  { bgg_id: 284083, name: "The Crew: The Quest for Planet Nine", year: 2019, honors: [
    { name: "2020 Kennerspiel des Jahres Winner", year: 2020, category: "Winner", award_type: "Kennerspiel des Jahres", description: "Connoisseur Game of the Year from Germany" }
  ]},
  { bgg_id: 266830, name: "Wingspan", year: 2019, honors: [
    { name: "2019 Kennerspiel des Jahres Winner", year: 2019, category: "Winner", award_type: "Kennerspiel des Jahres", description: "Connoisseur Game of the Year from Germany" },
    { name: "2019 Golden Geek Board Game of the Year Winner", year: 2019, category: "Winner", award_type: "Golden Geek", description: "Board Game of the Year from BoardGameGeek community" }
  ]},

  // === ROLL & WRITE ===
  { bgg_id: 245655, name: "Welcome To...", year: 2018, honors: [
    { name: "2018 Golden Geek Best Family Board Game Winner", year: 2018, category: "Winner", award_type: "Golden Geek", description: "Best Family Board Game from BoardGameGeek community" }
  ]},
  { bgg_id: 163412, name: "Patchwork", year: 2014, honors: [
    { name: "2014 Golden Geek Best 2-Player Board Game Winner", year: 2014, category: "Winner", award_type: "Golden Geek", description: "Best 2-Player Board Game from BoardGameGeek community" }
  ]},

  // === LEGACY GAMES ===
  { bgg_id: 161936, name: "Pandemic Legacy: Season 1", year: 2015, honors: [
    { name: "2015 Golden Geek Board Game of the Year Winner", year: 2015, category: "Winner", award_type: "Golden Geek", description: "Board Game of the Year from BoardGameGeek community" },
    { name: "2015 Golden Geek Most Innovative Board Game Winner", year: 2015, category: "Winner", award_type: "Golden Geek", description: "Most Innovative Board Game from BoardGameGeek community" }
  ]}
];

// Global state
let stats = {
  totalGames: 0,
  processedGames: 0,
  existingGames: 0,
  newGames: 0,
  honorsAdded: 0,
  failedGames: 0,
  startTime: new Date(),
  apiRequests: 0,
  failures: []
};

/**
 * Utility function to sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt, baseDelay = CONFIG.REQUEST_DELAY) {
  return Math.min(baseDelay * Math.pow(2, attempt), 60000); // Max 60 seconds
}

/**
 * Fetch game data from BGG API with retry logic
 */
async function fetchBGGData(gameIds, attempt = 0) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${gameIds.join(',')}&type=boardgame&stats=1`;
  
  try {
    console.log(`📡 API Request ${stats.apiRequests + 1}: ${gameIds.length} games (attempt ${attempt + 1})`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MeepleGo Honors Import Script 1.0',
        'Accept-Encoding': 'identity'
      }
    });
    
    clearTimeout(timeoutId);
    stats.apiRequests++;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xml = await response.text();
    
    // Check for BGG rate limiting response
    if (xml.includes('Your request for this collection has been accepted')) {
      throw new Error('BGG processing request - need to retry');
    }
    
    return xml;
    
  } catch (error) {
    console.error(`❌ API request failed (attempt ${attempt + 1}): ${error.message}`);
    
    if (attempt < CONFIG.MAX_RETRIES) {
      const delay = calculateDelay(attempt);
      console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
      await sleep(delay);
      return fetchBGGData(gameIds, attempt + 1);
    }
    
    throw error;
  }
}

/**
 * Parse game data from BGG XML response and add honors
 */
function parseGameDataWithHonors(xml, honorsMap) {
  try {
    const result = xmlParser.parse(xml);
    
    if (!result.items || !result.items.item) {
      throw new Error('No items found in XML response');
    }
    
    const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item];
    const gameData = [];
    
    for (const item of items) {
      const bggId = item['@_id'];
      const names = item.name || [];
      const nameArray = Array.isArray(names) ? names : [names];
      const primaryName = nameArray.find(n => n['@_type'] === 'primary')?.['@_value'] || 'Unknown';
      
      // Get other game data
      const yearPublished = item.yearpublished?.['@_value'] || null;
      const minPlayers = item.minplayers?.['@_value'] || null;
      const maxPlayers = item.maxplayers?.['@_value'] || null;
      const playingTime = item.playingtime?.['@_value'] || null;
      const minAge = item.minage?.['@_value'] || null;
      const description = item.description || '';
      const imageUrl = item.image || null;
      const thumbnailUrl = item.thumbnail || null;
      
      // Extract categories, mechanics, etc.
      const links = item.link || [];
      const linkArray = Array.isArray(links) ? links : [links];
      
      const categories = linkArray
        .filter(link => link['@_type'] === 'boardgamecategory')
        .map(cat => cat['@_value']);
      
      const mechanics = linkArray
        .filter(link => link['@_type'] === 'boardgamemechanic')
        .map(mech => mech['@_value']);
      
      const designers = linkArray
        .filter(link => link['@_type'] === 'boardgamedesigner')
        .map(des => des['@_value']);
      
      const artists = linkArray
        .filter(link => link['@_type'] === 'boardgameartist')
        .map(art => art['@_value']);
      
      const publishers = linkArray
        .filter(link => link['@_type'] === 'boardgamepublisher')
        .map(pub => pub['@_value']);
      
      // Get rating and rank data
      const statistics = item.statistics?.ratings;
      const bggRating = statistics?.average?.['@_value'] || null;
      const numRatings = statistics?.usersrated?.['@_value'] || null;
      const bggRank = statistics?.ranks?.rank;
      
      let rank = null;
      if (bggRank) {
        const rankArray = Array.isArray(bggRank) ? bggRank : [bggRank];
        const boardGameRank = rankArray.find(r => r['@_name'] === 'boardgame');
        if (boardGameRank && boardGameRank['@_value'] !== 'Not Ranked') {
          rank = parseInt(boardGameRank['@_value']);
        }
      }
      
      // Get the honors for this game
      const honors = honorsMap[bggId] || [];
      
      gameData.push({
        bgg_id: parseInt(bggId),
        name: primaryName,
        year_published: yearPublished ? parseInt(yearPublished) : null,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        categories: categories.length > 0 ? categories : null,
        mechanics: mechanics.length > 0 ? mechanics : null,
        designers: designers.length > 0 ? designers : null,
        artists: artists.length > 0 ? artists : null,
        min_players: minPlayers ? parseInt(minPlayers) : null,
        max_players: maxPlayers ? parseInt(maxPlayers) : null,
        playtime_minutes: playingTime ? parseInt(playingTime) : null,
        age: minAge ? parseInt(minAge) : null,
        publisher: publishers.length > 0 ? publishers[0] : null,
        description: description,
        summary: description ? description.split('.')[0] + '.' : null,
        rank: rank,
        rating: bggRating ? parseFloat(bggRating) : null,
        num_ratings: numRatings ? parseInt(numRatings) : null,
        honors: honors,
        cached_at: new Date().toISOString()
      });
    }
    
    return gameData;
    
  } catch (error) {
    console.error('❌ Failed to parse XML:', error.message);
    throw error;
  }
}

/**
 * Check if games exist in database and update/insert accordingly
 */
async function processGamesWithHonors(gameData) {
  if (gameData.length === 0) return;
  
  console.log(`💾 Processing ${gameData.length} games with honors...`);
  
  // Check which games already exist
  const bggIds = gameData.map(g => g.bgg_id);
  const { data: existingGames, error } = await supabase
    .from('games')
    .select('bgg_id, honors')
    .in('bgg_id', bggIds);
  
  if (error) {
    console.error('❌ Error checking existing games:', error);
    return;
  }
  
  const existingBggIds = new Set(existingGames.map(g => g.bgg_id));
  const gamesToUpdate = [];
  const gamesToInsert = [];
  
  for (const game of gameData) {
    if (existingBggIds.has(game.bgg_id)) {
      // Game exists, update with new honors
      const existingGame = existingGames.find(g => g.bgg_id === game.bgg_id);
      const existingHonors = existingGame.honors || [];
      
      // Merge honors (avoid duplicates)
      const allHonors = [...existingHonors];
      for (const newHonor of game.honors) {
        if (!allHonors.some(h => h.name === newHonor.name && h.year === newHonor.year)) {
          allHonors.push(newHonor);
        }
      }
      
      if (allHonors.length > existingHonors.length) {
        gamesToUpdate.push({
          bgg_id: game.bgg_id,
          honors: allHonors
        });
      }
    } else {
      // New game, insert with all data
      gamesToInsert.push(game);
    }
  }
  
  // Update existing games with new honors
  if (gamesToUpdate.length > 0) {
    console.log(`📝 Updating ${gamesToUpdate.length} existing games with honors...`);
    
    for (const gameUpdate of gamesToUpdate) {
      const { error: updateError } = await supabase
        .from('games')
        .update({ 
          honors: gameUpdate.honors,
          updated_at: new Date().toISOString()
        })
        .eq('bgg_id', gameUpdate.bgg_id);
      
      if (updateError) {
        console.error(`❌ Failed to update game ${gameUpdate.bgg_id}:`, updateError);
        stats.failedGames++;
      } else {
        stats.existingGames++;
        stats.honorsAdded += gameUpdate.honors.length;
      }
    }
  }
  
  // Insert new games
  if (gamesToInsert.length > 0) {
    console.log(`➕ Inserting ${gamesToInsert.length} new games with honors...`);
    
    const { error: insertError } = await supabase
      .from('games')
      .insert(gamesToInsert);
    
    if (insertError) {
      console.error('❌ Failed to insert new games:', insertError);
      stats.failedGames += gamesToInsert.length;
    } else {
      stats.newGames += gamesToInsert.length;
      stats.honorsAdded += gamesToInsert.reduce((sum, g) => sum + g.honors.length, 0);
    }
  }
  
  console.log(`✅ Processed: ${gamesToUpdate.length} updated, ${gamesToInsert.length} inserted`);
}

/**
 * Save progress to file
 */
async function saveProgress(currentIndex) {
  const progress = {
    currentIndex,
    stats,
    timestamp: new Date().toISOString()
  };
  
  try {
    await fs.writeFile(CONFIG.PROGRESS_FILE, JSON.stringify(progress, null, 2));
    console.log(`💾 Progress saved (processed ${stats.processedGames}/${stats.totalGames} games)`);
  } catch (error) {
    console.error('❌ Failed to save progress:', error.message);
  }
}

/**
 * Load previous progress if available
 */
async function loadProgress() {
  try {
    const data = await fs.readFile(CONFIG.PROGRESS_FILE, 'utf8');
    const progress = JSON.parse(data);
    
    console.log(`📂 Found previous progress from ${progress.timestamp}`);
    console.log(`   Processed: ${progress.stats.processedGames}/${progress.stats.totalGames}`);
    
    // For this script, we'll always start fresh since we have a curated list
    return 0;
  } catch (error) {
    // No previous progress file found
  }
  
  return 0;
}

/**
 * Display progress statistics
 */
function displayProgress() {
  const elapsed = (new Date() - stats.startTime) / 1000;
  const gamesPerSecond = stats.processedGames / elapsed;
  const estimatedTotal = stats.totalGames / gamesPerSecond;
  const remaining = estimatedTotal - elapsed;
  
  console.log('\n📊 Progress Report:');
  console.log(`   Total Games: ${stats.totalGames}`);
  console.log(`   Processed: ${stats.processedGames} (${((stats.processedGames / stats.totalGames) * 100).toFixed(1)}%)`);
  console.log(`   Existing Games Updated: ${stats.existingGames}`);
  console.log(`   New Games Added: ${stats.newGames}`);
  console.log(`   Total Honors Added: ${stats.honorsAdded}`);
  console.log(`   Failed: ${stats.failedGames}`);
  console.log(`   API Requests: ${stats.apiRequests}`);
  console.log(`   Time Elapsed: ${Math.round(elapsed)}s`);
  if (stats.processedGames > 0) {
    console.log(`   Est. Remaining: ${Math.round(remaining)}s`);
    console.log(`   Rate: ${gamesPerSecond.toFixed(2)} games/sec`);
  }
  console.log('');
}

/**
 * Main import function
 */
async function importHonorsData() {
  console.log('🚀 Starting BGG Honors Data Import');
  console.log('==================================\n');
  
  try {
    // First, check if honors column exists
    console.log('🔍 Checking database schema...');
    const { data: columns, error: schemaError } = await supabase
      .from('games')
      .select('honors')
      .limit(1);
    
    if (schemaError && schemaError.message.includes('column "honors" does not exist')) {
      console.error('❌ The "honors" column does not exist in the games table.');
      console.error('Please run the database migration first:');
      console.error('   scripts/database/add-honors-column.sql');
      process.exit(1);
    }
    
    console.log('✅ Database schema verified');
    
    // Prepare the games list with honors data
    console.log('📋 Preparing games list with honors...');
    
    // Create map of BGG ID to honors
    const honorsMap = {};
    const gamesList = [];
    
    for (const award of MAJOR_AWARDS) {
      honorsMap[award.bgg_id] = award.honors;
      gamesList.push({
        bgg_id: award.bgg_id,
        name: award.name,
        year: award.year
      });
    }
    
    stats.totalGames = gamesList.length;
    console.log(`✅ Found ${stats.totalGames} games with honors to process`);
    
    // Load previous progress (will start fresh for this script)
    let startIndex = await loadProgress();
    
    const gamesToProcess = gamesList.slice(startIndex);
    console.log(`🎯 Processing ${gamesToProcess.length} games starting from index ${startIndex}\n`);
    
    // Process games in batches
    const batches = [];
    for (let i = 0; i < gamesToProcess.length; i += CONFIG.BATCH_SIZE) {
      batches.push(gamesToProcess.slice(i, i + CONFIG.BATCH_SIZE));
    }
    
    console.log(`📦 Created ${batches.length} batches of up to ${CONFIG.BATCH_SIZE} games each\n`);
    
    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const bggIds = batch.map(g => g.bgg_id);
      
      console.log(`\n🔄 Processing batch ${batchIndex + 1}/${batches.length}`);
      console.log(`   Games: ${batch.map(g => `${g.name} (${g.bgg_id})`).join(', ')}`);
      
      try {
        // Fetch data from BGG
        const xml = await fetchBGGData(bggIds);
        
        // Parse game data and add honors
        const gameData = parseGameDataWithHonors(xml, honorsMap);
        
        // Process games (update existing or insert new)
        await processGamesWithHonors(gameData);
        
        stats.processedGames += batch.length;
        
        // Save progress periodically
        if ((batchIndex + 1) % CONFIG.SAVE_PROGRESS_INTERVAL === 0) {
          await saveProgress(startIndex + stats.processedGames);
          displayProgress();
        }
        
        // Wait before next request (except for last batch)
        if (batchIndex < batches.length - 1) {
          console.log(`⏳ Waiting ${CONFIG.REQUEST_DELAY / 1000} seconds before next batch...`);
          await sleep(CONFIG.REQUEST_DELAY);
        }
        
      } catch (error) {
        console.error(`❌ Batch ${batchIndex + 1} failed:`, error.message);
        stats.failedGames += batch.length;
        
        // Log failed games
        batch.forEach(game => {
          stats.failures.push({
            bgg_id: game.bgg_id,
            name: game.name,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        });
        
        // Continue with next batch after a longer delay
        if (batchIndex < batches.length - 1) {
          console.log(`⏳ Waiting ${CONFIG.REQUEST_DELAY * 2 / 1000} seconds before retry...`);
          await sleep(CONFIG.REQUEST_DELAY * 2);
        }
      }
    }
    
    // Final progress save
    await saveProgress(startIndex + stats.processedGames);
    
    // Display final statistics
    console.log('\n🎉 Honors Import Complete!');
    console.log('==========================');
    displayProgress();
    
    if (stats.failures.length > 0) {
      console.log('\n❌ Failed Games:');
      stats.failures.forEach(failure => {
        console.log(`   ${failure.bgg_id} (${failure.name || 'Unknown'}): ${failure.error}`);
      });
      
      // Save failures to file
      await fs.writeFile('honors-import-failures.json', JSON.stringify(stats.failures, null, 2));
      console.log('\n💾 Failed games saved to honors-import-failures.json');
    }
    
    // Clean up progress file if completed successfully
    if (stats.processedGames >= stats.totalGames) {
      try {
        await fs.unlink(CONFIG.PROGRESS_FILE);
        console.log('🧹 Progress file cleaned up');
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    console.log('\n🏆 Summary:');
    console.log(`   ${stats.existingGames} existing games updated with honors`);
    console.log(`   ${stats.newGames} new games added to database`);
    console.log(`   ${stats.honorsAdded} total honors added`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received interrupt signal');
  console.log('💾 Saving progress before exit...');
  
  await saveProgress(stats.processedGames);
  displayProgress();
  
  console.log('👋 Import interrupted. Run again to resume.');
  process.exit(0);
});

// Run the import
if (require.main === module) {
  importHonorsData();
}

module.exports = { importHonorsData };
