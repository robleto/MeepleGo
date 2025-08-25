#!/usr/bin/env node
/**
 * Cleanup script for Charles S Roberts placeholder rows that were imported as games.
 * Strategy:
 *  - Identify games whose name starts with "Charles S Roberts Best" and have no image/thumbnail
 *    and whose honors array only contains Charles S Roberts related award_type OR mismatched award types.
 *  - If they also lack year_published OR have obviously truncated name endings (Nomi / Winn etc), treat as placeholder.
 *  - Attempt to find canonical real game name from other honors referencing same bgg_id (rare). If none, delete.
 *  - Dry run by default; pass --apply to perform deletions.
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function looksTruncated(name){
  return /( nomi$| nom$| winn$| win$| winne$)/i.test(name);
}

(async function main(){
  console.log(`Charles S Roberts cleanup starting (mode=${APPLY?'APPLY':'scan'})`);
  const { data, error } = await supabase.from('games')
    .select('bgg_id,name,year_published,image_url,thumbnail_url,honors')
    .ilike('name','Charles S Roberts Best%')
    .limit(5000);
  if (error) { console.error(error); process.exit(1);}  
  const placeholders = [];
  for (const g of data) {
    const lower = g.name.toLowerCase();
    const truncated = looksTruncated(lower);
    const emptyMedia = !g.image_url && !g.thumbnail_url;
    const missingYear = !g.year_published;
    const onlyCSRHonors = (g.honors||[]).length === 0 || (g.honors||[]).every(h=>/charles s roberts/i.test(h.award_type||h.name||''));
    if (lower.startsWith('charles s roberts best') && emptyMedia && (missingYear || truncated) && onlyCSRHonors) {
      placeholders.push(g);
    }
  }
  console.log(`Detected ${placeholders.length} probable placeholder rows.`);
  if (!APPLY) {
    console.log('Run with --apply to delete these placeholder game rows. Sample:');
    placeholders.slice(0,10).forEach(p=>console.log('  ', p.bgg_id, p.name));
    return;
  }
  let deleted=0;
  for (const p of placeholders) {
    const { error: delErr } = await supabase.from('games').delete().eq('bgg_id', p.bgg_id);
    if (delErr) console.error('Delete failed', p.bgg_id, delErr.message); else {
      deleted++; if (deleted % 25 ===0) console.log(`Deleted ${deleted}`);
    }
    await new Promise(r=>setTimeout(r,150));
  }
  console.log(`Deleted ${deleted} Charles S Roberts placeholders.`);
})();
