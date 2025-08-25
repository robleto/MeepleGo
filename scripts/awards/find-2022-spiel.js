#!/usr/bin/env node
// Find 2022 Spiel honor pages by testing specific ID patterns around known working IDs
const { buildAuthHeaders, extractGameIdsFromHonor } = require('./fetchers');
require('dotenv').config({ path: '.env.local' });

async function testSpecificId(id, slug) {
  try {
    const response = await fetch(`https://boardgamegeek.com/boardgamehonor/${id}/${slug}`, {
      headers: buildAuthHeaders()
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // Validate it contains Spiel content and game links
    if (!html.includes('Spiel des Jahres')) return null;
    
    const gameIds = extractGameIdsFromHonor(html);
    if (gameIds.length === 0) return null;
    
    return { id, slug, gameIds: gameIds.length };
    
  } catch (e) {
    return null;
  }
}

async function run() {
  console.log('Testing specific ID patterns for 2022 Spiel des Jahres...');
  
  // Known working: 2023: 89000-89002, 2024: 104460, 104463, 106852
  // Test ranges around these patterns for 2022
  
  const testRanges = [
    // Pattern 1: Lower sequential from 2023
    { name: 'Sequential below 2023', base: 85000, range: 20 },
    { name: 'Lower sequential 2', base: 80000, range: 30 },
    // Pattern 2: Around 2024 pattern minus ~15k-20k
    { name: 'Offset from 2024 pattern', base: 85000, range: 30 },
    { name: 'Another offset', base: 90000, range: 20 }
  ];
  
  const categories = ['winner', 'nominee', 'recommended'];
  const found = [];
  
  for (const range of testRanges) {
    console.log(`\nTesting ${range.name} (${range.base}-${range.base + range.range})...`);
    
    for (let offset = 0; offset <= range.range; offset++) {
      const id = range.base + offset;
      
      for (const cat of categories) {
        const slug = `2022-spiel-des-jahres-${cat}`;
        const result = await testSpecificId(id, slug);
        
        if (result) {
          console.log(`✅ Found ${cat} at ID ${id} (${result.gameIds} games)`);
          found.push(result);
        }
        
        await new Promise(r => setTimeout(r, 100));
      }
      
      if (found.length >= 3) {
        console.log(`Found enough for 2022, stopping search.`);
        break;
      }
    }
    
    if (found.length >= 3) break;
  }
  
  if (found.length === 0) {
    console.log('\n❌ No 2022 honor pages found in tested ranges.');
    console.log('May need to try broader ranges or different patterns.');
  } else {
    console.log(`\n✅ Found ${found.length} honor pages for 2022:`);
    found.forEach(f => {
      console.log(`          { id: ${f.id}, slug: '${f.slug}' },`);
    });
  }
}

run().catch(e => { console.error(e); process.exit(1); });
