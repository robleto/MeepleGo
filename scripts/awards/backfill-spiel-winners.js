#!/usr/bin/env node
/**
 * Backfill missing Spiel des Jahres winner honors for years lacking a Winner entry.
 * Currently targets 2020 and 2021 which were missing after normalization.
 *
 * Inserts a synthetic honor object with source 'manual-backfill' and honor_id 'manual-spiel-<year>-winner'.
 * Skips if any existing Winner for (award_type='Spiel des Jahres', year) already present.
 *
 * Usage:
 *   node scripts/awards/backfill-spiel-winners.js --dry-run
 *   node scripts/awards/backfill-spiel-winners.js --apply
 */
/* eslint-disable no-console */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const DRY = !APPLY;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!supabaseUrl || !supabaseKey){ console.error('Missing Supabase credentials'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession:false }});

// Authoritative mapping (bgg_id + name) for Spiel des Jahres winners needing backfill.
// (Confirm bgg_ids in your DB; adjust if naming differs.)
const BACKFILL_WINNERS = [
  { year: 2020, name: 'Pictures', bgg_id: 284108 },
  { year: 2021, name: 'MicroMacro: Crime City', bgg_id: 318977 }
];

async function fetchGameByBggId(bggId){
  const { data, error } = await supabase.from('games').select('id,bgg_id,name,honors').eq('bgg_id', bggId).limit(1);
  if(error) throw new Error(error.message);
  return data && data[0];
}

async function groupHasWinner(year){
  // Scan for any existing winner for the award/year.
  const { data, error } = await supabase
    .from('games')
    .select('honors')
    .not('honors','eq','[]');
  if(error) throw new Error(error.message);
  for(const g of data){
    for(const h of (g.honors||[])){
      if(h.award_type === 'Spiel des Jahres' && h.year === year && h.category === 'Winner') return true;
    }
  }
  return false;
}

function buildHonor({ year, name }){
  return {
    honor_id: `manual-spiel-${year}-winner`,
    name: `${year} Spiel des Jahres Winner`,
    year,
    award_type: 'Spiel des Jahres',
    award_set: `${year} Spiel des Jahres`,
    position: 'Spiel des Jahres',
    title: 'Spiel des Jahres Winner',
    slug: `manual-${year}-spiel-des-jahres-winner`,
    url: null,
    game_name: name,
    category: 'Winner',
    subcategory: 'Spiel des Jahres',
    primary_winner: true,
    result_raw: 'Winner',
    source: 'manual-backfill',
    created_at: new Date().toISOString()
  };
}

async function run(){
  console.log('[backfill-spiel] Start', { APPLY });
  let inserted = 0; let skippedExists = 0; let missingGames = 0; let updatedGames = 0;
  for(const entry of BACKFILL_WINNERS){
    const { year, bgg_id, name } = entry;
    const has = await groupHasWinner(year);
    if(has){ skippedExists++; continue; }
    const game = await fetchGameByBggId(bgg_id);
    if(!game){ console.warn('[backfill-spiel] Game missing in DB for', year, bgg_id, name); missingGames++; continue; }
    const honors = Array.isArray(game.honors) ? [...game.honors] : [];
    // Avoid duplicate honor_id if script rerun
    if(honors.some(h=>h.honor_id === `manual-spiel-${year}-winner`)){
      skippedExists++; continue;
    }
    honors.push(buildHonor(entry));
    if(!DRY){
      const { error } = await supabase.from('games').update({ honors }).eq('id', game.id);
      if(error){ console.error('Update failed for game', bgg_id, error.message); continue; }
    }
    inserted++; updatedGames++;
    console.log(`[backfill-spiel] ${(DRY?'Would insert':'Inserted')} winner for ${year}: ${name}`);
  }
  console.log('[backfill-spiel] Complete', { APPLY, inserted, skippedExists, missingGames, updatedGames });
}

run().catch(e=>{ console.error('Fatal', e); process.exit(1); });
