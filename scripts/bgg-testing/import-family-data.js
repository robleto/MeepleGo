#!/usr/bin/env node

/**
 * BGG Family Data Import Script
 * 
 * This script fetches family data for all games in the database from BoardGameGeek API.
 * It includes comprehensive throttling, error handling, and progress tracking.
 * 
 * Features:
 * - Processes games in batches to respect BGG API limits
 * - Implements exponential backoff for rate limiting
 * - Saves progress and can resume from interruptions
 * - Detailed logging and progress reporting
 * - Validates data before saving to database
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
  SAVE_PROGRESS_INTERVAL: 50,  // Save progress every N batches
  PROGRESS_FILE: './family-import-progress.json',
  
  // Database batch settings
  DB_BATCH_SIZE: 100,       // Games to update in database per batch
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

// Global state
let stats = {
  totalGames: 0,
  processedGames: 0,
  successfulGames: 0,
  failedGames: 0,
  skippedGames: 0,
  totalFamilies: 0,
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
        'User-Agent': 'MeepleGo Family Import Script 1.0'
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
 * Parse family data from BGG XML response
 */
function parseFamilyData(xml) {
  try {
    const result = xmlParser.parse(xml);
    
    if (!result.items || !result.items.item) {
      throw new Error('No items found in XML response');
    }
    
    const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item];
    const gameData = [];
    
    for (const item of items) {
      const gameId = item['@_id'];
      const links = item.link || [];
      const linkArray = Array.isArray(links) ? links : [links];
      
      // Extract family links
      const familyLinks = linkArray.filter(link => link['@_type'] === 'boardgamefamily');
      const families = familyLinks.map(family => ({
        id: family['@_id'],
        name: family['@_value']
      }));
      
      gameData.push({
        bgg_id: gameId,
        families: families
      });
      
      stats.totalFamilies += families.length;
    }
    
    return gameData;
    
  } catch (error) {
    console.error('❌ Failed to parse XML:', error.message);
    throw error;
  }
}

/**
 * Update database with family data
 */
async function updateDatabase(gameData) {
  if (gameData.length === 0) return;
  
  console.log(`💾 Updating database with ${gameData.length} games...`);
  
  const updates = [];
  
  for (const game of gameData) {
    updates.push(
      supabase
        .from('games')
        .update({ families: game.families })
        .eq('bgg_id', game.bgg_id)
    );
  }
  
  try {
    const results = await Promise.allSettled(updates);
    
    let successful = 0;
    let failed = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && !result.value.error) {
        successful++;
      } else {
        failed++;
        const error = result.status === 'rejected' ? result.reason : result.value.error;
        console.error(`❌ Failed to update game ${gameData[index].bgg_id}:`, error.message);
        stats.failures.push({
          bgg_id: gameData[index].bgg_id,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    stats.successfulGames += successful;
    stats.failedGames += failed;
    
    console.log(`✅ Database update: ${successful} successful, ${failed} failed`);
    
  } catch (error) {
    console.error('❌ Database batch update failed:', error.message);
    stats.failedGames += gameData.length;
  }
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
    console.log(`   Successful: ${progress.stats.successfulGames}`);
    console.log(`   Failed: ${progress.stats.failedGames}`);
    
    const answer = await getUserInput('Resume from previous progress? (y/n): ');
    if (answer.toLowerCase() === 'y') {
      stats = { ...progress.stats, startTime: new Date() }; // Reset start time
      return progress.currentIndex;
    }
  } catch (error) {
    // No previous progress file found
  }
  
  return 0;
}

/**
 * Get user input from console
 */
function getUserInput(question) {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question(question, (answer) => {
      readline.close();
      resolve(answer);
    });
  });
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
  console.log(`   Successful: ${stats.successfulGames}`);
  console.log(`   Failed: ${stats.failedGames}`);
  console.log(`   Families Found: ${stats.totalFamilies}`);
  console.log(`   API Requests: ${stats.apiRequests}`);
  console.log(`   Time Elapsed: ${Math.round(elapsed)}s`);
  console.log(`   Est. Remaining: ${Math.round(remaining)}s`);
  console.log(`   Rate: ${gamesPerSecond.toFixed(2)} games/sec\n`);
}

/**
 * Main import function
 */
async function importFamilyData() {
  console.log('🚀 Starting BGG Family Data Import');
  console.log('=====================================\n');
  
  try {
    // First, check if families column exists
    console.log('🔍 Checking database schema...');
    const { data: columns, error: schemaError } = await supabase
      .from('games')
      .select('families')
      .limit(1);
    
    if (schemaError && schemaError.message.includes('column "families" does not exist')) {
      console.error('❌ The "families" column does not exist in the games table.');
      console.error('Please run the database migration first:');
      console.error('   scripts/database/add-families-column.sql');
      process.exit(1);
    }
    
    // Get all games from database
    console.log('📋 Fetching games from database...');
    
    // First get the total count
    const { count: totalCount } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true })
      .not('bgg_id', 'is', null);
    
    console.log(`📊 Found ${totalCount} total games with BGG IDs`);
    
    // Fetch all games in chunks to avoid Supabase limits
    let allGames = [];
    const FETCH_BATCH_SIZE = 1000;
    
    for (let offset = 0; offset < totalCount; offset += FETCH_BATCH_SIZE) {
      console.log(`📥 Fetching games ${offset + 1}-${Math.min(offset + FETCH_BATCH_SIZE, totalCount)}...`);
      
      const { data: gameBatch, error } = await supabase
        .from('games')
        .select('id, bgg_id, name, families')
        .not('bgg_id', 'is', null)
        .order('id')
        .range(offset, offset + FETCH_BATCH_SIZE - 1);
      
      if (error) {
        throw new Error(`Failed to fetch games batch: ${error.message}`);
      }
      
      allGames = allGames.concat(gameBatch || []);
    }
    
    const games = allGames;
    
    if (!games || games.length === 0) {
      console.log('❌ No games found in database');
      process.exit(1);
    }
    
    stats.totalGames = games.length;
    console.log(`✅ Found ${stats.totalGames} games with BGG IDs`);
    
    // Check for existing family data
    const gamesWithFamilies = games.filter(g => g.families && g.families.length > 0);
    if (gamesWithFamilies.length > 0) {
      console.log(`🔍 Found ${gamesWithFamilies.length} games already have family data`);
      const answer = await getUserInput('Skip games that already have family data? (y/n): ');
      
      if (answer.toLowerCase() === 'y') {
        stats.skippedGames = gamesWithFamilies.length;
      }
    }
    
    // Load previous progress
    let startIndex = await loadProgress();
    
    // Filter games based on user choices
    let gamesToProcess = games;
    if (stats.skippedGames > 0) {
      gamesToProcess = games.filter(g => !g.families || g.families.length === 0);
    }
    
    gamesToProcess = gamesToProcess.slice(startIndex);
    console.log(`🎯 Processing ${gamesToProcess.length} games starting from index ${startIndex}\n`);
    
    // Process games in batches
    const batches = [];
    for (let i = 0; i < gamesToProcess.length; i += CONFIG.BATCH_SIZE) {
      batches.push(gamesToProcess.slice(i, i + CONFIG.BATCH_SIZE));
    }
    
    console.log(`📦 Created ${batches.length} batches of ${CONFIG.BATCH_SIZE} games each\n`);
    
    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const bggIds = batch.map(g => g.bgg_id);
      
      console.log(`\n🔄 Processing batch ${batchIndex + 1}/${batches.length}`);
      console.log(`   Games: ${batch.map(g => `${g.name} (${g.bgg_id})`).join(', ')}`);
      
      try {
        // Fetch data from BGG
        const xml = await fetchBGGData(bggIds);
        
        // Parse family data
        const gameData = parseFamilyData(xml);
        
        // Update database
        await updateDatabase(gameData);
        
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
    console.log('\n🎉 Import Complete!');
    console.log('==================');
    displayProgress();
    
    if (stats.failures.length > 0) {
      console.log('\n❌ Failed Games:');
      stats.failures.forEach(failure => {
        console.log(`   ${failure.bgg_id} (${failure.name || 'Unknown'}): ${failure.error}`);
      });
      
      // Save failures to file
      await fs.writeFile('family-import-failures.json', JSON.stringify(stats.failures, null, 2));
      console.log('\n💾 Failed games saved to family-import-failures.json');
    }
    
    // Clean up progress file if completed successfully
    if (stats.processedGames + stats.skippedGames >= stats.totalGames) {
      try {
        await fs.unlink(CONFIG.PROGRESS_FILE);
        console.log('🧹 Progress file cleaned up');
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
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
  importFamilyData();
}

module.exports = { importFamilyData };
