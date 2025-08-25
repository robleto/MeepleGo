const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function clearErroneousGameData() {
  console.log('=== CLEARING ERRONEOUS GAME DATA ===');
  console.log('This will remove games that were imported with incorrect data...\n');
  
  try {
    // First, let's see what we have in the games table
    console.log('1. Checking current games in database...');
    const { data: allGames, error: fetchError } = await supabase
      .from('games')
      .select('id, name, year_published, bgg_id, created_at')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`Found ${allGames.length} total games in database`);
    
    // Show recent additions (likely the problematic ones)
    const recentGames = allGames.slice(0, 20);
    console.log('\nRecent games (top 20):');
    recentGames.forEach(game => {
      console.log(`  ${game.id}: ${game.name} (${game.year_published}) - BGG: ${game.bgg_id}`);
    });
    
    // Let's also check for any honors that might be linked to games
    console.log('\n2. Checking honors in database...');
    const { data: allHonors, error: honorsError } = await supabase
      .from('honors')
      .select('id, game_id, award, year, category')
      .order('created_at', { ascending: false });
    
    if (honorsError) {
      throw honorsError;
    }
    
    console.log(`Found ${allHonors.length} total honors in database`);
    
    // Show 2024 honors specifically
    const honors2024 = allHonors.filter(honor => honor.year === 2024);
    console.log(`\n2024 honors (${honors2024.length}):`);
    honors2024.forEach(honor => {
      console.log(`  Honor ${honor.id}: Game ${honor.game_id} - ${honor.award} ${honor.year} (${honor.category})`);
    });
    
    // Ask for confirmation before proceeding
    console.log('\n=== CONFIRMATION REQUIRED ===');
    console.log('This script will:');
    console.log('1. Remove ALL games from the games table');
    console.log('2. Remove ALL honors from the honors table');
    console.log('3. Reset both tables to empty state');
    console.log('\nThis is a destructive operation that cannot be undone!');
    console.log('\nTo proceed, edit this script and change CONFIRM_DELETION to true\n');
    
    const CONFIRM_DELETION = false; // Change to true to proceed
    
    if (!CONFIRM_DELETION) {
      console.log('❌ Deletion not confirmed. Exiting safely.');
      return;
    }
    
    // If we get here, user has confirmed deletion
    console.log('🚨 PROCEEDING WITH DELETION...\n');
    
    // Step 1: Delete all honors (must be done first due to foreign key constraints)
    console.log('1. Deleting all honors...');
    const { error: deleteHonorsError } = await supabase
      .from('honors')
      .delete()
      .neq('id', 0); // This deletes all rows
    
    if (deleteHonorsError) {
      throw deleteHonorsError;
    }
    console.log('  ✓ All honors deleted');
    
    // Step 2: Delete all games
    console.log('2. Deleting all games...');
    const { error: deleteGamesError } = await supabase
      .from('games')
      .delete()
      .neq('id', 0); // This deletes all rows
    
    if (deleteGamesError) {
      throw deleteGamesError;
    }
    console.log('  ✓ All games deleted');
    
    // Step 3: Verify the tables are empty
    console.log('\n3. Verifying cleanup...');
    
    const { data: remainingGames } = await supabase
      .from('games')
      .select('id');
    
    const { data: remainingHonors } = await supabase
      .from('honors')
      .select('id');
    
    console.log(`Games remaining: ${remainingGames?.length || 0}`);
    console.log(`honors remaining: ${remainingHonors?.length || 0}`);
    
    if ((remainingGames?.length || 0) === 0 && (remainingHonors?.length || 0) === 0) {
      console.log('\n✅ CLEANUP COMPLETE');
      console.log('Both games and honors tables are now empty and ready for fresh data import.');
    } else {
      console.log('\n⚠️  CLEANUP INCOMPLETE');
      console.log('Some data may still remain in the tables.');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run the cleanup
if (require.main === module) {
  clearErroneousGameData()
    .then(() => {
      console.log('\nCleanup script completed.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { clearErroneousGameData };
