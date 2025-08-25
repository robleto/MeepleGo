const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function analyzeAwards() {
  const { data: games } = await supabase
    .from('games')
    .select('name, honors')
    .not('honors', 'eq', '[]');
  
  const awardTypes = new Map();
  
  games?.forEach(game => {
    game.honors?.forEach(honor => {
      const key = honor.award_type || 'Unknown';
      if (!awardTypes.has(key)) {
        awardTypes.set(key, { total: 0, winners: 0, nominees: 0, years: new Set() });
      }
      const award = awardTypes.get(key);
      award.total++;
      if (honor.category === 'Winner') award.winners++;
      if (honor.category === 'Nominee') award.nominees++;
      award.years.add(honor.year);
    });
  });
  
  console.log('Available Award Types:');
  [...awardTypes.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([type, stats]) => {
      console.log(`${type}: ${stats.total} total (${stats.winners} winners, ${stats.nominees} nominees) across ${stats.years.size} years`);
    });
}

analyzeAwards().catch(console.error);
