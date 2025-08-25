#!/usr/bin/env node
// Systematically scrape BGG honor browse pages for ALL Spiel des Jahres entries
const { buildAuthHeaders, extractGameIdsFromHonor } = require('./fetchers');
require('dotenv').config({ path: '.env.local' });

async function fetchBrowsePage(page) {
  const url = `https://boardgamegeek.com/browse/boardgamehonor/page/${page}`;
  const response = await fetch(url, { headers: buildAuthHeaders() });
  if (!response.ok) throw new Error(`Page ${page} status ${response.status}`);
  return response.text();
}

function extractSpielHonors(html) {
  const honors = [];
  
  // Look for boardgamehonor links with Spiel des Jahres in nearby text
  // First find all honor links, then check if they're followed by Spiel des Jahres text
  const lines = html.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for boardgamehonor link
    const linkMatch = line.match(/\/boardgamehonor\/(\d+)\/([^"'\s>]+)/);
    if (linkMatch) {
      const id = parseInt(linkMatch[1]);
      const slug = linkMatch[2];
      
      // Check next few lines for the title text
      let title = '';
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].includes('Spiel des Jahres') && !lines[j].includes('Kennerspiel') && !lines[j].includes('Kinder')) {
          title = lines[j].replace(/<[^>]*>/g, '').trim();
          break;
        }
      }
      
      if (title) {
        // Extract year from title (e.g., "2024 Spiel des Jahres Recommended")
        const yearMatch = title.match(/(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1]) : null;
        
        // Extract category from title  
        let category = 'Special';
        if (title.includes('Winner')) category = 'Winner';
        else if (title.includes('Nominee')) category = 'Nominee';
        else if (title.includes('Recommended')) category = 'Recommended';
        
        if (year) {
          honors.push({ id, slug, year, category, title });
        }
      }
    }
  }
  
  return honors;
}

async function run() {
  console.log('🔍 Systematically scraping BGG browse pages for ALL Spiel des Jahres honors...\n');
  
  const allHonors = [];
  let page = 1;
  let consecutiveEmpty = 0;
  
  while (consecutiveEmpty < 5) { // Stop after 5 empty pages
    try {
      console.log(`Scanning page ${page}...`);
      const html = await fetchBrowsePage(page);
      const honors = extractSpielHonors(html);
      
      if (honors.length > 0) {
        console.log(`  Found ${honors.length} Spiel des Jahres honors`);
        allHonors.push(...honors);
        consecutiveEmpty = 0;
      } else {
        consecutiveEmpty++;
      }
      
      page++;
      await new Promise(r => setTimeout(r, 200)); // Rate limit
      
    } catch (e) {
      if (e.message.includes('404')) {
        console.log(`  Page ${page} not found, stopping.`);
        break;
      }
      console.error(`Error on page ${page}:`, e.message);
      consecutiveEmpty++;
    }
  }
  
  // Group by year
  const byYear = {};
  allHonors.forEach(h => {
    if (!byYear[h.year]) byYear[h.year] = [];
    byYear[h.year].push(h);
  });
  
  console.log(`\n✅ Found ${allHonors.length} total Spiel des Jahres honors across ${Object.keys(byYear).length} years`);
  console.log('Years covered:', Object.keys(byYear).sort().join(', '));
  
  // Generate import.js manual entries
  console.log('\n=== MANUAL ENTRIES FOR IMPORT.JS ===\n');
  
  Object.keys(byYear).sort().forEach(year => {
    const honors = byYear[year];
    console.log(`      // Manual ensure for ${year} pages if within range`);
    console.log(`      if (args.since <= ${year} && args.until >= ${year}) {`);
    console.log(`        const manual${year} = [`);
    honors.forEach(h => {
      console.log(`          { id: ${h.id}, slug: '${h.slug}' }, // ${h.category}`);
    });
    console.log(`        ];`);
    console.log(`        for (const m of manual${year}) if (!filtered.find(f=>f.slug===m.slug)) filtered.push(m);`);
    console.log(`      }`);
    console.log('');
  });
  
  // Test a few entries to validate extraction
  console.log('\n=== VALIDATION TESTS ===');
  const testEntries = allHonors.filter(h => [2024, 2023, 2022].includes(h.year)).slice(0, 3);
  
  for (const entry of testEntries) {
    try {
      const response = await fetch(`https://boardgamegeek.com/boardgamehonor/${entry.id}/${entry.slug}`, {
        headers: buildAuthHeaders()
      });
      
      if (response.ok) {
        const html = await response.text();
        const gameIds = extractGameIdsFromHonor(html);
        console.log(`✅ ${entry.year} ${entry.category}: ${gameIds.length} games found`);
      } else {
        console.log(`❌ ${entry.year} ${entry.category}: Failed to fetch (${response.status})`);
      }
      
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.log(`❌ ${entry.year} ${entry.category}: Error - ${e.message}`);
    }
  }
}

run().catch(e => { console.error(e); process.exit(1); });
