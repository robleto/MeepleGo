#!/usr/bin/env node
/**
 * Full honors synchronization.
 *
 * Goal: Persist ALL raw honors from enhanced-honors-complete.json into games.honors JSONB
 * so the UI has complete detail (no lossy collapsing / dedupe of categories).
 *
 * For every honor entry with boardgames, we create one honor object per game with rich fields.
 *
 * Honor object schema (added to each game's honors array):
 * {
 *   honor_id: string (BGG honor id),
 *   year: number | null,
 *   award_type: derived from awardSet (strip leading year),
 *   award_set: original awardSet,
 *   position: original position (category text),
 *   title: original title,
 *   slug: honor slug,
 *   url: absolute BGG URL,
 *   game_name: game name at time of sync,
 *   category: One of Winner|Nominee|Special (DB constraint) derived heuristically so existing UI still works,
 *   result_raw: classification from slug/title/position (Winner/Nominee/Recommended/etc.),
 *   source: 'scrape-full',
 *   created_at: ISO timestamp
 * }
 *
 * Usage:
 *   node scripts/awards/full-sync-honors-into-games.js --dry-run
 *   node scripts/awards/full-sync-honors-into-games.js --apply            (merge by honor_id)
 *   node scripts/awards/full-sync-honors-into-games.js --apply --replace  (replace honors array entirely)
 *   node scripts/awards/full-sync-honors-into-games.js --apply --auto-create-missing
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const args = process.argv.slice(2).reduce((a, arg) => { if(arg.startsWith('--')) { const [k,v] = arg.replace(/^--/,'').split('='); a[k] = v === undefined ? true : v; } return a; }, {});
const dryRun = !!args['dry-run'] && !args['apply'];
const apply = !!args['apply'];
const hardReplace = !!args['replace'];
const autoCreateMissing = !!args['auto-create-missing'];
const limit = args.limit ? parseInt(args.limit) : 0;
const startOffset = args['start-offset'] ? parseInt(args['start-offset']) : 0; // number of games (distinct bgg ids) to skip
const resume = !!args['resume'];
const checkpointPath = path.join(process.cwd(), 'tmp', 'full-sync-honors.checkpoint.json');
const quiet = !!args['quiet'];
const log = (...m)=>{ if(!quiet) console.log(...m); };
// Ensure tmp dir exists for checkpointing
try { fs.mkdirSync(path.join(process.cwd(), 'tmp'), { recursive: true }); } catch(_) {}

let resumeOffset = startOffset;
if(resume){
  if(fs.existsSync(checkpointPath)){
    try {
      const cp = JSON.parse(fs.readFileSync(checkpointPath,'utf8'));
      if(typeof cp.lastIndex === 'number'){
        resumeOffset = cp.lastIndex + 1; // continue after last completed index
        console.log(`Resume enabled. Starting from checkpoint index ${resumeOffset}`);
      }
    } catch(e){ console.warn('Failed reading checkpoint, falling back to provided start-offset.', e.message); }
  } else {
    console.log('Resume flag set but no checkpoint file found; using provided start-offset.');
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!supabaseUrl || !supabaseKey){
  console.error('Missing Supabase credentials.');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession:false }});

const DATA_FILE = path.join(process.cwd(), 'enhanced-honors-complete.json');
if(!fs.existsSync(DATA_FILE)) { console.error('Data file not found:', DATA_FILE); process.exit(1); }
let raw;
try { raw = fs.readFileSync(DATA_FILE,'utf8'); } catch(e){ console.error('Read error:', e.message); process.exit(1); }
let honors;
try { honors = JSON.parse(raw); } catch(e){ console.error('Parse error:', e.message); process.exit(1); }
if(!Array.isArray(honors)){ console.error('Top-level JSON is not an array.'); process.exit(1); }

function deriveAwardType(awardSet){ if(!awardSet) return null; return awardSet.replace(/^\d{4}\s+/, '').trim(); }
function classify(entry){
  const base = (entry.slug || entry.title || '').toLowerCase();
  const position = (entry.position || '').toLowerCase();
  function pick(str){
    if(!str) return null;
    if(str.includes('winner')) return 'Winner';
    if(str.includes('nominee')) return 'Nominee';
    if(str.includes('recommended')) return 'Recommended';
    if(str.includes('finalist')) return 'Finalist';
    if(str.includes('runner')) return 'Runner-up';
    return null;
  }
  return pick(base) || pick(position);
}
function mapToDbCategory(result){
  if(result === 'Winner') return 'Winner';
  if(result === 'Nominee') return 'Nominee';
  return 'Special';
}

const nowIso = new Date().toISOString();
const perGame = new Map();
let emitted = 0; let skippedNoGames = 0; let skippedNoArray = 0; let skippedNoYear = 0;

function inferYear(entry){
  if(typeof entry.year === 'number' && Number.isFinite(entry.year)) return entry.year;
  if(entry.awardSet){
    const m = entry.awardSet.match(/^(\d{4})\b/);
    if(m) return parseInt(m[1]);
  }
  if(entry.slug){
    const m2 = entry.slug.match(/^(\d{4})-/);
    if(m2) return parseInt(m2[1]);
  }
  return null;
}
for(const entry of honors){
  if(!entry || !Array.isArray(entry.boardgames)) { skippedNoArray++; continue; }
  if(entry.boardgames.length === 0){ skippedNoGames++; continue; }
  const awardType = deriveAwardType(entry.awardSet);
  const year = inferYear(entry);
  if(year === null){ skippedNoYear++; continue; }
  const resultRaw = classify(entry);
  const category = mapToDbCategory(resultRaw);
  const url = entry.url && entry.url.startsWith('http') ? entry.url : (entry.url ? 'https://boardgamegeek.com' + entry.url : null);
  for(const g of entry.boardgames){
    if(!g || !g.bggId) continue;
    const nameParts = [year, awardType || 'Award'];
    if(entry.position){ nameParts.push(entry.position); }
    else if(resultRaw){ nameParts.push(resultRaw); }
    const honorName = nameParts.filter(Boolean).join(' ');
    const honorObj = {
      honor_id: entry.id,
      name: honorName,
      year,
      award_type: awardType,
      award_set: entry.awardSet || null,
      position: entry.position || null,
      title: entry.title || null,
      slug: entry.slug || null,
      url,
      game_name: g.name || null,
      category,
      result_raw: resultRaw,
      source: 'scrape-full',
      created_at: nowIso
    };
    if(!perGame.has(g.bggId)) perGame.set(g.bggId, []);
    perGame.get(g.bggId).push(honorObj);
    emitted++;
  }
  if(limit && emitted >= limit) break;
}

log('Full sync build summary:');
log('  Distinct games:', perGame.size);
log('  Honor-game records prepared:', emitted);
log('  Skipped entries with no boardgames array:', skippedNoArray);
log('  Skipped entries with empty boardgames:', skippedNoGames);
log('  Skipped entries missing year (after inference attempts):', skippedNoYear);
if(dryRun){
  const sample = Array.from(perGame.entries()).slice(0,3).map(([id,list])=>({ bgg:id, count:list.length, first:list[0] }));
  log('Sample:', JSON.stringify(sample,null,2));
  log('Dry run only. Use --apply to write.');
  process.exit(0);
}

if(!apply){
  log('Nothing applied (no --apply flag).');
  process.exit(0);
}

(async ()=>{
  log(hardReplace ? 'REPLACE mode: overwriting honors arrays.' : 'MERGE mode: merging by honor_id.');
  let updated=0, created=0, missing=0, errors=0; let processed=0;
  const entries = Array.from(perGame.entries());
  if(resumeOffset > 0){
    log(`Applying start offset: skipping first ${resumeOffset} games (of ${entries.length})`);
  }
  const slicedEntries = resumeOffset > 0 ? entries.slice(resumeOffset) : entries;
  const batchSize = 300;
  for(let offset=0; offset<slicedEntries.length; offset+=batchSize){
    const slice = slicedEntries.slice(offset, offset+batchSize);
    for(const [bggId, honorsListOriginal] of slice){
      // Validate each honor for DB constraint compliance
      const honorsList = honorsListOriginal.filter(h => h && typeof h.name==='string' && typeof h.year==='number' && ['Winner','Nominee','Special'].includes(h.category));
      if(honorsList.length === 0){ processed++; continue; }
      const { data: rows, error: fetchErr } = await supabase.from('games').select('id, honors, name').eq('bgg_id', bggId).limit(1);
      if(fetchErr){ console.error('Fetch error', bggId, fetchErr.message); errors++; continue; }
      if(!rows || rows.length===0){
        if(autoCreateMissing){
          const insertPayload = { bgg_id: bggId, name: honorsList[0]?.game_name || `BGG ${bggId}`, honors: honorsList, created_at: nowIso, updated_at: nowIso };
          const { error: insErr } = await supabase.from('games').insert([insertPayload]);
          if(insErr){ console.error('Insert error', bggId, insErr.message); errors++; continue; }
          created++; updated++; processed++;
        } else { missing++; processed++; continue; }
      } else {
        const game = rows[0];
        let finalHonors;
        if(hardReplace){
          finalHonors = honorsList;
        } else {
          const existing = Array.isArray(game.honors) ? game.honors.filter(h => h && h.name && typeof h.year==='number' && ['Winner','Nominee','Special'].includes(h.category)) : [];
          const map = new Map();
          for(const h of existing){ if(h && h.honor_id) map.set(h.honor_id, h); }
          for(const h of honorsList){ map.set(h.honor_id, h); }
          finalHonors = Array.from(map.values());
        }
        const { error: updErr } = await supabase.from('games').update({ honors: finalHonors }).eq('id', game.id);
        if(updErr){ console.error('Update error', bggId, updErr.message); errors++; continue; }
        updated++; processed++;
  if(!quiet && updated % 200 === 0) console.log(`Progress: ${updated} games updated...`);
      }
    }
  const absoluteIndex = resumeOffset + Math.min(entries.length, resumeOffset + offset + slice.length) - 1;
  // Write checkpoint
  try { fs.writeFileSync(checkpointPath, JSON.stringify({ lastIndex: resumeOffset + offset + slice.length - 1, processed, updated, timestamp: new Date().toISOString() }, null, 2)); } catch(e){ /* ignore */ }
  if(!quiet) console.log(`Batch ${(offset/batchSize)+1} complete (processed so far: ${processed}) (last absolute index: ${absoluteIndex})`);
  }
  console.log('\n==== FULL SYNC SUMMARY ====');
  console.log('Games processed:', processed);
  console.log('Games updated:', updated);
  console.log('Games created:', created);
  console.log('Missing (not in DB, not created):', missing);
  console.log('Errors:', errors);
  console.log('Mode:', hardReplace ? 'REPLACE' : 'MERGE');
  console.log('============================');
})();
