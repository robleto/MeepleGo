#!/usr/bin/env node
/**
 * Global game table hygiene script.
 *  - Detect games whose name appears to be an award title / placeholder and restore true BGG name.
 *  - Fill in missing metadata fields (year_published, min/max players, playtime, description, image URLs, categories, mechanics, publisher).
 *  - Works across ALL games (not only those with honors arrays) using BGG XML API.
 *
 * Usage:
 *   node scripts/fix_all_game_names_and_metadata.js            (dry run)
 *   node scripts/fix_all_game_names_and_metadata.js --apply    (apply updates)
 * Options:
 *   --limit <n>   Only process first n games (for testing)
 *   --ids 123,456 Restrict to a comma list of BGG IDs
 *
 * Environment: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');
require('dotenv').config({ path: '.env.local' });

const APPLY = process.argv.includes('--apply');
const limitArgIndex = process.argv.indexOf('--limit');
const LIMIT = limitArgIndex !== -1 ? parseInt(process.argv[limitArgIndex+1],10) : null;
const idsArgIndex = process.argv.indexOf('--ids');
const ONLY_IDS = idsArgIndex !== -1 ? new Set(process.argv[idsArgIndex+1].split(',').map(x=>parseInt(x.trim(),10)).filter(Boolean)) : null;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars.');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const AWARD_PREFIXES = [
  'golden geek',
  'charles s roberts',
  'spiel des jahres',
  'kennerspiel des jahres',
  'kinderspiel des jahres',
  'spiel des jahres kinderspiel',
  'kinderspielexperten',
  'spiel der spiele',
  'board game quest awards',
  'deutscher spiele preis',
  'deutscher lernspielpreis',
  'juguinho',
  'board game quest',
  'international gamers award',
  'golden elephant award',
  'zenobia award',
  'rpc fantasy award',
  'fairplay a la carte',
  'fairplay à la carte',
  'juego del año',
  'juego del ano',
  'gra roku',
  'hra roku',
  'vuoden peli',
  'jocul anului',
  'diana jones',
  'diana jones award',
  'japan boardgame prize',
  'games magazine',
  'lucca games',
  'mensa recommended',
  'cardboard republic',
  'uk games expo',
  'american tabletop',
  'tric trac',
  'tric trac enfant',
  'bulgarian board game awards',
  '5 seasons'
  ,'parents choice'
  ,'parent\'s choice'
  ,'parents\' choice'
  ,'all parents choice'
  ,'mind spieletipp'
];

function isLikelyAwardPlaceholder(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  // Strong award prefixes (even if truncated after category)
  if (AWARD_PREFIXES.some(p => lower.startsWith(p))) return true;
  // Ends with explicit role tokens
  if (/ (nominee|winner|finalist)$/.test(lower)) return true;
  // Truncated endings from prior import issues (cut mid word)
  if (/ (nomi|winn|winne|nom|finali)$/.test(lower)) return true;
  // Truncated 'honorable mention' variants (e.g., 'honorable men') or full phrase
  if (/(honorable men$|honorable mention$)/.test(lower)) return true;
  // Phrases like 'historians choice' combined with 'award'
  if (lower.includes('award') && lower.includes('historians choice')) return true;
  // German award fragments (Spiel der Spiele / Hit für ...) with recommendation tokens
  if (lower.startsWith('spiel der spiele') && / hit /.test(lower)) return true;
  if (lower.startsWith('spiel der spiele') && /(recommended|empfehl|hit fur|hit mit freunden)/.test(lower)) return true;
  if (lower.startsWith('kinderspiel des jaren')) return true; // common misspelling artifact
  if (lower.startsWith('kinderspielexperten')) return true;
  if (lower.startsWith('mind spieletipp')) return true;
  if (lower.startsWith('deutscher lernspielprei')) return true; // truncated variants
  if (lower.startsWith('international gamers award')) return true;
  if (lower.startsWith('golden elephant award')) return true;
  if (lower.startsWith('zenobia award')) return true;
  if (lower.startsWith('rpc fantasy award')) return true;
  if (lower.startsWith('fairplay a la carte')) return true;
  if (lower.startsWith('fairplay à la carte')) return true;
  if (lower.startsWith('juego del año')) return true;
  if (lower.startsWith('juego del ano')) return true;
  // Year-prefixed Juego del Año placeholders (e.g., "2015 Juego Del Ano Winner")
  if (/^\d{4} juego del a(?:ño|no)/.test(lower)) return true;
  // Contains Juego del Año + award role token (recommended also counts)
  if ((lower.includes('juego del año') || lower.includes('juego del ano')) && /(winner|nominee|finalist|recommended)/.test(lower)) return true;
  if (lower.startsWith('gra roku')) return true;
  if (lower.startsWith('hra roku')) return true;
  if (lower.startsWith('vuoden peli')) return true;
  if (lower.startsWith('jocul anului')) return true;
  if (/^\d{4} gra roku/.test(lower)) return true;
  if (/^\d{4} hra roku/.test(lower)) return true;
  if (/^\d{4} vuoden peli/.test(lower)) return true;
  if (/^\d{4} jocul anului/.test(lower)) return true;
  if ((/gra roku|hra roku|vuoden peli|jocul anului/.test(lower)) && /(winner|nominee|finalist|recommended)/.test(lower)) return true;
  if (lower.startsWith('diana jones')) return true;
  if (lower.startsWith('diana jones award')) return true;
  if (lower.startsWith('japan boardgame prize')) return true;
  if (lower.startsWith('games magazine')) return true;
  if (lower.startsWith('lucca games')) return true;
  if (lower.startsWith('mensa recommended')) return true;
  if (/^\d{4} (diana jones|japan boardgame prize|games magazine|lucca games|mensa recommended)/.test(lower)) return true;
  if ((/diana jones|japan boardgame prize|games magazine|lucca games|mensa recommended/.test(lower)) && /(winner|nominee|finalist|recommended|select|best)/.test(lower)) return true;
  if (lower.startsWith('cardboard republic')) return true;
  if (lower.startsWith('uk games expo')) return true;
  if (lower.startsWith('american tabletop')) return true;
  if (/^\d{4} (cardboard republic|uk games expo|american tabletop)/.test(lower)) return true;
  if ((/cardboard republic|uk games expo|american tabletop/.test(lower)) && /(award|awards|winner|nominee|finalist|recommended|best)/.test(lower)) return true;
  // Fragment like "Game of" following an award prefix
  if (AWARD_PREFIXES.some(p=>lower.startsWith(p)) && / game of$/.test(lower)) return true;
  // Contains 'best' plus 'game' and fairly long -> likely category string
  if (lower.includes('best ') && lower.includes(' game') && lower.length > 30) return true;
  // Contains multiple award tokens
  const awardTokens = ['best', 'award', 'awards', 'nominee', 'winner'];
  const tokenHits = awardTokens.filter(t=>lower.includes(t)).length;
  if (tokenHits >= 2 && lower.length > 30) return true;
  return false;
}

async function fetchAllGamesBasic() {
  const pageSize = 1000; let from = 0; const all = [];
  while (true) {
    const { data, error } = await supabase.from('games')
      .select('id,bgg_id,name,year_published,image_url,thumbnail_url,min_players,max_players,playtime_minutes,description,categories,mechanics,publisher')
      .range(from, from+pageSize-1);
    if (error) throw error;
    if (!data.length) break;
    all.push(...data);
    if (data.length < pageSize) break; from += pageSize;
  }
  return all;
}

async function fetchBGG(id) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`BGG request failed (${resp.status})`);
  const xml = await resp.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const parsed = parser.parse(xml);
  const item = parsed?.items?.item; if (!item) throw new Error('Item missing');
  let name = null;
  if (Array.isArray(item.name)) {
    const primary = item.name.find(n=>n['@_type']==='primary');
    name = primary ? primary['@_value'] : item.name[0]['@_value'];
  } else if (item.name) name = item.name['@_value'] || item.name;
  const pickNum = (node) => node ? Number(node['@_value'] || node) : null;
  const text = (node) => node ? (node['@_value'] || node) : null;
  const links = Array.isArray(item.link) ? item.link : (item.link ? [item.link] : []);
  const categories = links.filter(l=>l['@_type']==='boardgamecategory').map(l=>l['@_value']);
  const mechanics = links.filter(l=>l['@_type']==='boardgamemechanic').map(l=>l['@_value']);
  const publisher = links.find(l=>l['@_type']==='boardgamepublisher')?.['@_value'] || null;
  // Extract stats (average weight)
  let avgWeight = null;
  const ratings = item.statistics?.ratings;
  if (ratings && ratings.averageweight && ratings.averageweight['@_value']) {
    const w = parseFloat(ratings.averageweight['@_value']);
    if (!Number.isNaN(w)) avgWeight = w;
  }
  const designers = links.filter(l=>l['@_type']==='boardgamedesigner').map(l=>l['@_value']);
  return {
    name,
    year_published: pickNum(item.yearpublished),
    min_players: pickNum(item.minplayers),
    max_players: pickNum(item.maxplayers),
    playtime_minutes: pickNum(item.playingtime),
    image_url: text(item.image),
    thumbnail_url: text(item.thumbnail),
    categories: categories.length?categories:null,
    mechanics: mechanics.length?mechanics:null,
    publisher,
    description: text(item.description),
  designer: designers.length?designers:null,
    weight: avgWeight
  };
}

function missingMeta(g) {
  return !g.year_published || !g.min_players || !g.max_players || !g.playtime_minutes || !g.description || !g.image_url;
}

async function main() {
  console.log(`Global game hygiene (apply=${APPLY?'yes':'no'}) starting...`);
  const games = await fetchAllGamesBasic();
  console.log(`Loaded ${games.length} games.`);
  const targetGames = ONLY_IDS ? games.filter(g=>ONLY_IDS.has(g.bgg_id)) : games;
  const placeholders = [];
  const needMeta = [];
  for (const g of targetGames) {
    if (isLikelyAwardPlaceholder(g.name)) placeholders.push(g);
    if (missingMeta(g)) needMeta.push(g);
  }
  // Union set for BGG fetch worklist
  const workSetIds = Array.from(new Set([...placeholders, ...needMeta].map(g=>g.bgg_id)));
  if (LIMIT) {
    workSetIds.splice(LIMIT);
  }
  console.log(`Placeholders detected: ${placeholders.length}`);
  console.log(`Missing metadata: ${needMeta.length}`);
  console.log(`Total distinct BGG fetches needed: ${workSetIds.length}`);
  if (!APPLY) {
    console.log('Dry run. Sample placeholders:');
    placeholders.slice(0,10).forEach(p=>console.log(`  ${p.bgg_id}: ${p.name}`));
    console.log('Run with --apply to perform updates.');
    return;
  }
  // Tunable throttling / retries
  const CONCURRENCY = Number(process.env.BGG_CONCURRENCY || 2); // lowered to reduce 429s
  const BASE_DELAY_MS = Number(process.env.BGG_DELAY_MS || 2000); // delay between processed items per worker iteration
  const MAX_RETRIES = 3; // retries for 429 or transient network errors
  const queue = [...workSetIds];
  let processed=0, renamed=0, patched=0, errors=0;
  const failedIds = [];
  async function worker() {
    while(queue.length) {
      const id = queue.shift();
      let fetched;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          fetched = await fetchBGG(id);
          break;
        } catch(e) {
          const isRate = /429|rate/i.test(e.message);
            if (attempt < MAX_RETRIES && isRate) {
              const backoff = BASE_DELAY_MS * Math.pow(2, attempt);
              console.warn(`Rate limit for ${id}, retry ${attempt+1}/${MAX_RETRIES} in ${backoff}ms`);
              await new Promise(r=>setTimeout(r, backoff));
              continue;
            }
          if (attempt < MAX_RETRIES) {
            const backoff = 1000 * (attempt + 1);
            console.warn(`Transient error ${id}: ${e.message}. Retry in ${backoff}ms`);
            await new Promise(r=>setTimeout(r, backoff));
            continue;
          }
          console.error('Fetch error', id, e.message);
          errors++;
          failedIds.push(id);
        }
      }
      if (!fetched) { await new Promise(r=>setTimeout(r, BASE_DELAY_MS)); continue; }
      const existing = targetGames.find(g=>g.bgg_id===id);
      if (!existing) continue;
      const patch = {};
      // Name repair
      if (isLikelyAwardPlaceholder(existing.name) && fetched.name && fetched.name !== existing.name) {
        patch.name = fetched.name;
      }
      // Metadata patch if missing
  for (const k of ['year_published','min_players','max_players','playtime_minutes','description','image_url','thumbnail_url','categories','mechanics','publisher','designer','weight']) {
        if (!existing[k] && fetched[k]) patch[k] = fetched[k];
      }
      // Derive summary if absent and description present in patch (or existing)
      if (!existing.summary) {
        const desc = (patch.description || existing.description || '')
          .replace(/&amp;#10;|&#10;/g,' ') // line breaks
          .replace(/&[a-z]+;/gi,' ') // basic entity strip fallback
          .replace(/\s+/g,' ') // collapse
          .trim();
        if (desc) {
          const sentenceEnd = desc.indexOf('. ');
          let summary = sentenceEnd > -1 ? desc.slice(0, sentenceEnd+1) : desc.slice(0, 240);
          if (summary.length > 260) summary = summary.slice(0, 260) + '…';
          patch.summary = summary;
        }
      }
      if (Object.keys(patch).length) {
        const { error } = await supabase.from('games').update(patch).eq('bgg_id', id);
        if (error) {
          console.error('Update fail', id, error.message); errors++; 
        } else {
          if (patch.name) renamed++;
          if (Object.keys(patch).length > (patch.name?1:0)) patched++;
        }
      }
      processed++;
      if (processed % 50 ===0) console.log(`[progress] processed ${processed}/${workSetIds.length}`);
    await new Promise(r=>setTimeout(r, BASE_DELAY_MS)); // throttle (post-processing)
    }
  }
  await Promise.all(Array.from({length: CONCURRENCY}, ()=>worker()));
  console.log('=== RESULT ===');
  console.log(`Processed: ${processed}`);
  console.log(`Renamed: ${renamed}`);
  console.log(`Patched metadata (any non-name fields): ${patched}`);
  console.log(`Errors: ${errors}`);
  if (failedIds.length) console.log('Failed IDs:', failedIds.join(','));
}

main().catch(e=>{console.error(e);process.exit(1);});
