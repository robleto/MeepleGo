#!/usr/bin/env node
// Batch find Spiel des Jahres honor page IDs for all years 1979-2022
const { buildAuthHeaders } = require('./fetchers');
require('dotenv').config({ path: '.env.local' });

async function findYearHonorIds(year) {
  console.log(`Searching for ${year} Spiel des Jahres honor pages...`);
  
  const found = [];
  const categories = ['winner', 'nominee', 'recommended'];
  
  // Try multiple ID ranges - BGG IDs seem to be roughly chronological
  const baseRanges = [
    year * 100,     // e.g., 2022 -> ~222200
    year * 50,      // e.g., 2022 -> ~101100  
    year * 10,      // e.g., 2022 -> ~20220
    (year - 1979) * 1000 + 10000, // offset from 1979
    (year - 1979) * 500 + 50000   // another offset pattern
  ];
  
  for (const base of baseRanges) {
    for (let offset = 0; offset <= 20; offset++) {
      for (const cat of categories) {
        const id = base + offset;
        const slug = `${year}-spiel-des-jahres-${cat}`;
        
        try {
          const response = await fetch(`https://boardgamegeek.com/boardgamehonor/${id}/${slug}`, {
            headers: buildAuthHeaders()
          });
          
          if (response.ok) {
            console.log(`✅ ${year}: Found ${cat} at ID ${id}`);
            found.push({ id, slug, category: cat });
          }
          
          await new Promise(r => setTimeout(r, 100)); // Rate limit
        } catch (e) {
          // ignore errors, keep searching
        }
      }
    }
  }
  
  return found;
}

async function run() {
  const allFound = {};
  
  // Search years 2022 down to 1979 (skip 2023-2024 which we have)
  for (let year = 2022; year >= 1979; year--) {
    const found = await findYearHonorIds(year);
    if (found.length > 0) {
      allFound[year] = found;
      console.log(`${year}: Found ${found.length} honor pages`);
    } else {
      console.log(`${year}: No honor pages found`);
    }
    
    // Longer pause between years
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n=== RESULTS FOR IMPORT.JS ===');
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
