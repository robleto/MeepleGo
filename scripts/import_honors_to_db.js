/**
 * Import honors from enhanced-honors-complete.fixed.json to Supabase
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function importHonors() {
  console.log('🎯 Starting honors import to database...');
  
  // Load the fixed JSON file
  const jsonFile = process.argv[2] || 'enhanced-honors-complete.fixed.json';
  console.log(`📂 Loading: ${jsonFile}`);
  
  if (!fs.existsSync(jsonFile)) {
    console.error(`❌ File not found: ${jsonFile}`);
    process.exit(1);
  }
  
  const raw = fs.readFileSync(jsonFile, 'utf8');
  const honors = JSON.parse(raw);
  
  console.log(`📊 Found ${honors.length} honors to process`);
  
  // --- Safeguard helpers to avoid corrupt placeholder names ---
  const honorTitlePattern = /^golden geek best /i; // Extendable if more award patterns surface
  const truncatedSuffixPattern = /(\s|[-])(no|wi)$/i; // e.g. '... No' or '... -wi'
  const isLikelyHonorTitleName = (name) => {
    if (!name) return false;
    const lower = name.toLowerCase().trim();
    if (honorTitlePattern.test(lower)) return true;
    if (honorTitlePattern.test(lower.replace(/["'`]/g, ''))) return true;
    // Heuristic: very long phrase with multiple generic award words & ending truncated token
    const awardTokens = ['golden', 'geek', 'best', 'board', 'game', 'print', 'play', 'artwork', 'presentation'];
    const tokenHits = awardTokens.filter(t => lower.includes(t)).length;
    if (tokenHits >= 5 && truncatedSuffixPattern.test(lower)) return true;
    return false;
  };
  const pickCanonicalName = (namesSet) => {
    const names = Array.from(namesSet);
    const real = names.filter(n => !isLikelyHonorTitleName(n));
    if (real.length) {
      // Prefer the longest (tends to include full subtitle) deterministic sort
      return real.sort((a,b)=>b.length - a.length)[0];
    }
    return names.sort((a,b)=>b.length - a.length)[0]; // fallback (may still be placeholder)
  };

  // Group honors by BGG ID collecting ALL candidate names for later canonical selection
  const gameMap = new Map(); // bggId -> { names: Set<string>, honors: [] }

  for (const honor of honors) {
    if (!Array.isArray(honor.boardgames)) continue;
    for (const gameData of honor.boardgames) {
      const bggId = parseInt(gameData.bggId);
      if (isNaN(bggId)) {
        console.warn(`⚠️  Skipping invalid BGG ID: ${gameData.bggId} for ${gameData.name}`);
        continue;
      }
      if (!gameMap.has(bggId)) {
        gameMap.set(bggId, { names: new Set(), honors: [] });
      }
      if (gameData.name) gameMap.get(bggId).names.add(gameData.name.trim());
      gameMap.get(bggId).honors.push({
        id: honor.id,
        title: honor.title,
        year: honor.year,
        category: honor.category || 'Special',
        rank: gameData.rank || null
      });
    }
  }

  // Derive canonical names AFTER aggregation
  const preparedGames = [];
  for (const [bggId, entry] of gameMap.entries()) {
    const canonical = pickCanonicalName(entry.names);
    const looksPlaceholder = isLikelyHonorTitleName(canonical);
    if (looksPlaceholder) {
      console.warn(`🚫 Skipping insert for BGG ${bggId} due to suspicious placeholder-like name: '${canonical}'`);
      continue; // Skip entirely rather than risk corrupt data
    }
    preparedGames.push({ bgg_id: bggId, name: canonical, honors: entry.honors });
  }

  console.log(`🛡️  Safeguard: ${gameMap.size} aggregated; ${preparedGames.length} passed name validation; skipped ${gameMap.size - preparedGames.length}.`);
  
  console.log(`🎮 Processing ${preparedGames.length} unique games (post-validation)...`);
  
  let processed = 0;
  let updated = 0;
  let errors = 0;
  
  for (const gameData of preparedGames) {
    const bggId = gameData.bgg_id;
    try {
      // First check if game exists
      const { data: existingGame } = await supabase
        .from('games')
        .select('bgg_id, name, honors')
        .eq('bgg_id', bggId)
        .single();
      
      if (existingGame) {
        // Game exists, merge honors (do NOT overwrite name here, safeguard)
        const existingHonors = Array.isArray(existingGame.honors) ? existingGame.honors : [];
        const combinedHonors = [...existingHonors];
        for (const newHonor of gameData.honors) {
          const exists = existingHonors.some(h => h.id === newHonor.id);
          if (!exists) combinedHonors.push(newHonor);
        }
        const { error } = await supabase
          .from('games')
          .update({ honors: combinedHonors })
          .eq('bgg_id', bggId);
        
        if (error) {
          console.error(`❌ Error updating ${gameData.name}:`, error.message);
          errors++;
        } else {
          updated++;
          if (updated % 100 === 0) {
            console.log(`📈 Updated ${updated} games...`);
          }
        }
      } else {
        // Game doesn't exist, create new record (already name-sanitized)
        const { error } = await supabase
          .from('games')
          .insert({ bgg_id: bggId, name: gameData.name, honors: gameData.honors });
        
        if (error) {
          console.error(`❌ Error creating ${gameData.name}:`, error.message);
          errors++;
        } else {
          updated++;
          if (updated % 100 === 0) {
            console.log(`📈 Processed ${updated} games...`);
          }
        }
      }
      
      processed++;
    } catch (err) {
      console.error(`💥 Unexpected error processing BGG ID ${bggId}:`, err.message);
      errors++;
    }
  }
  
  console.log('\n✅ Import completed!');
  console.log(`📊 Summary:`);
  console.log(`   • Total games processed: ${processed}`);
  console.log(`   • Successful updates: ${updated}`);
  console.log(`   • Errors: ${errors}`);
  
  // Test the 2024 Golden Geek artwork category
  console.log('\n🎨 Testing 2024 Golden Geek artwork category...');
  
  const { data: artworkGames } = await supabase
    .from('games')
    .select('bgg_id, name, honors')
    .not('honors', 'is', null);
  
  const goldenGeek2024Artwork = [];
  
  for (const game of artworkGames || []) {
    const artworkHonors = (game.honors || []).filter(h => 
      h.title && h.title.includes('Golden Geek') && 
      h.title.includes('Artwork') && 
      h.year === 2024
    );
    
    if (artworkHonors.length > 0) {
      goldenGeek2024Artwork.push({
        name: game.name,
        bggId: game.bgg_id,
        honors: artworkHonors
      });
    }
  }
  
  console.log(`🏆 Found ${goldenGeek2024Artwork.length} games in 2024 Golden Geek artwork category:`);
  goldenGeek2024Artwork.forEach(game => {
    game.honors.forEach(honor => {
      console.log(`   • ${game.name} - ${honor.category} (ID: ${game.bggId})`);
    });
  });
}

// Run the import
importHonors().then(() => {
  console.log('🏁 Import script completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Import failed:', error);
  process.exit(1);
});
