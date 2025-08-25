#!/usr/bin/env node
// Fetch and dump raw HTML snippet of a boardgamehonor page for inspection.
const { buildAuthHeaders } = require('./fetchers');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const id = process.argv[2];
  const slug = process.argv[3];
  if (!id || !slug) {
    console.error('Usage: node scripts/awards/debug-dump-honor.js <id> <slug>');
    process.exit(1);
  }
  const url = `https://boardgamegeek.com/boardgamehonor/${id}/${slug}`;
  console.log('Fetching', url);
  const res = await fetch(url, { headers: buildAuthHeaders() });
  console.log('Status', res.status);
  const html = await res.text();
  console.log('\n--- FIRST 1200 CHARS ---');
  console.log(html.slice(0,1200).replace(/\n/g,'\n'));
  const hasBoardgameLinks = /\/boardgame\/(\d+)\//.test(html);
  console.log('\nContains /boardgame/<id>/ links:', hasBoardgameLinks);
  const linkMatches = html.match(/href="\/boardgame\/\d+\/[^"]+"/g) || [];
  console.log('Sample boardgame href matches (up to 10):');
  linkMatches.slice(0,10).forEach(m=>console.log('  ', m));
}

main().catch(e=>{ console.error(e); process.exit(1); });
