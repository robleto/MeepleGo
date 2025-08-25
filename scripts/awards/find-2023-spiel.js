#!/usr/bin/env node
// Find 2023 Spiel des Jahres honor page IDs by searching browse pages
const { fetchHonorBrowsePage, extractHonorLinks, buildAuthHeaders } = require('./fetchers');
require('dotenv').config({ path: '.env.local' });

async function run() {
  console.log('Searching for 2023 Spiel des Jahres honor pages...');
  
  const found = [];
  
  for (let page = 1; page <= 20; page++) {
    console.log(`Checking page ${page}...`);
    try {
      const html = await fetchHonorBrowsePage(page);
      const links = extractHonorLinks(html);
      
      const spiel2023 = links.filter(link => 
        link.slug.includes('2023') && 
        link.slug.includes('spiel-des-jahres') &&
        !link.slug.includes('kennerspiel') &&
        !link.slug.includes('kinder')
      );
      
      if (spiel2023.length > 0) {
        console.log(`Found on page ${page}:`, spiel2023);
        found.push(...spiel2023);
      }
      
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      if (e.message.includes('404')) break;
      console.error(`Error on page ${page}:`, e.message);
    }
  }
  
  if (found.length === 0) {
    console.log('No 2023 Spiel des Jahres honors found. Trying direct URL guess...');
    
    // Try common ID patterns around 2024 IDs (104460, 104463, 106852)
    const guesses = [
      { id: 89000, slug: '2023-spiel-des-jahres-winner' },
      { id: 89001, slug: '2023-spiel-des-jahres-nominee' },
      { id: 89002, slug: '2023-spiel-des-jahres-recommended' },
      { id: 90000, slug: '2023-spiel-des-jahres-winner' },
      { id: 90001, slug: '2023-spiel-des-jahres-nominee' },
      { id: 90002, slug: '2023-spiel-des-jahres-recommended' }
    ];
    
    for (const guess of guesses) {
      try {
        const response = await fetch(`https://boardgamegeek.com/boardgamehonor/${guess.id}/${guess.slug}`, {
          headers: buildAuthHeaders()
        });
        if (response.ok) {
          console.log(`✅ Found: ${guess.id} - ${guess.slug}`);
          found.push(guess);
        }
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        // ignore
      }
    }
  }
  
  console.log('\n=== 2023 Spiel des Jahres Honor Pages ===');
  if (found.length > 0) {
    found.forEach(f => console.log(`{ id: ${f.id}, slug: '${f.slug}' },`));
    console.log('\nAdd these to the manual2023 array in import.js');
  } else {
    console.log('None found. May need to search BGG manually or try different ID ranges.');
  }
}

run().catch(e => { console.error(e); process.exit(1); });
