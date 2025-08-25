#!/usr/bin/env node
// Find 2022 Spiel honor pages by validating they contain known 2022 winner Cascadia (ID: 295947)
const { buildAuthHeaders, extractGameIdsFromHonor } = require('./fetchers');
require('dotenv').config({ path: '.env.local' });

async function testForCascadia(id, slug) {
  try {
    const response = await fetch(`https://boardgamegeek.com/boardgamehonor/${id}/${slug}`, {
      headers: buildAuthHeaders()
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // Check if this honor page contains Cascadia (BGG ID 295947)
    const hasCascadia = html.includes('/boardgame/295947/') || html.includes('Cascadia');
    
    if (hasCascadia) {
      const gameIds = extractGameIdsFromHonor(html);
      return { id, slug, gameIds: gameIds.length, containsCascadia: true };
    }
    
    return null;
    
  } catch (e) {
    return null;
  }
}

async function run() {
  console.log('Searching for 2022 Spiel des Jahres honor pages containing Cascadia...');
  
  // Expand search ranges significantly
  const testRanges = [
    { name: 'Range 1', base: 70000, range: 100 },
    { name: 'Range 2', base: 75000, range: 100 },
    { name: 'Range 3', base: 80000, range: 100 },
    { name: 'Range 4', base: 85000, range: 100 },
    { name: 'Range 5', base: 60000, range: 100 },
    { name: 'Range 6', base: 65000, range: 100 }
  ];
  
  const categories = ['winner', 'nominee', 'recommended'];
  const found = [];
  
  for (const range of testRanges) {
    console.log(`\nTesting ${range.name} (${range.base}-${range.base + range.range})...`);
    
    for (let offset = 0; offset <= range.range; offset++) {
      const id = range.base + offset;
      
      for (const cat of categories) {
        const slug = `2022-spiel-des-jahres-${cat}`;
        const result = await testForCascadia(id, slug);
        
        if (result) {
          console.log(`✅ Found ${cat} at ID ${id} (${result.gameIds} games, contains Cascadia)`);
          found.push(result);
        }
        
        await new Promise(r => setTimeout(r, 100));
      }
      
      // Stop after finding at least 3 (winner, nominee, recommended)
      if (found.length >= 3) {
        console.log(`Found enough for 2022, stopping search.`);
        break;
      }
    }
    
    if (found.length >= 3) break;
  }
  
  if (found.length === 0) {
    console.log('\n❌ No 2022 honor pages found containing Cascadia.');
    console.log('The honor page ID structure may be different than expected.');
  } else {
    console.log(`\n✅ Found ${found.length} honor pages for 2022:`);
    found.forEach(f => {
      console.log(`          { id: ${f.id}, slug: '${f.slug}' },`);
    });
  }
}

run().catch(e => { console.error(e); process.exit(1); });
