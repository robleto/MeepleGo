#!/usr/bin/env node
// Debug the actual HTML structure of browse pages
const { buildAuthHeaders } = require('./fetchers');
require('dotenv').config({ path: '.env.local' });

async function debugBrowsePage() {
  console.log('Fetching browse page 60 to examine structure...');
  
  const response = await fetch('https://boardgamegeek.com/browse/boardgamehonor/page/60', {
    headers: buildAuthHeaders()
  });
  
  if (!response.ok) {
    console.error('Failed to fetch page:', response.status);
    return;
  }
  
  const html = await response.text();
  
  console.log('Page length:', html.length);
  console.log('\n=== SEARCHING FOR SPIEL ENTRIES ===');
  
  // Look for any mention of Spiel
  const spielMatches = html.match(/[^<>]*spiel[^<>]*/gi);
  if (spielMatches) {
    console.log('Found Spiel mentions:');
    spielMatches.slice(0, 10).forEach((match, i) => {
      console.log(`  ${i+1}: ${match.trim()}`);
    });
  } else {
    console.log('No "spiel" found in page');
  }
  
  console.log('\n=== SEARCHING FOR BOARDGAMEHONOR LINKS ===');
  
  // Look for any boardgamehonor links
  const honorLinks = html.match(/\/boardgamehonor\/\d+\/[^"'\s>]*/g);
  if (honorLinks) {
    console.log('Found honor links:');
    honorLinks.slice(0, 10).forEach((link, i) => {
      console.log(`  ${i+1}: ${link}`);
    });
  } else {
    console.log('No boardgamehonor links found');
  }
  
  console.log('\n=== HTML SAMPLE (first 2000 chars) ===');
  console.log(html.slice(0, 2000));
}

debugBrowsePage().catch(e => { console.error(e); process.exit(1); });
