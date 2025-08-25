#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('=== COLLECTING ALL BGG HONOR LINKS WITH AUTHENTICATION ===');

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

// Collect honor links from all pages
for (let page = 1; page <= 60; page++) {
  try {
    console.log(`Fetching page ${page}/60...`);
    
    const url = `https://boardgamegeek.com/browse/boardgamehonor/page/${page}`;
    
    // Use curl with cookies
    const pageContent = execSync(`curl -s -H "Cookie: ${cookies}" "${url}"`, { 
      encoding: 'utf8',
      timeout: 30000 // 30 second timeout
    });
    
    const honorLinks = extractHonorLinks(pageContent);
    allHonors.push(...honorLinks);
    
    console.log(`  Found ${honorLinks.length} honors on page ${page}`);
    
    // Show some sample links from this page if found
    if (honorLinks.length > 0 && page % 10 === 0) {
      console.log(`  Sample from page ${page}: ${honorLinks[0].slug}`);
    }
    
    // Small delay to be respectful to BGG
    if (page % 10 === 0) {
      console.log(`  Processed ${page} pages so far... (${allHonors.length} total honors)`);
      // Brief pause every 10 pages
      execSync('sleep 2');
    }
    
    // If we get no results, save debug info
    if (honorLinks.length === 0) {
      const debugFile = `debug-page-${page}.html`;
      fs.writeFileSync(debugFile, pageContent);
      console.log(`  No honors found, saved debug to ${debugFile}`);
      
      // Check if page contains any table content
      const hasTable = pageContent.includes('forum_table');
      const hasError = pageContent.includes('error') || pageContent.includes('404');
      console.log(`  Page analysis: hasTable=${hasTable}, hasError=${hasError}`);
    }
    
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error.message);
  }
}

const endTime = Date.now();
const duration = Math.round((endTime - startTime) / 1000);

console.log(`\n=== COLLECTION COMPLETE ===`);
console.log(`Total honors collected: ${allHonors.length}`);
console.log(`Time taken: ${duration} seconds`);

// Save the results
const outputFile = 'all-bgg-honors-authenticated.json';
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
if (allHonors.length > 0) {
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
    console.log(`Years with most honors:`);
    Object.entries(yearCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([year, count]) => {
        console.log(`  ${year}: ${count} honors`);
      });
  }
}
