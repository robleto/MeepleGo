const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Function to parse honor links from BGG browse pages
function parseHonorLinksFromHtml(html) {
  const honorLinks = [];
  
  // Look for honor links in the format /boardgamehonor/12345/honor-name
  const honorRegex = /\/boardgamehonor\/(\d+)\/([^"'>\s]+)/g;
  let match;
  
  while ((match = honorRegex.exec(html)) !== null) {
    const honorId = parseInt(match[1]);
    const slug = match[2];
    
    // Only include Spiel des Jahres related honors
    if (slug.includes('spiel-des-jahres') || slug.includes('kennerspiel-des-jahres')) {
      honorLinks.push({
        honor_id: honorId,
        slug: slug,
        url: `https://boardgamegeek.com/boardgamehonor/${honorId}/${slug}`
      });
    }
  }
  
  return honorLinks;
}

// Function to scrape BGG honor browse pages for Spiel des Jahres honors
async function findSpielDesJahresHonors() {
  console.log('=== BGG HONOR ID FINDER ===');
  console.log('Searching BGG honor browse pages for Spiel des Jahres honor IDs...');
  
  const allHonors = [];
  const maxPages = 65; // BGG has about 60+ pages
  
  for (let page = 1; page <= maxPages; page++) {
    console.log(`\nScanning page ${page}/${maxPages}...`);
    
    try {
      const url = `https://boardgamegeek.com/browse/boardgamehonor/page/${page}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`  ✗ Page ${page} not accessible (${response.status})`);
        continue;
      }
      
      const html = await response.text();
      
      // Check if the page requires login
      if (html.includes('sign in') || html.includes('Sign In') || html.includes('No results available')) {
        console.log(`  ✗ Page ${page} requires login or has no results`);
        continue;
      }
      
      const honorLinks = parseHonorLinksFromHtml(html);
      
      if (honorLinks.length > 0) {
        console.log(`  ✓ Found ${honorLinks.length} Spiel des Jahres related honors`);
        honorLinks.forEach(honor => {
          console.log(`    - ${honor.honor_id}: ${honor.slug}`);
        });
        allHonors.push(...honorLinks);
      } else {
        console.log(`  - No Spiel des Jahres honors found on page ${page}`);
      }
      
    } catch (error) {
      console.log(`  ✗ Error scanning page ${page}: ${error.message}`);
    }
    
    // Rate limiting to be respectful to BGG
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Stop early if we're getting login pages
    if (page > 5 && allHonors.length === 0) {
      console.log('\nStopping early - seems like we hit login requirements');
      break;
    }
  }
  
  console.log(`\n=== HONOR SEARCH COMPLETE ===`);
  console.log(`Found ${allHonors.length} total Spiel des Jahres related honors`);
  
  // Filter for recent years (2020-2024)
  const recentHonors = allHonors.filter(honor => 
    honor.slug.includes('2020') || 
    honor.slug.includes('2021') || 
    honor.slug.includes('2022') || 
    honor.slug.includes('2023') || 
    honor.slug.includes('2024')
  );
  
  console.log(`\nRecent honors (2020-2024):`);
  recentHonors.forEach(honor => {
    console.log(`${honor.honor_id}: ${honor.slug}`);
    console.log(`  URL: ${honor.url}`);
  });
  
  // Look specifically for 2024 honors
  const honors2024 = allHonors.filter(honor => honor.slug.includes('2024'));
  
  console.log(`\n2024 Spiel des Jahres honors found:`);
  honors2024.forEach(honor => {
    console.log(`${honor.honor_id}: ${honor.slug}`);
    console.log(`  URL: ${honor.url}`);
  });
  
  return {
    allHonors,
    recentHonors,
    honors2024
  };
}

// Alternative approach: Try known pattern of honor IDs
async function tryKnownHonorPatterns() {
  console.log('\n=== TRYING KNOWN HONOR PATTERNS ===');
  
  // Based on the URL you provided (104460), let's try nearby IDs
  const baseId = 104460;
  const variations = [
    { id: baseId - 2, name: '2024-spiel-des-jahres-winner' },
    { id: baseId - 1, name: '2024-spiel-des-jahres-recommended' },
    { id: baseId, name: '2024-spiel-des-jahres-nominee' },
    { id: baseId + 1, name: '2024-kennerspiel-des-jahres-winner' },
    { id: baseId + 2, name: '2024-kennerspiel-des-jahres-nominee' }
  ];
  
  const validHonors = [];
  
  for (const variation of variations) {
    const url = `https://boardgamegeek.com/boardgamehonor/${variation.id}/${variation.name}`;
    console.log(`\nTesting: ${url}`);
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const html = await response.text();
        
        // Check if the page has actual content or is just a placeholder
        if (!html.includes('This page does not exist')) {
          console.log(`  ✓ Valid honor page found!`);
          validHonors.push({
            honor_id: variation.id,
            name: variation.name,
            url: url
          });
        } else {
          console.log(`  - Page exists but no content yet`);
        }
      } else {
        console.log(`  ✗ Not found (${response.status})`);
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\nValid honor pages found: ${validHonors.length}`);
  validHonors.forEach(honor => {
    console.log(`${honor.honor_id}: ${honor.name}`);
    console.log(`  URL: ${honor.url}`);
  });
  
  return validHonors;
}

// Main function
async function main() {
  console.log('BGG Honor ID Discovery Tool');
  console.log('=============================\n');
  
  // Try the browse approach first
  const browseResults = await findSpielDesJahresHonors();
  
  // Try known patterns as backup
  const patternResults = await tryKnownHonorPatterns();
  
  console.log('\n=== SUMMARY ===');
  console.log(`Browse method found: ${browseResults.honors2024.length} 2024 honors`);
  console.log(`Pattern method found: ${patternResults.length} valid honors`);
  
  // Combine and deduplicate results
  const allFound = [...browseResults.honors2024, ...patternResults];
  const unique = allFound.filter((honor, index, self) => 
    index === self.findIndex(h => h.honor_id === honor.honor_id)
  );
  
  console.log(`\nTotal unique honor pages to investigate: ${unique.length}`);
  unique.forEach(honor => {
    console.log(`- ${honor.honor_id}: ${honor.name || honor.slug}`);
  });
}

// Run the discovery
if (require.main === module) {
  main()
    .then(() => {
      console.log('\nDiscovery completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Discovery failed:', error);
      process.exit(1);
    });
}

module.exports = { findSpielDesJahresHonors, tryKnownHonorPatterns, parseHonorLinksFromHtml };
