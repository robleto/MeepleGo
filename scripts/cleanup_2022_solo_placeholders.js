#!/usr/bin/env node
/**
 * Clean up 2022 Golden Geek Solo Board Game placeholder entries
 * Remove corrupted games that are just placeholder honor titles
 *
 * Usage:
 *   node scripts/cleanup_2022_solo_placeholders.js            (dry run)
 *   node scripts/cleanup_2022_solo_placeholders.js --apply    (apply changes)
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const APPLY = process.argv.includes('--apply');
const HONORS_FILE = fs.existsSync('enhanced-honors-complete.fixed.json') 
  ? 'enhanced-honors-complete.fixed.json' 
  : 'enhanced-honors-complete.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Known corrupted placeholder BGG IDs from investigation
const CORRUPTED_PLACEHOLDERS = [57141, 105023, 142585, 142889, 159692, 164874, 206156, 324759];

function buildCanonicalNameMap(honors) {
  const map = new Map();
  for (const honor of honors) {
    if (!Array.isArray(honor.boardgames)) continue;
    for (const game of honor.boardgames) {
      if (!game?.bggId || !game?.name) continue;
      if (!map.has(game.bggId)) map.set(game.bggId, new Set());
      map.get(game.bggId).add(game.name.trim());
    }
  }
  
  const canonical = new Map();
  for (const [id, names] of map.entries()) {
    const realNames = Array.from(names).filter(n => !/^Golden Geek Best /i.test(n));
    let chosen = realNames.length ? realNames[0] : Array.from(names)[0];
    if (realNames.length > 1) {
      chosen = realNames.sort((a, b) => b.length - a.length)[0];
    }
    canonical.set(id, chosen);
  }
  return canonical;
}

async function run() {
  console.log(`🧹 2022 Solo placeholder cleanup (mode: ${APPLY ? 'DELETE' : 'DRY-RUN'})`);
  
  const honors = JSON.parse(fs.readFileSync(HONORS_FILE, 'utf8'));
  const canonical = buildCanonicalNameMap(honors);
  
  // Verify these are still corrupted placeholders
  const { data: placeholders, error } = await supabase
    .from('games')
    .select('bgg_id,name,year_published,image_url,honors')
    .in('bgg_id', CORRUPTED_PLACEHOLDERS);
    
  if (error) throw error;
  
  console.log('Verifying placeholder entries:');
  const toDelete = [];
  const toRestore = [];
  
  for (const game of placeholders || []) {
    const isCorrupted = game.name.toLowerCase().includes('golden geek') && 
                       game.name.toLowerCase().includes('solo') &&
                       !game.year_published && 
                       !game.image_url;
    
    const canonicalName = canonical.get(game.bgg_id);
    const canRestore = canonicalName && canonicalName !== game.name && !canonicalName.toLowerCase().includes('golden geek');
    
    console.log(`${game.bgg_id}: "${game.name}" - ${isCorrupted ? 'PLACEHOLDER' : 'REAL GAME'} ${canRestore ? `(can restore to "${canonicalName}")` : ''}`);
    
    if (isCorrupted) {
      if (canRestore) {
        toRestore.push({ bgg_id: game.bgg_id, name: canonicalName });
      } else {
        toDelete.push(game.bgg_id);
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  🗑️  Will delete ${toDelete.length} placeholder entries: ${toDelete.join(', ')}`);
  console.log(`  🔧 Will restore ${toRestore.length} games to canonical names`);
  
  if (toRestore.length > 0) {
    console.log('  Restorations:');
    toRestore.forEach(r => console.log(`    ${r.bgg_id} → "${r.name}"`));
  }
  
  if (APPLY) {
    // Delete true placeholders
    for (const bggId of toDelete) {
      const { error: deleteError } = await supabase
        .from('games')
        .delete()
        .eq('bgg_id', bggId);
        
      if (deleteError) {
        console.error(`❌ Failed to delete ${bggId}:`, deleteError.message);
      } else {
        console.log(`✅ Deleted placeholder game ${bggId}`);
      }
    }
    
    // Restore names for recoverable games
    for (const restore of toRestore) {
      const { error: updateError } = await supabase
        .from('games')
        .update({ name: restore.name })
        .eq('bgg_id', restore.bgg_id);
        
      if (updateError) {
        console.error(`❌ Failed to restore ${restore.bgg_id}:`, updateError.message);
      } else {
        console.log(`✅ Restored ${restore.bgg_id} to "${restore.name}"`);
      }
    }
    
    console.log('\n🎉 Cleanup complete!');
  } else {
    console.log('\n💡 Dry-run complete. Re-run with --apply to clean up placeholders.');
  }
  
  // Now fix categories for the real games
  console.log('\n🔧 Checking category assignments for real 2022 solo games...');
  
  const { data: soloGames, error: soloError } = await supabase
    .from('games')
    .select('bgg_id,name,honors')
    .not('bgg_id', 'in', `(${toDelete.join(',') || '0'})`)
    .not('honors', 'is', null);
    
  if (soloError) throw soloError;
  
  let categoryUpdates = 0;
  
  for (const game of soloGames || []) {
    const soloHonors = (game.honors || []).filter(h => 
      h.year === 2022 && 
      (h.honor_id === '79666' || h.honor_id === '80069') // nominee and winner IDs
    );
    
    if (soloHonors.length > 0) {
      let needsUpdate = false;
      const updatedHonors = game.honors.map(honor => {
        if (honor.honor_id === '79666' && honor.category !== 'Nominee') {
          console.log(`  📝 ${game.bgg_id} (${game.name}): ${honor.category} → Nominee`);
          needsUpdate = true;
          categoryUpdates++;
          return { ...honor, category: 'Nominee' };
        }
        if (honor.honor_id === '80069' && honor.category !== 'Winner') {
          console.log(`  🏆 ${game.bgg_id} (${game.name}): ${honor.category} → Winner`);
          needsUpdate = true;
          categoryUpdates++;
          return { ...honor, category: 'Winner' };
        }
        return honor;
      });
      
      if (needsUpdate && APPLY) {
        const { error: updateError } = await supabase
          .from('games')
          .update({ honors: updatedHonors })
          .eq('bgg_id', game.bgg_id);
          
        if (updateError) {
          console.error(`❌ Failed to update categories for ${game.bgg_id}:`, updateError.message);
        }
      }
    }
  }
  
  console.log(`\n📊 Category updates: ${categoryUpdates}`);
  if (categoryUpdates > 0 && !APPLY) {
    console.log('💡 Re-run with --apply to persist category changes.');
  }
}

run().catch(error => {
  console.error('💥 Script error:', error);
  process.exit(1);
});
