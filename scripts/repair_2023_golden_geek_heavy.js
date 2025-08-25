#!/usr/bin/env node
/**
 * Repair 2023 Golden Geek Heavy Game data issues:
 * 1. Find 2023 Golden Geek Heavy honors
 * 2. Apply proper Winner/Nominee categories based on game count
 * 3. Restore any corrupted game names if needed
 *
 * Usage:
 *   node scripts/repair_2023_golden_geek_heavy.js            (dry run)
 *   node scripts/repair_2023_golden_geek_heavy.js --apply    (apply changes)
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

// Known 2023 Heavy honor IDs from the search
const HEAVY_2023_NOMINEE_ID = '103915'; // Multiple games
const HEAVY_2023_WINNER_ID = '103929';  // Single game

function find2023HeavyHonors(honors) {
  return honors.filter(h => 
    h.year === 2023 && 
    (h.id === HEAVY_2023_NOMINEE_ID || h.id === HEAVY_2023_WINNER_ID ||
     (h.position?.toLowerCase().includes('heavy') &&
      h.position?.toLowerCase().includes('golden geek')))
  );
}

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
  console.log(`🏋️ 2023 Golden Geek Heavy repair (mode: ${APPLY ? 'APPLY' : 'DRY-RUN'})`);
  console.log(`📄 Loading honors file: ${HONORS_FILE}`);
  
  const honors = JSON.parse(fs.readFileSync(HONORS_FILE, 'utf8'));
  const heavy2023Honors = find2023HeavyHonors(honors);
  
  if (heavy2023Honors.length === 0) {
    console.log('❌ No 2023 Golden Geek Heavy honors found in JSON');
    return;
  }
  
  console.log(`✅ Found ${heavy2023Honors.length} Heavy honor entries for 2023:`);
  heavy2023Honors.forEach(h => {
    console.log(`  • Honor ${h.id}: "${h.title || h.position}" (${h.boardgames?.length || 0} games)`);
  });
  
  const canonical = buildCanonicalNameMap(honors);
  const allTargetBggIds = new Set();
  const honorMappings = new Map(); // bggId -> { honorId, expectedCategory }
  
  // Build mappings
  for (const honor of heavy2023Honors) {
    const gameCount = honor.boardgames?.length || 0;
    const expectedCategory = gameCount === 1 ? 'Winner' : 'Nominee';
    
    for (const game of honor.boardgames || []) {
      if (game?.bggId) {
        allTargetBggIds.add(game.bggId);
        if (!honorMappings.has(game.bggId)) {
          honorMappings.set(game.bggId, []);
        }
        honorMappings.get(game.bggId).push({
          honorId: honor.id,
          expectedCategory,
          gameCount
        });
      }
    }
  }
  
  if (allTargetBggIds.size === 0) {
    console.log('❌ No target games found');
    return;
  }
  
  console.log(`🎯 Target games: ${Array.from(allTargetBggIds).join(', ')}`);
  
  // Fetch affected games from database
  const { data: games, error } = await supabase
    .from('games')
    .select('bgg_id, name, year_published, image_url, thumbnail_url, honors')
    .in('bgg_id', Array.from(allTargetBggIds));
    
  if (error) throw error;
  
  let nameUpdates = 0;
  let categoryUpdates = 0;
  const changes = [];
  
  for (const game of games || []) {
    const mappings = honorMappings.get(game.bgg_id) || [];
    const canonicalName = canonical.get(game.bgg_id);
    let needsUpdate = false;
    let updates = {};
    
    // Check if name needs restoration
    const isCorrupted = /^Golden Geek.*Heavy/i.test(game.name) && 
                       !game.year_published && 
                       !game.image_url && 
                       !game.thumbnail_url;
                       
    if (isCorrupted && canonicalName && canonicalName !== game.name) {
      updates.name = canonicalName;
      changes.push({
        bgg_id: game.bgg_id,
        type: 'name',
        from: game.name,
        to: canonicalName
      });
      nameUpdates++;
      needsUpdate = true;
    }
    
    // Check if honors need category updates
    if (Array.isArray(game.honors) && mappings.length > 0) {
      const updatedHonors = game.honors.map(honor => {
        for (const mapping of mappings) {
          if (honor?.honor_id === mapping.honorId && honor.category !== mapping.expectedCategory) {
            changes.push({
              bgg_id: game.bgg_id,
              type: 'category',
              from: honor.category,
              to: mapping.expectedCategory,
              honorId: mapping.honorId
            });
            categoryUpdates++;
            needsUpdate = true;
            return { ...honor, category: mapping.expectedCategory };
          }
        }
        return honor;
      });
      
      if (needsUpdate && JSON.stringify(updatedHonors) !== JSON.stringify(game.honors)) {
        updates.honors = updatedHonors;
      }
    }
    
    // Apply updates
    if (needsUpdate && Object.keys(updates).length > 0 && APPLY) {
      const { error: updateError } = await supabase
        .from('games')
        .update(updates)
        .eq('bgg_id', game.bgg_id);
        
      if (updateError) {
        console.error(`❌ Update failed for game ${game.bgg_id}:`, updateError.message);
      } else {
        console.log(`✅ Updated game ${game.bgg_id}: ${game.name}`);
      }
    }
  }
  
  // Summary
  console.log('\n--- SUMMARY ---');
  console.log(`Name restorations: ${nameUpdates}`);
  console.log(`Category updates: ${categoryUpdates}`);
  
  if (changes.length > 0) {
    console.log('\nChanges:');
    changes.forEach(change => {
      if (change.type === 'name') {
        console.log(`  📝 ${change.bgg_id}: "${change.from}" → "${change.to}"`);
      } else {
        console.log(`  🏆 ${change.bgg_id}: ${change.from} → ${change.to} (honor ${change.honorId})`);
      }
    });
  }
  
  if (!APPLY) {
    console.log('\n💡 Dry-run complete. Re-run with --apply to persist changes.');
  } else {
    console.log('\n✅ Repair complete!');
  }
}

run().catch(error => {
  console.error('💥 Script error:', error);
  process.exit(1);
});
