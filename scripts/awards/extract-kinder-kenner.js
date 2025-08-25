#!/usr/bin/env node
// Extract Kinderspiel and Kennerspiel honor details from BGG search results
const https = require('https');

const kinderIds = [12739,12740,12741,12742,12744,12745,12746,12747,12748,12749,12750,12751,12752,12753,12754,12755,12756,12758,19364,19365,19366,19367,19368,19369,19370,19371,19372,19373,19375,19376,19377,19378,19379,19380,19381,19382,19383,19384,19386,19387,19389,19390,19392,19393,19394,19395,19396,22475,22476,22477,22478,22479,22480,22481,22482,22483,22484,22485,22486,22487,22488,22489,22490,22491,22506,22507,22508,22509,22510,22511,22512,22513,22514,22517,22518,22519,22520,22521,22522,22523,22524,22525,22526,22527,22528,22529,22530,22531,22532,22533,22534,22537,22538,22539,22540,22541,22542,22543,22544,22545];

const kennerIds = [11078,18371,18372,18504,18521,22570,22573,22854,25144,25147,25490,27376,27377,27749,35994,35995,36966,41953,41956,42730,48401,48404,49381,56348,56968,62466,62468,62472,63051,70795,70798,71452,75832,75835,76498,80326,80329,81210,104461,104464,106854,111383,111386,112339];

async function getHonorDetails(ids, awardName) {
  const honors = [];
  console.log(`Processing ${ids.length} ${awardName} honors...`);
  
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    try {
      const searchHtml = await fetchSearchPage(awardName);
      const titleMatch = searchHtml.match(new RegExp(`href="/boardgamehonor/${id}/[^"]*"[^>]*>([^<]+)</a>`));
      
      if (titleMatch) {
        const title = titleMatch[1].trim();
        const yearMatch = title.match(/(\d{4})/);
        
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          let category = 'recommended';
          
          if (title.toLowerCase().includes('winner')) category = 'winner';
          else if (title.toLowerCase().includes('nominee')) category = 'nominee';
          
          const slug = `${year}-${awardName.toLowerCase()}-des-jahres-${category}`;
          honors.push({ id, year, category, slug, title });
        }
      }
      
      // Rate limiting
      if (i % 10 === 0) await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.error(`Error processing ${awardName} ID ${id}:`, error.message);
    }
  }
  
  return honors;
}

async function fetchSearchPage(award) {
  return new Promise((resolve, reject) => {
    const url = `https://boardgamegeek.com/geeksearch.php?action=search&objecttype=boardgamehonor&q=${award}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function generateManualEntries(honors, awardName) {
  const yearGroups = {};
  honors.forEach(honor => {
    if (!yearGroups[honor.year]) yearGroups[honor.year] = [];
    yearGroups[honor.year].push(honor);
  });
  
  const sortedYears = Object.keys(yearGroups).sort((a, b) => parseInt(a) - parseInt(b));
  
  console.log(`\n=== ${awardName.toUpperCase()} DES JAHRES MANUAL ENTRIES ===`);
  console.log(`// Historical ${awardName.toLowerCase()} entries (${sortedYears.length} years: ${sortedYears[0]}-${sortedYears[sortedYears.length-1]})`);
  
  sortedYears.forEach(year => {
    console.log(`      // ${year}`);
    yearGroups[year].forEach(honor => {
      console.log(`      { id: ${honor.id}, slug: '${honor.slug}' }, // ${honor.category}`);
    });
  });
}

async function main() {
  console.log('Processing Kinderspiel and Kennerspiel honor details...');
  
  const kinderHonors = await getHonorDetails(kinderIds, 'Kinderspiel');
  const kennerHonors = await getHonorDetails(kennerIds, 'Kennerspiel');
  
  console.log(`\nFound ${kinderHonors.length} Kinderspiel honors and ${kennerHonors.length} Kennerspiel honors.`);
  
  generateManualEntries(kinderHonors, 'Kinderspiel');
  generateManualEntries(kennerHonors, 'Kennerspiel');
}

main().catch(console.error);
