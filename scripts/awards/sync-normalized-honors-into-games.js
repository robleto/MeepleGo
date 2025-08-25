#!/usr/bin/env node
/**
 * Sync honors from normalized dataset (enhanced-honors-complete.normalized.json)
 * into Supabase games.honors JSONB with subcategory + primary_winner preserved.
 *
 * Builds per-game honor objects, merging or replacing as requested.
 * Honor object schema produced (per game):
 *   honor_id, name, year, award_type, award_set, position, title, slug, url,
 *   game_name, category, subcategory, primary_winner, result_raw, source, created_at
 *
 * Usage:
 *   node scripts/awards/sync-normalized-honors-into-games.js --dry-run
 *   node scripts/awards/sync-normalized-honors-into-games.js --apply [--replace]
 *   [--input enhanced-honors-complete.normalized.json] [--limit N]
 */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// ---- CLI ----
const argv = process.argv.slice(2).reduce((m,a)=>{ if(a.startsWith('--')){ const [k,v]=a.replace(/^--/,'').split('='); m[k]= v===undefined? true : v;} return m; },{});
const APPLY = !!argv.apply;
const REPLACE = !!argv.replace;
const INPUT = argv.input || 'enhanced-honors-complete.normalized.json';
const LIMIT = argv.limit ? parseInt(argv.limit,10) : null;
const QUIET = !!argv.quiet;
const DRY = !APPLY;
const log = (...x)=>{ if(!QUIET) console.log(...x); };

// ---- Supabase ----
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!supabaseUrl || !supabaseKey){ console.error('Missing Supabase credentials'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession:false }});

// ---- Load dataset ----
const inputPath = path.join(process.cwd(), INPUT);
if(!fs.existsSync(inputPath)){ console.error('Input file not found:', inputPath); process.exit(1);} 
let raw;
try { raw = JSON.parse(fs.readFileSync(inputPath,'utf8')); } catch(e){ console.error('Parse error:', e.message); process.exit(1);} 
if(!Array.isArray(raw)){ console.error('Input not an array'); process.exit(1);} 

log('[sync-normalized] Start', { APPLY, REPLACE, INPUT, LIMIT });

// ---- Build per-game map ----
const perGame = new Map();
const nowIso = new Date().toISOString();
let processedHonors = 0; let emitted = 0;
for(const h of raw){
  if(LIMIT && processedHonors >= LIMIT) break;
  processedHonors++;
  if(!Array.isArray(h.game_refs) || h.game_refs.length === 0) continue;
  for(const g of h.game_refs){
    if(!g || !g.bgg_id) continue;
    const nameParts = [h.year, h.award_type];
    if(h.subcategory && h.subcategory !== 'Overall') nameParts.push(h.subcategory);
    if(h.category) nameParts.push(h.category);
    const honorName = nameParts.filter(Boolean).join(' ');
    const slug = h.raw && h.raw.slug ? h.raw.slug : null;
    const rawUrl = h.raw && h.raw.url ? h.raw.url : null;
    const url = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : 'https://boardgamegeek.com' + rawUrl) : null;
    const honorObj = {
      honor_id: h.honor_id,
      name: honorName,
      year: h.year,
      award_type: h.award_type,
      award_set: h.award_set,
      position: h.position,
      title: h.title,
      slug,
      url,
      game_name: g.name,
      category: h.category,
      subcategory: h.subcategory,
      primary_winner: h.primary_winner === true ? true : undefined,
      result_raw: h.result_raw || h.derived_result,
      source: 'normalized-v2',
      created_at: nowIso
    };
    if(!perGame.has(g.bgg_id)) perGame.set(g.bgg_id, []);
    perGame.get(g.bgg_id).push(honorObj);
    emitted++;
  }
}

log('[sync-normalized] Build summary:', { distinct_games: perGame.size, honors_prepared: emitted });
if(DRY){
  const sample = Array.from(perGame.entries()).slice(0,3).map(([id,list])=>({ bgg:id, count:list.length, first:list[0] }));
  log('[sync-normalized] Sample', JSON.stringify(sample,null,2));
  log('[sync-normalized] Dry run only. Use --apply to write.');
  process.exit(0);
}

// ---- Apply to DB ----
(async ()=>{
  let updated=0, created=0, missing=0, errors=0, processed=0; const batchSize=300;
  const entries = Array.from(perGame.entries());
  for(let offset=0; offset<entries.length; offset+=batchSize){
    const slice = entries.slice(offset, offset+batchSize);
    for(const [bggId, honorsListNew] of slice){
      // Validate honors list for DB constraint (category inside allowed set)
      const filtered = honorsListNew.filter(o=>['Winner','Nominee','Special'].includes(o.category));
      if(filtered.length===0){ processed++; continue; }
      const { data: rows, error: fetchErr } = await supabase.from('games').select('id,honors,name').eq('bgg_id', bggId).limit(1);
      if(fetchErr){ console.error('Fetch error', bggId, fetchErr.message); errors++; continue; }
      if(!rows || rows.length===0){ missing++; processed++; continue; }
      const game = rows[0];
      let finalHonors;
      if(REPLACE){
        finalHonors = filtered;
      } else {
        const existing = Array.isArray(game.honors) ? game.honors.filter(h=>h && h.honor_id && ['Winner','Nominee','Special'].includes(h.category)) : [];
        const map = new Map(existing.map(h=>[h.honor_id, h]));
        for(const h of filtered){ map.set(h.honor_id, h); }
        finalHonors = Array.from(map.values());
      }
      const { error: updErr } = await supabase.from('games').update({ honors: finalHonors }).eq('id', game.id);
      if(updErr){ console.error('Update error', bggId, updErr.message); errors++; continue; }
      updated++; processed++;
      if(!QUIET && updated % 250 === 0) console.log(`[sync-normalized] Updated ${updated} games so far...`);
    }
    if(!QUIET) console.log(`[sync-normalized] Batch ${(offset/batchSize)+1} complete (processed ${processed})`);
  }
  console.log('\n=== SYNC NORMALIZED SUMMARY ===');
  console.log('Games processed:', processed);
  console.log('Games updated:', updated);
  console.log('Games created (not supported in this script):', created);
  console.log('Missing games:', missing);
  console.log('Errors:', errors);
  console.log('Mode:', REPLACE ? 'REPLACE' : 'MERGE');
  console.log('================================');
})();
