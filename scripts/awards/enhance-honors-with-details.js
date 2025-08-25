#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const zlib = require('zlib');

console.log('=== ENHANCING BGG HONORS WITH DETAILED PAGE DATA ===');

// Load the complete honors dataset with titles
const honorsDataset = JSON.parse(fs.readFileSync('complete-bgg-honors-with-titles.json', 'utf8'));

const args = {
  startIndex: parseInt(process.argv.find(arg => arg.startsWith('--start='))?.split('=')[1] || '0'),
  limit: parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '0'), // 0 = no limit
  dryRun: process.argv.includes('--dry-run'),
  testSample: parseInt(process.argv.find(arg => arg.startsWith('--test='))?.split('=')[1] || '0'),
  saveInterval: parseInt(process.argv.find(arg => arg.startsWith('--save-every='))?.split('=')[1] || '100')
};

console.log(`Processing ${honorsDataset.length} honors total`);
console.log(`Start index: ${args.startIndex}`);
console.log(`Limit: ${args.limit === 0 ? 'No limit' : args.limit}`);
console.log(`Dry run: ${args.dryRun}`);
if (args.testSample > 0) console.log(`Test sample: ${args.testSample}`);

// Function to fetch a single honor page
async function fetchHonorPage(honor) {
  return new Promise((resolve, reject) => {
    const url = `https://boardgamegeek.com${honor.url}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cookie': process.env.BGG_COOKIES || ''
      }
    };
    
    https.get(url, options, (res) => {
      let data = [];
      
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        try {
          let buffer = Buffer.concat(data);
          
          // Handle different encodings
          if (res.headers['content-encoding'] === 'gzip') {
            buffer = zlib.gunzipSync(buffer);
          } else if (res.headers['content-encoding'] === 'deflate') {
            buffer = zlib.inflateSync(buffer);
          }
          
          const html = buffer.toString('utf8');
          resolve(html);
        } catch (error) {
          reject(new Error(`Failed to decompress response: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

// Function to parse honor page data
function parseHonorPageData(html, honor) {
  const result = {
    id: honor.id,
    slug: honor.slug,
    url: honor.url,
    year: honor.year,
    title: honor.title,
    // New detailed fields
    primaryName: null,
    alternateNames: [],
    boardgames: [],
    awardSet: null,
    position: null
  };
  
  try {
    // Parse Primary Name from the table structure
    const primaryNameMatch = html.match(/<b>Primary Name<\/b>\s*<\/td>\s*<td>.*?<div[^>]*>\s*([^<]+)/s);
    if (primaryNameMatch) {
      result.primaryName = primaryNameMatch[1].trim();
    }
    
    // Parse Alternate Names from the table structure
    const alternateNameMatch = html.match(/<b>Alternate Names<\/b>\s*<\/td>\s*<td>.*?<div[^>]*>\s*([^<]*)/s);
    if (alternateNameMatch && alternateNameMatch[1].trim()) {
      const names = alternateNameMatch[1].split(/[,;]/).map(name => name.trim()).filter(name => name.length > 0);
      result.alternateNames = names;
    }
    
    // Parse Award Set from the table structure
    const awardSetMatch = html.match(/<b>Award Set<\/b>\s*<\/td>\s*<td>.*?href="[^"]*"[^>]*>\s*([^<]+)/s);
    if (awardSetMatch) {
      result.awardSet = awardSetMatch[1].trim();
    }
    
    // Parse Position from the table structure
    const positionMatch = html.match(/<b>Position<\/b>\s*<\/td>\s*<td>.*?href="[^"]*"[^>]*>\s*([^<]+)/s);
    if (positionMatch) {
      result.position = positionMatch[1].trim();
    }
    
    // Parse Boardgames from the table structure - look for game links in the Boardgames section
    const boardgamesMatch = html.match(/<b>Boardgames<\/b>\s*<\/td>\s*<td>(.*?)<\/td>/s);
    if (boardgamesMatch) {
      const boardgamesSection = boardgamesMatch[1];
      const gameLinks = boardgamesSection.match(/href="\/boardgame\/(\d+)\/[^"]*"[^>]*>\s*([^<]+)/g);
      
      if (gameLinks) {
        gameLinks.forEach(link => {
          const gameMatch = link.match(/href="\/boardgame\/(\d+)\/[^"]*"[^>]*>\s*([^<]+)/);
          if (gameMatch) {
            const [, bggId, name] = gameMatch;
            result.boardgames.push({
              bggId: parseInt(bggId),
              name: name.trim()
            });
          }
        });
      }
    }
    
    // Remove duplicates from boardgames
    const gameMap = new Map();
    result.boardgames.forEach(game => {
      gameMap.set(game.bggId, game);
    });
    result.boardgames = Array.from(gameMap.values());
    
    // Remove duplicates from alternate names
    result.alternateNames = [...new Set(result.alternateNames)];
    
    // Clean up any HTML entities
    if (result.primaryName) {
      result.primaryName = result.primaryName.replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    }
    if (result.awardSet) {
      result.awardSet = result.awardSet.replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    }
    if (result.position) {
      result.position = result.position.replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    }
    result.alternateNames = result.alternateNames.map(name => 
      name.replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    );
    result.boardgames.forEach(game => {
      game.name = game.name.replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    });
    
  } catch (error) {
    console.error(`Error parsing honor ${honor.id}:`, error.message);
  }
  
  return result;
}

// Function to save progress
function saveProgress(enhancedHonors, filename) {
  fs.writeFileSync(filename, JSON.stringify(enhancedHonors, null, 2));
}

// Main processing function
async function processHonors() {
  const enhancedHonors = [];
  let processed = 0;
  let errors = 0;
  
  // Determine which honors to process
  let honorsToProcess = honorsDataset;
  
  if (args.testSample > 0) {
    honorsToProcess = honorsDataset.slice(0, args.testSample);
    console.log(`\nTest mode: Processing first ${args.testSample} honors`);
  } else {
    const endIndex = args.limit > 0 ? Math.min(args.startIndex + args.limit, honorsDataset.length) : honorsDataset.length;
    honorsToProcess = honorsDataset.slice(args.startIndex, endIndex);
    console.log(`\nProcessing honors ${args.startIndex} to ${endIndex - 1}`);
  }
  
  console.log(`Total to process: ${honorsToProcess.length}`);
  
  for (let i = 0; i < honorsToProcess.length; i++) {
    const honor = honorsToProcess[i];
    const globalIndex = args.startIndex + i;
    
    try {
      console.log(`[${globalIndex + 1}/${honorsDataset.length}] Processing: ${honor.title || honor.slug}`);
      
      if (args.dryRun) {
        // Dry run - just add the structure without fetching
        enhancedHonors.push({
          ...honor,
          primaryName: null,
          alternateNames: [],
          boardgames: [],
          awardSet: null,
          position: null
        });
      } else {
        // Fetch and parse the page
        const html = await fetchHonorPage(honor);
        const enhancedHonor = parseHonorPageData(html, honor);
        enhancedHonors.push(enhancedHonor);
        
        // Show what we found
        if (enhancedHonor.boardgames.length > 0) {
          console.log(`  Found ${enhancedHonor.boardgames.length} boardgames`);
        }
        if (enhancedHonor.primaryName) {
          console.log(`  Primary name: ${enhancedHonor.primaryName}`);
        }
        if (enhancedHonor.awardSet) {
          console.log(`  Award set: ${enhancedHonor.awardSet}`);
        }
        if (enhancedHonor.position) {
          console.log(`  Position: ${enhancedHonor.position}`);
        }
      }
      
      processed++;
      
      // Rate limiting for real requests
      if (!args.dryRun) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
      
      // Save progress periodically
      if (processed % args.saveInterval === 0 && !args.dryRun) {
        const filename = `enhanced-honors-progress-${globalIndex + 1}.json`;
        saveProgress(enhancedHonors, filename);
        console.log(`  Progress saved to ${filename}`);
      }
      
    } catch (error) {
      console.error(`  Error processing honor ${honor.id}: ${error.message}`);
      errors++;
      
      // Add the honor with empty enhanced data on error
      enhancedHonors.push({
        ...honor,
        primaryName: null,
        alternateNames: [],
        boardgames: [],
        awardSet: null,
        position: null,
        error: error.message
      });
      
      // Don't fail completely, just continue
      if (errors > 10 && !args.dryRun) {
        console.log(`Too many errors (${errors}), taking a longer break...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        errors = 0; // Reset error counter
      }
    }
  }
  
  return enhancedHonors;
}

// Statistics function
function showStatistics(enhancedHonors) {
  const withPrimaryName = enhancedHonors.filter(h => h.primaryName);
  const withAlternateNames = enhancedHonors.filter(h => h.alternateNames && h.alternateNames.length > 0);
  const withBoardgames = enhancedHonors.filter(h => h.boardgames && h.boardgames.length > 0);
  const withAwardSet = enhancedHonors.filter(h => h.awardSet);
  const withPosition = enhancedHonors.filter(h => h.position);
  const withErrors = enhancedHonors.filter(h => h.error);
  
  console.log(`\n=== STATISTICS ===`);
  console.log(`Total processed: ${enhancedHonors.length}`);
  console.log(`With primary name: ${withPrimaryName.length} (${(withPrimaryName.length/enhancedHonors.length*100).toFixed(1)}%)`);
  console.log(`With alternate names: ${withAlternateNames.length} (${(withAlternateNames.length/enhancedHonors.length*100).toFixed(1)}%)`);
  console.log(`With boardgames: ${withBoardgames.length} (${(withBoardgames.length/enhancedHonors.length*100).toFixed(1)}%)`);
  console.log(`With award set: ${withAwardSet.length} (${(withAwardSet.length/enhancedHonors.length*100).toFixed(1)}%)`);
  console.log(`With position: ${withPosition.length} (${(withPosition.length/enhancedHonors.length*100).toFixed(1)}%)`);
  console.log(`With errors: ${withErrors.length} (${(withErrors.length/enhancedHonors.length*100).toFixed(1)}%)`);
  
  // Show some examples
  if (withBoardgames.length > 0) {
    console.log(`\nSample honors with boardgames:`);
    withBoardgames.slice(0, 3).forEach(honor => {
      console.log(`  ${honor.title}: ${honor.boardgames.length} games`);
      honor.boardgames.slice(0, 2).forEach(game => {
        console.log(`    - ${game.name} (${game.bggId})`);
      });
    });
  }
}

// Main execution
async function run() {
  console.log('\n=== STARTING HONOR PAGE ENHANCEMENT ===');
  
  const enhancedHonors = await processHonors();
  
  // Save final result
  const outputFile = args.testSample > 0 ? 
    `enhanced-honors-test-${args.testSample}.json` : 
    `enhanced-honors-complete.json`;
    
  if (!args.dryRun) {
    saveProgress(enhancedHonors, outputFile);
    console.log(`\n✅ Enhanced honors saved to: ${outputFile}`);
  }
  
  showStatistics(enhancedHonors);
  
  console.log(`\n=== ENHANCEMENT COMPLETE ===`);
  console.log(`Processed: ${enhancedHonors.length} honors`);
  
  if (args.testSample === 0 && args.limit === 0 && !args.dryRun) {
    console.log(`🎉 FULL DATASET ENHANCED! All ${enhancedHonors.length} honors now include detailed page data.`);
  }
}

run().catch(console.error);
