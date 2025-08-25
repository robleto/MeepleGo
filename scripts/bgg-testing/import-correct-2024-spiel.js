const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Function to get BGG game data
async function getBggGameData(gameId) {
  try {
    const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&stats=1`);
    if (!response.ok) {
      throw new Error(`BGG API error: ${response.status}`);
    }
    
    const xmlText = await response.text();
    
    // Parse game name and year
    const nameMatch = xmlText.match(/<name[^>]*type="primary"[^>]*value="([^"]+)"/);
    const yearMatch = xmlText.match(/<yearpublished[^>]*value="([^"]+)"/);
    const playersMatch = xmlText.match(/<minplayers[^>]*value="([^"]+)"[\s\S]*?<maxplayers[^>]*value="([^"]+)"/);
    const playtimeMatch = xmlText.match(/<playingtime[^>]*value="([^"]+)"/);
    const ageMatch = xmlText.match(/<minage[^>]*value="([^"]+)"/);
    const complexityMatch = xmlText.match(/<averageweight[^>]*value="([^"]+)"/);
    const ratingMatch = xmlText.match(/<average[^>]*value="([^"]+)"/);
    
    return {
      name: nameMatch ? nameMatch[1] : 'Unknown Game',
      year_published: yearMatch ? parseInt(yearMatch[1]) : null,
      min_players: playersMatch ? parseInt(playersMatch[1]) : null,
      max_players: playersMatch ? parseInt(playersMatch[2]) : null,
      playtime_minutes: playtimeMatch ? parseInt(playtimeMatch[1]) : null,
      min_age: ageMatch ? parseInt(ageMatch[1]) : null,
      weight: complexityMatch ? parseFloat(complexityMatch[1]) : null,
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : null
    };
  } catch (error) {
    console.error(`Error fetching BGG data for game ${gameId}:`, error.message);
    return null;
  }
}

// Function to ensure game exists and add honor
async function ensureGameWithHonor(bggId, gameData, honorData) {
  // Check if game already exists
  const { data: existingGame } = await supabase
    .from('games')
    .select('id, honors')
    .eq('bgg_id', bggId)
    .single();
  
  let gameId;
  let currentHonors = [];
  
  if (existingGame) {
    gameId = existingGame.id;
    currentHonors = existingGame.honors || [];
  } else {
    // Create new game
    const { data: newGame, error } = await supabase
      .from('games')
      .insert({
        bgg_id: bggId,
        honors: [],
        ...gameData
      })
      .select('id')
      .single();
    
    if (error) {
      throw error;
    }
    
    gameId = newGame.id;
  }
  
  // Add the new honor to the honors array
  const newHonor = {
    award: honorData.award,
    year: honorData.year,
    category: honorData.category
  };
  
  // Check if this honor already exists
  const honorExists = currentHonors.some(honor => 
    honor.award === newHonor.award && 
    honor.year === newHonor.year && 
    honor.category === newHonor.category
  );
  
  if (!honorExists) {
    currentHonors.push(newHonor);
    
    // Update the game with the new honors array
    const { error: updateError } = await supabase
      .from('games')
      .update({ honors: currentHonors })
      .eq('id', gameId);
    
    if (updateError) {
      throw updateError;
    }
  }
  
  return gameId;
}

// Correct 2024 Spiel des Jahres data from BGG wiki
const CORRECT_2024_SPIEL_DATA = [
  // 2024 Spiel des Jahres
  { bgg_id: 379043, award: 'Spiel des Jahres', year: 2024, category: 'Winner', name: 'Sky Team' },
  { bgg_id: 398883, award: 'Spiel des Jahres', year: 2024, category: 'Nominee', name: 'Captain Flip' },
  { bgg_id: 341169, award: 'Spiel des Jahres', year: 2024, category: 'Nominee', name: 'In the Footsteps of Darwin' },
  
  // 2024 Spiel des Jahres Recommended
  { bgg_id: 410565, award: 'Spiel des Jahres', year: 2024, category: 'Special', name: 'Die 7 Bazis' },
  { bgg_id: 411994, award: 'Spiel des Jahres', year: 2024, category: 'Special', name: 'Agent Avenue' },
  { bgg_id: 373106, award: 'Spiel des Jahres', year: 2024, category: 'Special', name: 'Castle Combo' },
  { bgg_id: 412293, award: 'Spiel des Jahres', year: 2024, category: 'Special', name: 'Cities' },
  { bgg_id: 394453, award: 'Spiel des Jahres', year: 2024, category: 'Special', name: 'Foxy' },
  { bgg_id: 407863, award: 'Spiel des Jahres', year: 2024, category: 'Special', name: 'Perfect Words' },
  { bgg_id: 377370, award: 'Spiel des Jahres', year: 2024, category: 'Special', name: 'The Animals of Baker Street' }
];

// Correct 2024 Kennerspiel des Jahres data
const CORRECT_2024_KENNERSPIEL_DATA = [
  { bgg_id: 397908, award: 'Kennerspiel des Jahres', year: 2024, category: 'Winner', name: 'Daybreak' },
  { bgg_id: 338834, award: 'Kennerspiel des Jahres', year: 2024, category: 'Nominee', name: 'Ticket to Ride Legacy: Legends of the West' },
  { bgg_id: 382954, award: 'Kennerspiel des Jahres', year: 2024, category: 'Nominee', name: 'The Guild of Merchant Explorers' }
];

async function importCorrect2024Data() {
  console.log('=== IMPORTING CORRECT 2024 SPIEL DES JAHRES DATA ===\n');
  
  const allGames = [...CORRECT_2024_SPIEL_DATA, ...CORRECT_2024_KENNERSPIEL_DATA];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const gameEntry of allGames) {
    console.log(`\nProcessing: ${gameEntry.name} (BGG: ${gameEntry.bgg_id})`);
    
    try {
      // Get BGG data
      console.log('  Fetching BGG data...');
      const bggData = await getBggGameData(gameEntry.bgg_id);
      
      if (!bggData) {
        console.log(`  ❌ Failed to fetch BGG data`);
        errorCount++;
        continue;
      }
      
      // Ensure game exists and add honor
      console.log('  Ensuring game exists and adding honor...');
      const gameId = await ensureGameWithHonor(gameEntry.bgg_id, bggData, {
        award: gameEntry.award,
        year: gameEntry.year,
        category: gameEntry.category
      });
      
      console.log(`  ✅ Success: ${gameEntry.name} - ${gameEntry.award} ${gameEntry.year} (${gameEntry.category})`);
      successCount++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n=== IMPORT COMPLETE ===');
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total processed: ${allGames.length}`);
  
  // Verify the data
  console.log('\n=== VERIFICATION ===');
  const { data: gamesWithHonors } = await supabase
    .from('games')
    .select('name, bgg_id, honors')
    .not('honors', 'is', null)
    .order('name');
  
  console.log(`\nGames with honors: ${gamesWithHonors?.length || 0}`);
  
  if (gamesWithHonors) {
    const games2024 = gamesWithHonors.filter(game => 
      game.honors.some(honor => honor.year === 2024)
    );
    
    console.log(`\nGames with 2024 honors: ${games2024.length}`);
    
    games2024.forEach(game => {
      console.log(`\n${game.name} (BGG: ${game.bgg_id}):`);
      game.honors
        .filter(honor => honor.year === 2024)
        .forEach(honor => {
          console.log(`  ${honor.award} ${honor.year} - ${honor.category}`);
        });
    });
  }
}

// Run the import
if (require.main === module) {
  importCorrect2024Data()
    .then(() => {
      console.log('\n🎉 2024 Spiel des Jahres data import completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

module.exports = { importCorrect2024Data };
