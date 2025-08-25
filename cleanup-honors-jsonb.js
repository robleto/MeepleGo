const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

async function cleanupHonorsData() {
  console.log('Starting honors data cleanup...');
  
  // Get all games with honors
  const { data: games, error } = await supabase
    .from('games')
    .select('id, bgg_id, name, honors')
    .not('honors', 'is', null);
    
  if (error) {
    console.error('Error fetching games:', error);
    return;
  }
  
  console.log(`Found ${games.length} games with honors`);
  
  let updatedCount = 0;
  const batchSize = 100;
  
  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize);
    
    for (const game of batch) {
      if (!game.honors || !Array.isArray(game.honors)) continue;
      
      // Simplify each honor to just essential fields
      const cleanedHonors = game.honors.map(honor => {
        // Keep only the essential fields
        const cleaned = {
          name: honor.name,
          year: honor.year,
          category: honor.category, // Winner, Nominee, Special
          award_type: honor.award_type,
          position: honor.position // This has the clean category name
        };
        
        // Only add subcategory if it's meaningful and different from position
        if (honor.subcategory && 
            honor.subcategory !== 'Overall' && 
            honor.subcategory !== honor.position &&
            !honor.position?.includes(honor.subcategory)) {
          cleaned.subcategory = honor.subcategory;
        }
        
        return cleaned;
      });
      
      const { error: updateError } = await supabase
        .from('games')
        .update({ honors: cleanedHonors })
        .eq('id', game.id);
        
      if (updateError) {
        console.error(`Error updating game ${game.name}:`, updateError);
      } else {
        updatedCount++;
      }
    }
    
    console.log(`Updated batch ${i / batchSize + 1}/${Math.ceil(games.length / batchSize)} (${updatedCount} games total)`);
  }
  
  console.log(`\nCleanup complete! Updated ${updatedCount} games`);
  
  // Show a sample of the cleaned data
  const { data: sampleGame } = await supabase
    .from('games')
    .select('name, honors')
    .not('honors', 'is', null)
    .limit(1)
    .single();
    
  if (sampleGame) {
    console.log('\nSample cleaned honor data:');
    console.log('Game:', sampleGame.name);
    console.log('Honors:', JSON.stringify(sampleGame.honors, null, 2));
  }
}

// Show before/after comparison
async function showComparison() {
  const { data: game } = await supabase
    .from('games')
    .select('name, honors')
    .not('honors', 'is', null)
    .limit(1)
    .single();
    
  if (game && game.honors?.[0]) {
    console.log('\nBEFORE cleanup - fields per honor:');
    console.log('Fields:', Object.keys(game.honors[0]).sort());
    console.log('Example honor:', JSON.stringify(game.honors[0], null, 2));
  }
}

async function main() {
  await showComparison();
  
  console.log('\nStarting cleanup in 3 seconds...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await cleanupHonorsData();
}

main().catch(console.error);
