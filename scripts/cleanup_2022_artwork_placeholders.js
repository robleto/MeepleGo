#!/usr/bin/env node
/**
 * Clean up 2022 Golden Geek Artwork placeholder entries
 * Remove corrupted games that are just placeholder honor titles
 *
 * Usage:
 *   node scripts/cleanup_2022_artwork_placeholders.js            (dry run)
 *   node scripts/cleanup_2022_artwork_placeholders.js --apply    (apply changes)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Known corrupted placeholder BGG IDs from investigation
const CORRUPTED_PLACEHOLDERS = [55690, 160069, 267367, 332398];

async function run() {
  console.log(`🧹 2022 Artwork placeholder cleanup (mode: ${APPLY ? 'DELETE' : 'DRY-RUN'})`);
  
  // Verify these are still corrupted placeholders
  const { data: placeholders, error } = await supabase
    .from('games')
    .select('bgg_id,name,year_published,image_url,honors')
    .in('bgg_id', CORRUPTED_PLACEHOLDERS);
    
  if (error) throw error;
  
  console.log('Verifying placeholder entries:');
  const toDelete = [];
  
  for (const game of placeholders || []) {
    const isCorrupted = game.name.toLowerCase().includes('golden geek') && 
                       game.name.toLowerCase().includes('artwork') &&
                       !game.year_published && 
                       !game.image_url;
                       
    console.log(`${game.bgg_id}: "${game.name}" - ${isCorrupted ? 'PLACEHOLDER' : 'REAL GAME'}`);
    
    if (isCorrupted) {
      toDelete.push(game.bgg_id);
    }
  }
  
  if (toDelete.length === 0) {
    console.log('✅ No corrupted placeholders found to delete.');
    return;
  }
  
  console.log(`\n🗑️  Will delete ${toDelete.length} placeholder entries: ${toDelete.join(', ')}`);
  
  if (APPLY) {
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
    console.log('\n🎉 Cleanup complete!');
  } else {
    console.log('\n💡 Dry-run complete. Re-run with --apply to delete placeholders.');
  }
  
  // Now fix categories for the real games
  console.log('\n🔧 Checking category assignments for real 2022 artwork games...');
  
  const { data: artworkGames, error: artError } = await supabase
    .from('games')
    .select('bgg_id,name,honors')
    .not('bgg_id', 'in', `(${toDelete.join(',')})`)
    .not('honors', 'is', null);
    
  if (artError) throw artError;
  
  let categoryUpdates = 0;
  
  for (const game of artworkGames || []) {
    const artworkHonors = (game.honors || []).filter(h => 
      h.year === 2022 && 
      (h.honor_id === '79656' || h.honor_id === '80063') // nominee and winner IDs
    );
    
    if (artworkHonors.length > 0) {
      let needsUpdate = false;
      const updatedHonors = game.honors.map(honor => {
        if (honor.honor_id === '79656' && honor.category !== 'Nominee') {
          console.log(`  📝 ${game.bgg_id} (${game.name}): ${honor.category} → Nominee`);
          needsUpdate = true;
          categoryUpdates++;
          return { ...honor, category: 'Nominee' };
        }
        if (honor.honor_id === '80063' && honor.category !== 'Winner') {
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
