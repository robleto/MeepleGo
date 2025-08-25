#!/usr/bin/env node
/**
 * Find games whose name begins with the suspected award placeholder prefix '5 Seasons'
 * and compare with BGG primary name to determine if they need repair.
 *
 * Outputs a report listing:
 *  - stored name
 *  - BGG primary name
 *  - mismatch flag
 *  - suggested action (rename / enrich / ok)
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchCandidates() {
  const { data, error } = await supabase
    .from('games')
    .select('id,bgg_id,name,year_published,min_players,max_players,playtime_minutes,description,image_url,thumbnail_url')
    .ilike('name', '5 Seasons%');
  if (error) throw error;
  return data || [];
}

async function fetchBGGPrimary(bggId) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`BGG ${bggId} HTTP ${resp.status}`);
  const xml = await resp.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const parsed = parser.parse(xml);
  const item = parsed?.items?.item;
  if (!item) throw new Error('Item missing');
  let name = null;
  if (Array.isArray(item.name)) {
    const primary = item.name.find(n => n['@_type'] === 'primary');
    name = primary ? primary['@_value'] : item.name[0]['@_value'];
  } else if (item.name) {
    name = item.name['@_value'] || item.name;
  }
  return { primary: name || null };
}

function looksPlaceholder(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  // Likely truncated nominee/winner style endings
  if (/ nomi?n?e?$/i.test(name) || / winner$/i.test(name)) return true;
  // Contains multiple award-y tokens
  const tokens = ['best', 'award', 'awards', 'nominee', 'winner', 'international'];
  const hits = tokens.filter(t => lower.includes(t)).length;
  if (hits >= 2) return true;
  return false;
}

async function main() {
  console.log('Scanning for 5 Seasons placeholder candidates...');
  const candidates = await fetchCandidates();
  if (!candidates.length) {
    console.log('No games found starting with "5 Seasons".');
    return;
  }
  console.log(`Found ${candidates.length} candidate(s). Fetching BGG primary names...`);
  const report = [];
  for (const g of candidates) {
    try {
      const bgg = await fetchBGGPrimary(g.bgg_id);
      const primary = bgg.primary;
      const mismatch = primary && primary !== g.name;
      const placeholder = looksPlaceholder(g.name);
      let action = 'ok';
      if (placeholder && mismatch) action = 'rename+enrich';
      else if (placeholder && !mismatch) action = 'verify-manually';
      else if (!placeholder && mismatch) action = 'consider-rename';
      report.push({
        id: g.id,
        bgg_id: g.bgg_id,
        stored_name: g.name,
        bgg_primary: primary,
        mismatch,
        placeholder,
        action
      });
    } catch (e) {
      console.error('BGG fetch error', g.bgg_id, e.message);
      report.push({
        id: g.id,
        bgg_id: g.bgg_id,
        stored_name: g.name,
        bgg_primary: null,
        mismatch: false,
        placeholder: looksPlaceholder(g.name),
        action: 'bgg-error'
      });
    }
  }
  console.log(JSON.stringify(report, null, 2));
  const toFix = report.filter(r => r.action === 'rename+enrich');
  if (toFix.length) {
    console.log('\nSuggested BGG IDs to pass to hygiene script:');
    console.log(toFix.map(r => r.bgg_id).join(','));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
