#!/usr/bin/env node
// Systematic scraper to discover Kinderspiel and Kennerspiel des Jahres honors from BGG browse pages
const https = require('https');

async function fetchBrowsePage(page) {
  return new Promise((resolve, reject) => {
    const url = `https://boardgamegeek.com/browse/boardgamehonor/page/${page}`;
    console.log(`Fetching page ${page}...`);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractKinderAndKennerHonors(html) {
  const lines = html.split('\n');
  const honors = [];
  
  for (const line of lines) {
    // Look for Kinderspiel or Kennerspiel honors - they appear as "Spiel des Jahres Kinderspiel" or "Spiel des Jahres Kennerspiel"
    const kinderMatch = line.match(/href="\/boardgamehonor\/(\d+)\/[^"]*"[^>]*>([^<]*Spiel des Jahres Kinderspiel[^<]*)</i);
    const kennerMatch = line.match(/href="\/boardgamehonor\/(\d+)\/[^"]*"[^>]*>([^<]*Spiel des Jahres Kennerspiel[^<]*)</i);
    
    if (kinderMatch) {
      const [, id, title] = kinderMatch;
      honors.push({ id: parseInt(id), title: title.trim(), award: 'Kinderspiel' });
    }
    
    if (kennerMatch) {
      const [, id, title] = kennerMatch;
      honors.push({ id: parseInt(id), title: title.trim(), award: 'Kennerspiel' });
    }
  }
  
  return honors;
}

async function scrapeAllPages() {
  const allHonors = [];
  let page = 1;
  let consecutiveEmpty = 0;
  
  while (consecutiveEmpty < 3 && page <= 60) {
    try {
      const html = await fetchBrowsePage(page);
      const honors = extractKinderAndKennerHonors(html);
      
      if (honors.length === 0) {
        consecutiveEmpty++;
      } else {
        consecutiveEmpty = 0;
        allHonors.push(...honors);
        console.log(`Page ${page}: Found ${honors.length} Kinder/Kenner honors`);
      }
      
      page++;
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error.message);
      break;
    }
  }
  
  return allHonors;
}

function generateManualEntries(honors) {
  const kinderHonors = honors.filter(h => h.award === 'Kinderspiel');
  const kennerHonors = honors.filter(h => h.award === 'Kennerspiel');
  
  console.log('\n=== KINDERSPIEL DES JAHRES MANUAL ENTRIES ===');
  generateEntriesForAward(kinderHonors, 'kinderspiel');
  
  console.log('\n=== KENNERSPIEL DES JAHRES MANUAL ENTRIES ===');
  generateEntriesForAward(kennerHonors, 'kennerspiel');
}

function generateEntriesForAward(honors, awardName) {
  const years = {};
  
  honors.forEach(honor => {
    const yearMatch = honor.title.match(/(\d{4})/);
    if (!yearMatch) return;
    
    const year = parseInt(yearMatch[1]);
    if (!years[year]) years[year] = [];
    
    let category = 'recommended';
    if (honor.title.toLowerCase().includes('winner')) category = 'winner';
    else if (honor.title.toLowerCase().includes('nominee')) category = 'nominee';
    
    const slug = `${year}-${awardName}-des-jahres-${category}`;
    years[year].push({ id: honor.id, slug, category });
  });
  
  const sortedYears = Object.keys(years).sort((a, b) => parseInt(a) - parseInt(b));
  
  console.log(`// Historical ${awardName} entries (${sortedYears.length} years: ${sortedYears[0]}-${sortedYears[sortedYears.length-1]})`);
  
  sortedYears.forEach(year => {
    console.log(`      // ${year}`);
    years[year].forEach(entry => {
      console.log(`      { id: ${entry.id}, slug: '${entry.slug}' },`);
    });
  });
}

async function main() {
  console.log('Starting systematic Kinder/Kennerspiel des Jahres discovery...');
  const honors = await scrapeAllPages();
  
  console.log(`\nDiscovery complete! Found ${honors.length} total Kinder/Kennerspiel honors.`);
  console.log(`Kinderspiel: ${honors.filter(h => h.award === 'Kinderspiel').length}`);
  console.log(`Kennerspiel: ${honors.filter(h => h.award === 'Kennerspiel').length}`);
  
  generateManualEntries(honors);
}

main().catch(console.error);
