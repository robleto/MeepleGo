#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('=== COLLECTING ALL BGG HONOR LINKS ===');

const allHonors = [];
const startTime = Date.now();

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
    const pageContent = execSync(`curl -s "${url}"`, { encoding: 'utf8' });
    
    const honorLinks = extractHonorLinks(pageContent);
    allHonors.push(...honorLinks);
    
    console.log(`  Found ${honorLinks.length} honors on page ${page}`);
    
    // Small delay to be respectful to BGG
    if (page % 10 === 0) {
      console.log(`  Processed ${page} pages so far... (${allHonors.length} total honors)`);
      // Brief pause every 10 pages
      execSync('sleep 1');
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
const outputFile = 'all-bgg-honors.json';
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
  honor.slug.toLowerCase().includes('dor')
);

console.log(`\nAs d'Or honors found: ${asDorHonors.length}`);
asDorHonors.forEach(honor => {
  console.log(`  ${honor.id}: ${honor.slug}`);
});
