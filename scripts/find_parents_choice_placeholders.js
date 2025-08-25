#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fetchCandidates() {
  const variants = ['Parents Choice', "Parent's Choice", "Parents' Choice", 'All Parents Choice'];
  let all = [];
  for (const v of variants) {
    const { data, error } = await supabase
      .from('games')
      .select('id,bgg_id,name,description,image_url,year_published,min_players,max_players,playtime_minutes')
      .ilike('name', v + '%');
    if (error) throw error;
    all.push(...(data||[]));
  }
  // dedupe by bgg_id
  const map = new Map();
  for (const g of all) map.set(g.bgg_id, g);
  return Array.from(map.values());
}

async function fetchPrimary(id) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${id}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(resp.status);
  const xml = await resp.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const parsed = parser.parse(xml);
  const item = parsed?.items?.item;
  if (!item) return null;
  if (Array.isArray(item.name)) {
    const primary = item.name.find(n=>n['@_type']==='primary');
    return primary ? primary['@_value'] : item.name[0]['@_value'];
  }
  return item.name ? (item.name['@_value'] || item.name) : null;
}

function looksPlaceholder(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  const tokens = ['award','awards','honor','winner','nominee','silver','gold','recommended'];
  const hits = tokens.filter(t=>lower.includes(t)).length;
  return hits >= 1; // loose; prefixes catch main detection
}

async function main() {
  console.log('Scanning Parents Choice style placeholders...');
  const games = await fetchCandidates();
  if (!games.length) { console.log('None found.'); return; }
  const report = [];
  for (const g of games) {
    try {
      const primary = await fetchPrimary(g.bgg_id);
      const mismatch = primary && primary !== g.name;
      const placeholder = looksPlaceholder(g.name);
      let action = 'ok';
      if (placeholder && mismatch) action = 'rename+enrich';
      else if (placeholder && !mismatch) action = 'verify';
      else if (!placeholder && mismatch) action = 'consider-rename';
      report.push({ bgg_id: g.bgg_id, stored: g.name, primary, mismatch, placeholder, action });
    } catch(e) {
      report.push({ bgg_id: g.bgg_id, stored: g.name, primary: null, mismatch: false, placeholder: true, action: 'bgg-error' });
    }
  }
  console.log(JSON.stringify(report, null, 2));
  const ids = report.filter(r=>r.action==='rename+enrich').map(r=>r.bgg_id);
  if (ids.length) {
    console.log('\nSuggested hygiene command:');
    console.log(`node scripts/fix_all_game_names_and_metadata.js --ids ${ids.join(',')} --apply`);
  }
}

main().catch(e=>{console.error(e);process.exit(1);});
