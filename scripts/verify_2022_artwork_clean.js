#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Verify 2022 artwork award is clean now
  const { data, error } = await supabase
    .from('games')
    .select('bgg_id,name,honors')
    .not('honors', 'is', null);
    
  if (error) throw error;
  
  const artworkGames = [];
  for (const game of data) {
    const artworkHonors = (game.honors || []).filter(h => 
      h.year === 2022 && 
      (h.honor_id === '79656' || h.honor_id === '80063')
    );
    
    if (artworkHonors.length > 0) {
      artworkGames.push({
        bgg_id: game.bgg_id,
        name: game.name,
        honors: artworkHonors
      });
    }
  }
  
  console.log('2022 Golden Geek Artwork & Presentation award:');
  
  const nominees = artworkGames.filter(g => g.honors.some(h => h.honor_id === '79656'));
  const winners = artworkGames.filter(g => g.honors.some(h => h.honor_id === '80063'));
  
  console.log(`\nWinner (${winners.length}):`);
  winners.forEach(g => {
    const winnerHonor = g.honors.find(h => h.honor_id === '80063');
    console.log(`  🏆 ${g.name} (${g.bgg_id}) - ${winnerHonor.category}`);
  });
  
  console.log(`\nNominees (${nominees.length}):`);
  nominees.forEach(g => {
    const nomineeHonor = g.honors.find(h => h.honor_id === '79656');
    console.log(`  🎯 ${g.name} (${g.bgg_id}) - ${nomineeHonor.category}`);
  });
})();
