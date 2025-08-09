require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRankRange() {
  const { data: rangeGames, count } = await supabase
    .from('games')
    .select('name, rank, year_published, rating', { count: 'exact' })
    .not('rank', 'is', null)
    .gte('rank', 2501)
    .lte('rank', 5000)
    .order('rank')
    .limit(10);
  
  console.log('Games with ranks 2501-5000:', count);
  console.log('Sample games in this range:');
  rangeGames?.forEach((game, i) => {
    console.log(`  ${i+1}. ${game.name} (${game.year_published}) - Rank: ${game.rank} | Rating: ${game.rating}`);
  });
  
  // Check what we have above 5000 too
  const { count: above5000 } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })
    .not('rank', 'is', null)
    .gt('rank', 5000);
  
  console.log('\nGames with ranks above 5000:', above5000);
  
  // Check distribution of ranks
  const { data: distribution } = await supabase
    .from('games')
    .select('rank')
    .not('rank', 'is', null)
    .order('rank');
  
  if (distribution) {
    const ranges = {
      '1-1000': 0,
      '1001-2500': 0,
      '2501-5000': 0,
      '5001-10000': 0,
      '10000+': 0
    };
    
    distribution.forEach(game => {
      if (game.rank <= 1000) ranges['1-1000']++;
      else if (game.rank <= 2500) ranges['1001-2500']++;
      else if (game.rank <= 5000) ranges['2501-5000']++;
      else if (game.rank <= 10000) ranges['5001-10000']++;
      else ranges['10000+']++;
    });
    
    console.log('\nRank distribution:');
    Object.entries(ranges).forEach(([range, count]) => {
      console.log(`  ${range}: ${count} games`);
    });
  }
}

checkRankRange().catch(console.error);
