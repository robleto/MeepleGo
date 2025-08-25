#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('=== RETRYING BGG HONOR PAGES 34-60 ===');

const allHonors = [];
const startTime = Date.now();

// Get cookies from environment
const cookies = process.env.BGG_COOKIES;
if (!cookies) {
  console.error('Error: BGG_COOKIES not found in .env.local');
  process.exit(1);
}

console.log('Using BGG cookies for authentication...');

// Function to extract honor links from a page
function extractHonorLinks(pageContent) {
  const links = [];
  const lines = pageContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for href="/boardgamehonor/ links
    const hrefMatch = line.match(/href="\/boardgamehonor\/(\d+)\/([^"]+)"/);
    if (hrefMatch) {
      const honorId = hrefMatch[1];
      const honorSlug = hrefMatch[2];
      links.push({
        id: honorId,
        slug: honorSlug,
        url: `/boardgamehonor/${honorId}/${honorSlug}`
      });
    }
  }
  
  return links;
}

// Retry pages 34-60 with longer delays
for (let page = 34; page <= 60; page++) {
  try {
    console.log(`Fetching page ${page}/60...`);
    
    const url = `https://boardgamegeek.com/browse/boardgamehonor/page/${page}`;
    
    // Use curl with cookies and longer timeout
    const pageContent = execSync(`curl -s -H "Cookie: ${cookies}" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" "${url}"`, { 
      encoding: 'utf8',
      timeout: 45000 // 45 second timeout
    });
    
    const honorLinks = extractHonorLinks(pageContent);
    allHonors.push(...honorLinks);
    
    console.log(`  Found ${honorLinks.length} honors on page ${page}`);
    
    // Show some sample links from this page if found
    if (honorLinks.length > 0) {
      console.log(`  Sample: ${honorLinks[0].slug}`);
      // Look for As d'Or specifically
      const asDorOnPage = honorLinks.filter(h => 
        h.slug.toLowerCase().includes('as-d') || 
        h.slug.toLowerCase().includes('dor') ||
        h.slug.toLowerCase().includes('enfant') ||
        h.slug.toLowerCase().includes('jeu-de-l')
      );
      if (asDorOnPage.length > 0) {
        console.log(`  ** Found ${asDorOnPage.length} As d'Or honors on this page! **`);
        asDorOnPage.forEach(honor => console.log(`     ${honor.slug}`));
      }
    }
    
    // If we get no results, save debug info
    if (honorLinks.length === 0) {
      const debugFile = `debug-retry-page-${page}.html`;
      fs.writeFileSync(debugFile, pageContent);
      console.log(`  No honors found, saved debug to ${debugFile}`);
      
      // Check page content
      const hasTable = pageContent.includes('forum_table');
      const hasError = pageContent.includes('error') || pageContent.includes('404');
      const hasContent = pageContent.length > 1000;
      console.log(`  Page analysis: hasTable=${hasTable}, hasError=${hasError}, contentLength=${pageContent.length}`);
      
      // Check for specific error messages
      if (pageContent.includes('no results')) {
        console.log(`  Page reports 'no results'`);
      }
      if (pageContent.includes('beyond')) {
        console.log(`  Page may be beyond available range`);
      }
    }
    
    // Longer delay between requests to be respectful
    console.log(`  Waiting 3 seconds before next request...`);
    execSync('sleep 3');
    
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error.message);
    // Wait longer on error
    console.log(`  Waiting 5 seconds after error...`);
    execSync('sleep 5');
  }
}

const endTime = Date.now();
const duration = Math.round((endTime - startTime) / 1000);

console.log(`\n=== RETRY COMPLETE ===`);
console.log(`Total honors collected from pages 34-60: ${allHonors.length}`);
console.log(`Time taken: ${duration} seconds`);

if (allHonors.length > 0) {
  // Save the results
  const outputFile = 'honors-pages-34-60.json';
  fs.writeFileSync(outputFile, JSON.stringify(allHonors, null, 2));
  console.log(`Results saved to: ${outputFile}`);

  // Show some sample entries
  console.log(`\nSample honors:`);
  allHonors.slice(0, 5).forEach(honor => {
    console.log(`  ${honor.id}: ${honor.slug}`);
  });

  // Look for As d'Or honors specifically
  const asDorHonors = allHonors.filter(honor => 
    honor.slug.toLowerCase().includes('as-d') || 
    honor.slug.toLowerCase().includes('dor') ||
    honor.slug.toLowerCase().includes('enfant') ||
    honor.slug.toLowerCase().includes('jeu-de-l')
  );

  console.log(`\nAs d'Or related honors found: ${asDorHonors.length}`);
  asDorHonors.forEach(honor => {
    console.log(`  ${honor.id}: ${honor.slug}`);
  });

  // Show year distribution
  const yearCounts = {};
  allHonors.forEach(honor => {
    const year = honor.slug.substring(0, 4);
    if (/^\d{4}$/.test(year)) {
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    }
  });
  
  const years = Object.keys(yearCounts).sort();
  if (years.length > 0) {
    console.log(`\nYear range: ${years[0]} - ${years[years.length - 1]}`);
  }
} else {
  console.log('\nNo honors found in retry attempt.');
}
