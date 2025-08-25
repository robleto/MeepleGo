#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const zlib = require('zlib');

console.log('=== TESTING SPECIFIC AS D\'OR HONORS ===');

// Load the test dataset
const honorsDataset = JSON.parse(fs.readFileSync('test-asdor-honors-mini.json', 'utf8'));

console.log(`Processing ${honorsDataset.length} test honors`);

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
    // Parse Primary Name from the page title first
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      const fullTitle = titleMatch[1].replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      // Extract the main part before " | Board Game Honor"
      const titleParts = fullTitle.split(' | ');
      if (titleParts.length > 0) {
        result.primaryName = titleParts[0].trim();
      }
    }
    
    // Parse Primary Name from the table structure as backup
    if (!result.primaryName) {
      const primaryNameMatch = html.match(/<b>Primary Name<\/b>\s*<\/td>\s*<td>.*?<div[^>]*>\s*([^<]+)/s);
      if (primaryNameMatch) {
        result.primaryName = primaryNameMatch[1].trim();
      }
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

async function run() {
  require('dotenv').config({ path: '.env.local' });
  
  const enhancedHonors = [];
  
  for (const honor of honorsDataset) {
    try {
      console.log(`Processing: ${honor.title}`);
      const html = await fetchHonorPage(honor);
      const enhancedHonor = parseHonorPageData(html, honor);
      enhancedHonors.push(enhancedHonor);
      
      console.log(`  Primary name: ${enhancedHonor.primaryName}`);
      console.log(`  Award set: ${enhancedHonor.awardSet}`);
      console.log(`  Position: ${enhancedHonor.position}`);
      console.log(`  Boardgames: ${enhancedHonor.boardgames.length}`);
      enhancedHonor.boardgames.forEach(game => {
        console.log(`    - ${game.name} (${game.bggId})`);
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing ${honor.title}: ${error.message}`);
    }
  }
  
  fs.writeFileSync('enhanced-asdor-test-result.json', JSON.stringify(enhancedHonors, null, 2));
  console.log(`\n✅ Test complete. Results saved to enhanced-asdor-test-result.json`);
}

run();
