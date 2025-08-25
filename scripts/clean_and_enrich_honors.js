#!/usr/bin/env node
/**
 * Comprehensive honors data maintenance script.
 *
 * Features:
 *  1. Residue scan: Detect placeholder/corrupted game rows created from honor titles.
 *  2. Residue cleanup: Restore canonical names if possible else delete placeholders.
 *  3. Metadata enrichment: For any game with honors but missing core metadata (year, players, playtime, description, image)
 *     fetch data from BGG and patch.
 *  4. Missing game insertion: For honors referencing a bggId not present in games table, fetch and insert full metadata.
 *
 * Usage:
 *   node scripts/clean_and_enrich_honors.js                (scan only)
 *   node scripts/clean_and_enrich_honors.js --apply-residue
 *   node scripts/clean_and_enrich_honors.js --apply-enrich
 *   node scripts/clean_and_enrich_honors.js --apply-residue --apply-enrich (do both)
 *
 * Environment: requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');
require('dotenv').config({ path: '.env.local' });

const APPLY_RESIDUE = process.argv.includes('--apply-residue');
const APPLY_ENRICH = process.argv.includes('--apply-enrich');
const HONORS_FILE = ['enhanced-honors-complete.fixed.json','enhanced-honors-complete.json'].find(f=>fs.existsSync(f));
if (!HONORS_FILE) {
  console.error('Honors file not found.');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function loadHonors() {
  return JSON.parse(fs.readFileSync(HONORS_FILE,'utf8'));
}

function buildCanonicalMap(honors) {
  const map = new Map(); // bggId -> Set names
  for (const honor of honors) {
    if (!Array.isArray(honor.boardgames)) continue;
    for (const g of honor.boardgames) {
      if (!g?.bggId || !g?.name) continue;
      if (!map.has(g.bggId)) map.set(g.bggId, new Set());
      map.get(g.bggId).add(g.name.trim());
    }
  }
  const canonical = new Map();
  for (const [id, names] of map.entries()) {
    const all = Array.from(names);
    const nonAward = all.filter(n => !/^golden geek/i.test(n) && !/ nominee$/i.test(n) && !/ winner$/i.test(n));
    let chosen = nonAward.length ? nonAward.sort((a,b)=>b.length-a.length)[0] : all.sort((a,b)=>b.length-a.length)[0];
    canonical.set(id, chosen);
  }
  return canonical;
}

const PLACEHOLDER_KEYWORDS = [
  'golden geek', 'best board game', 'best solo', 'best print', 'best artwork',
  'heavy game', 'light game', 'medium game', 'game of the year', 'wargame',
  'best zoomable', 'best party', 'best family', 'best expansion'
];

function isPlaceholderName(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  if (lower.length < 25) return false; // most real game names shorter
  if (/winner$|winn$|winne$|nominee$|nomi$|nom$/.test(lower)) return true; // include truncated tokens
  const hits = PLACEHOLDER_KEYWORDS.filter(k=>lower.includes(k)).length;
  return hits >= 2;
}

async function fetchAllGamesBasic() {
  const pageSize = 1000;
  let from = 0; let all = [];
  while (true) {
    const { data, error } = await supabase
      .from('games')
      .select('bgg_id,name,year_published,image_url,thumbnail_url,min_players,max_players,playtime_minutes,description,honors')
      .range(from, from+pageSize-1);
    if (error) throw error;
    if (!data.length) break; all.push(...data);
    if (data.length < pageSize) break; from += pageSize;
  }
  return all;
}

async function residuePhase(games, canonical) {
  const residue = [];
  for (const g of games) {
    const placeholder = isPlaceholderName(g.name) && !g.year_published && !g.image_url && !g.thumbnail_url;
    if (placeholder) {
      const canonicalName = canonical.get(g.bgg_id);
      residue.push({ ...g, canonicalName });
    }
  }
  const restorable = residue.filter(r => r.canonicalName && r.canonicalName !== r.name && !isPlaceholderName(r.canonicalName));
  const deletable = residue.filter(r => !restorable.includes(r));
  console.log(`Residue scan: ${residue.length} placeholders found. Restorable=${restorable.length} Deletable=${deletable.length}`);
  if (APPLY_RESIDUE) {
    for (const r of restorable) {
      const { error } = await supabase.from('games').update({ name: r.canonicalName }).eq('bgg_id', r.bgg_id);
      if (error) console.error('Restore failed', r.bgg_id, error.message); else console.log('Restored', r.bgg_id, '→', r.canonicalName);
    }
    for (const r of deletable) {
      const { error } = await supabase.from('games').delete().eq('bgg_id', r.bgg_id);
      if (error) console.error('Delete failed', r.bgg_id, error.message); else console.log('Deleted placeholder', r.bgg_id);
    }
  }
  return { residue, restorable, deletable };
}

function needsMetadata(g) {
  return Array.isArray(g.honors) && g.honors.length > 0 && (
    !g.year_published || !g.min_players || !g.max_players || !g.playtime_minutes || !g.description || !g.image_url
  );
}

async function fetchBGG(id) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('BGG request failed');
  const xml = await resp.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const parsed = parser.parse(xml);
  const item = parsed?.items?.item; if (!item) throw new Error('Item missing');
  const pick = (node) => node ? Number(node['@_value'] || node) : null;
  const text = (node) => node ? (node['@_value'] || node) : null;
  let name = null;
  if (Array.isArray(item.name)) {
    const primary = item.name.find(n=>n['@_type']==='primary');
    name = primary ? primary['@_value'] : item.name[0]['@_value'];
  } else if (item.name) name = item.name['@_value'] || item.name;
  const links = Array.isArray(item.link) ? item.link : (item.link ? [item.link] : []);
  const categories = links.filter(l=>l['@_type']==='boardgamecategory').map(l=>l['@_value']);
  const mechanics = links.filter(l=>l['@_type']==='boardgamemechanic').map(l=>l['@_value']);
  const publisher = links.find(l=>l['@_type']==='boardgamepublisher')?.['@_value'] || null;
  return {
    name,
    year_published: pick(item.yearpublished),
    min_players: pick(item.minplayers),
    max_players: pick(item.maxplayers),
    playtime_minutes: pick(item.playingtime),
    image_url: text(item.image),
    thumbnail_url: text(item.thumbnail),
    categories: categories.length?categories:null,
    mechanics: mechanics.length?mechanics:null,
    publisher,
    description: text(item.description)
  };
}

async function enrichmentPhase(games, honors) {
  const gameIndex = new Set(games.map(g=>g.bgg_id));
  // Determine missing games referenced by honors
  const missingIds = new Set();
  for (const honor of honors) {
    for (const g of honor.boardgames || []) {
      const id = Number(g.bggId);
      if (!gameIndex.has(id)) missingIds.add(id);
    }
  }

  const needMeta = games.filter(needsMetadata).map(g=>g.bgg_id);
  console.log(`Metadata: ${needMeta.length} games missing fields. Missing games not in DB: ${missingIds.size}`);

  if (!APPLY_ENRICH) return { needMeta, missing: Array.from(missingIds) };

  // Process with limited concurrency
  async function processList(ids, mode) {
    const results = [];
    const queue = [...ids];
    const CONCURRENCY = 3;
    let processedCount = 0;
    async function worker() {
      while (queue.length) {
        const id = queue.shift();
        try {
          const data = await fetchBGG(id);
          if (mode === 'insert') {
            const { error } = await supabase.from('games').insert({ bgg_id: id, ...data });
            if (error) console.error('Insert fail', id, error.message); else {
              processedCount++;
              if (processedCount % 25 === 0) console.log(`[insert] ${processedCount} (last ${id} ${data.name})`);
            }
          } else {
            const patch = {};
            const { data: existing } = await supabase.from('games').select('*').eq('bgg_id', id).maybeSingle();
            if (!existing) continue;
            for (const k of ['year_published','min_players','max_players','playtime_minutes','description','image_url','thumbnail_url','categories','mechanics','publisher']) {
              if (!existing[k] && data[k]) patch[k] = data[k];
            }
            if (Object.keys(patch).length) {
              const { error } = await supabase.from('games').update(patch).eq('bgg_id', id);
              if (error) console.error('Patch fail', id, error.message); else {
                processedCount++;
                if (processedCount % 50 === 0) console.log(`[update] ${processedCount} (last ${id} fields: ${Object.keys(patch).join(',')})`);
              }
            }
          }
        } catch (e) {
          console.error('BGG fetch error', id, e.message);
        }
        // gentle delay to avoid hammering BGG
        await new Promise(r=>setTimeout(r, 800));
      }
    }
    await Promise.all(Array.from({length: CONCURRENCY},()=>worker()));
    return results;
  }

  await processList(needMeta, 'update');
  await processList(Array.from(missingIds), 'insert');

  return { needMeta, missing: Array.from(missingIds) };
}

(async function main(){
  console.log(`Honors maintenance starting (residue=${APPLY_RESIDUE?'APPLY':'scan'} enrich=${APPLY_ENRICH?'APPLY':'scan'}) using ${HONORS_FILE}`);
  const honors = loadHonors();
  const canonical = buildCanonicalMap(honors);
  const games = await fetchAllGamesBasic();

  console.log(`Loaded games: ${games.length}, honors: ${honors.length}`);

  const residueReport = await residuePhase(games, canonical);
  const enrichReport = await enrichmentPhase(games, honors);

  console.log('\n=== SUMMARY ===');
  console.log(`Residue found: ${residueReport.residue.length}`);
  console.log(`Restorable: ${residueReport.restorable.length} Deleted (if applied): ${residueReport.deletable.length}`);
  console.log(`Metadata missing (pre-update): ${enrichReport.needMeta.length}`);
  console.log(`Missing games inserted (if applied): ${enrichReport.missing.length}`);
  if (!APPLY_RESIDUE && residueReport.residue.length) console.log('Run with --apply-residue to fix placeholders.');
  if (!APPLY_ENRICH && (enrichReport.needMeta.length || enrichReport.missing.length)) console.log('Run with --apply-enrich to patch metadata / add missing games.');
})();
