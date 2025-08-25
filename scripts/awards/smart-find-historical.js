#!/usr/bin/env node
// Smart search for valid Spiel des Jahres honor page IDs by validating content
const { buildAuthHeaders, extractGameIdsFromHonor } = require('./fetchers');
require('dotenv').config({ path: '.env.local' });

async function validateHonorPage(id, slug) {
  try {
    const response = await fetch(`https://boardgamegeek.com/boardgamehonor/${id}/${slug}`, {
      headers: buildAuthHeaders()
    });
    
    if (!response.ok) return false;
    
    const html = await response.text();
    
    // Validate it's actually a Spiel honor page with game links
    if (!html.includes('Spiel des Jahres')) return false;
    
    // Extract game IDs to verify content
    const gameIds = extractGameIdsFromHonor(html);
    return gameIds.length > 0;
    
  } catch (e) {
    return false;
  }
}

async function findValidYearHonorIds(year) {
  console.log(`\nSearching for valid ${year} Spiel des Jahres honor pages...`);
  
  const found = [];
  const categories = ['winner', 'nominee', 'recommended'];
  
  // More targeted ID ranges based on patterns from 2023-2024
  const ranges = [
    // 2024: 104460, 104463, 106852
    // 2023: 89000, 89001, 89002
    // Pattern suggests roughly: year offset * multiplier
    { base: (2024 - year) * 1000 + 80000, range: 50 },
    { base: (2024 - year) * 500 + 85000, range: 30 },
    { base: year * 50 - 30000, range: 20 }
  ];
  
  for (const { base, range } of ranges) {
    console.log(`  Checking range ${base}-${base + range}...`);
    
    for (let offset = 0; offset <= range; offset++) {
      for (const cat of categories) {
        const id = base + offset;
        const slug = `${year}-spiel-des-jahres-${cat}`;
        
        const isValid = await validateHonorPage(id, slug);
        if (isValid) {
          console.log(`    ✅ Found valid ${cat} at ID ${id}`);
          found.push({ id, slug, category: cat });
        }
        
        await new Promise(r => setTimeout(r, 150)); // Rate limit
      }
      
      if (found.length >= 3) break; // Found all categories, move to next year
    }
    
    if (found.length >= 3) break; // Found enough, try next year
  }
  
  return found;
}

async function run() {
  console.log('🔍 Smart search for historical Spiel des Jahres honor pages...');
  
  const allFound = {};
  
  // Start with recent years and work backwards (more likely to find patterns)
  for (let year = 2022; year >= 2020; year--) {
    const found = await findValidYearHonorIds(year);
    if (found.length > 0) {
      allFound[year] = found;
      console.log(`✅ ${year}: Found ${found.length} valid honor pages`);
    } else {
      console.log(`❌ ${year}: No valid honor pages found`);
    }
    
    await new Promise(r => setTimeout(r, 1000)); // Longer pause between years
  }
  
  if (Object.keys(allFound).length === 0) {
    console.log('\n❌ No valid honor pages found. The ID patterns may have changed.');
    console.log('Try manually checking BGG for a few specific years to find the pattern.');
    return;
  }
  
  console.log('\n=== VALID RESULTS FOR IMPORT.JS ===');
  console.log('Add these manual year blocks to import.js:\n');
  
  Object.entries(allFound).forEach(([year, pages]) => {
    console.log(`      // Manual ensure for ${year} pages if within range`);
    console.log(`      if (args.since <= ${year} && args.until >= ${year}) {`);
    console.log(`        const manual${year} = [`);
    pages.forEach(p => {
      console.log(`          { id: ${p.id}, slug: '${p.slug}' },`);
    });
    console.log(`        ];`);
    console.log(`        for (const m of manual${year}) if (!filtered.find(f=>f.slug===m.slug)) filtered.push(m);`);
    console.log(`      }`);
    console.log('');
  });
}

run().catch(e => { console.error(e); process.exit(1); });
