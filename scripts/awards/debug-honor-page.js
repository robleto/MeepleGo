#!/usr/bin/env node

const https = require('https');
const zlib = require('zlib');

// Debug a specific honor page to understand the HTML structure
async function debugHonorPage(honorId, slug) {
  return new Promise((resolve, reject) => {
    const url = `https://boardgamegeek.com/boardgamehonor/${honorId}/${slug}`;
    console.log(`Fetching: ${url}`);
    
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
        let buffer = Buffer.concat(data);
        
        // Handle different encodings
        if (res.headers['content-encoding'] === 'gzip') {
          buffer = zlib.gunzipSync(buffer);
        } else if (res.headers['content-encoding'] === 'deflate') {
          buffer = zlib.inflateSync(buffer);
        }
        
        const html = buffer.toString('utf8');
        resolve(html);
      });
    }).on('error', reject);
  });
}

async function main() {
  require('dotenv').config({ path: '.env.local' });
  
  // Test with a known As d'Or honor that should have good data
  const honorId = '104574'; // 2024 As d'Or Jeu de l'Année Winner
  const slug = '2024-as-dor-jeu-de-lannee-winner';
  
  try {
    const html = await debugHonorPage(honorId, slug);
    
    console.log(`=== HTML CONTENT SAMPLE ===`);
    console.log(`Length: ${html.length} characters`);
    
    // Show first 2000 characters
    console.log(`First 2000 characters:`);
    console.log(html.substring(0, 2000));
    
    console.log(`\n=== SEARCH FOR KEY PATTERNS ===`);
    
    // Look for header patterns
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    if (h1Match) {
      console.log(`H1 found: ${h1Match[1]}`);
    } else {
      console.log(`No H1 found`);
    }
    
    // Look for game links
    const gameLinks = html.match(/href="\/boardgame\/\d+\/[^"]*"/g);
    if (gameLinks) {
      console.log(`Game links found: ${gameLinks.length}`);
      gameLinks.slice(0, 3).forEach(link => console.log(`  ${link}`));
    } else {
      console.log(`No game links found`);
    }
    
    // Look for table structures
    const tables = html.match(/<table[^>]*>/g);
    if (tables) {
      console.log(`Tables found: ${tables.length}`);
    }
    
    // Look for specific text patterns
    const patterns = [
      'Primary Name',
      'Alternate Names',
      'Boardgames',
      'Award Set',
      'Position',
      'Winner',
      'Nominee'
    ];
    
    patterns.forEach(pattern => {
      if (html.includes(pattern)) {
        console.log(`Found text: "${pattern}"`);
        // Show context around the match
        const index = html.indexOf(pattern);
        const context = html.substring(Math.max(0, index - 100), index + 200);
        console.log(`  Context: ${context.replace(/\s+/g, ' ')}`);
      }
    });
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

main();
