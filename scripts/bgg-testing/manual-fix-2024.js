const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function manualFix2024SpielDesJahres() {
  console.log('=== MANUAL FIX: 2024 Spiel des Jahres ===');
  
  // Step 1: Remove ALL 2024 Spiel des Jahres honors from all games
  console.log('Step 1: Removing all 2024 Spiel des Jahres honors...');
  
  const { data: allGames, error: fetchError } = await supabase
    .from('games')
    .select('bgg_id, name, honors')
    .not('honors', 'eq', '[]');

  if (fetchError) {
    console.error('Error fetching games:', fetchError);
    return;
  }

  for (const game of allGames) {
    const has2024SpielHonors = game.honors.some(honor => 
      honor.year === 2024 && honor.award_type === 'Spiel des Jahres'
    );
    
    if (has2024SpielHonors) {
      const cleanedHonors = game.honors.filter(honor => 
        !(honor.year === 2024 && honor.award_type === 'Spiel des Jahres')
      );
      
      const { error: updateError } = await supabase
        .from('games')
        .update({ honors: cleanedHonors })
        .eq('bgg_id', game.bgg_id);
      
      if (updateError) {
        console.error(`Error cleaning ${game.name}:`, updateError);
      } else {
        console.log(`✓ Cleaned 2024 Spiel honors from: ${game.name}`);
      }
    }
  }
  
  // Step 2: Manually add Sky Team as winner (we know it exists with BGG ID 373106)
  console.log('\nStep 2: Adding Sky Team as 2024 Spiel des Jahres winner...');
  
  const { data: skyTeam, error: skyError } = await supabase
    .from('games')
    .select('bgg_id, name, honors')
    .eq('bgg_id', 373106)
    .single();
  
  if (skyError) {
    console.error('Sky Team not found:', skyError);
  } else {
    const winnerHonor = {
      name: "2024 Spiel des Jahres Winner",
      year: 2024,
      category: "Winner",
      award_type: "Spiel des Jahres",
      description: "Winner of the 2024 Spiel des Jahres award"
    };
    
    const nomineeHonor = {
      name: "2024 Spiel des Jahres Nominee",
      year: 2024,
      category: "Nominee", 
      award_type: "Spiel des Jahres",
      description: "Nominee for the 2024 Spiel des Jahres award"
    };
    
    const updatedHonors = [...(skyTeam.honors || []), winnerHonor, nomineeHonor];
    
    const { error: updateError } = await supabase
      .from('games')
      .update({ honors: updatedHonors })
      .eq('bgg_id', 373106);
    
    if (updateError) {
      console.error('Error updating Sky Team:', updateError);
    } else {
      console.log(`✓ Updated Sky Team with winner and nominee honors`);
    }
  }
  
  console.log('\n=== MANUAL FIX COMPLETE ===');
  console.log('Now only Sky Team should have 2024 Spiel des Jahres honors.');
  console.log('To add the other nominees and recommended games, we need their correct BGG IDs.');
  
  // Step 3: Verify the fix
  console.log('\nStep 3: Verifying 2024 data...');
  const { data: verifyGames, error: verifyError } = await supabase
    .from('games')
    .select('name, bgg_id, honors')
    .not('honors', 'eq', '[]');
  
  if (!verifyError) {
    const spiel2024 = [];
    verifyGames.forEach(game => {
      const honors2024 = game.honors.filter(h => 
        h.year === 2024 && h.award_type === 'Spiel des Jahres'
      );
      if (honors2024.length > 0) {
        spiel2024.push({
          name: game.name,
          bgg_id: game.bgg_id,
          honors: honors2024
        });
      }
    });
    
    console.log('\nCurrent 2024 Spiel des Jahres data after fix:');
    spiel2024.forEach(game => {
      console.log(`${game.name} (BGG: ${game.bgg_id})`);
      game.honors.forEach(h => {
        console.log(`  - ${h.category}`);
      });
    });
  }
}

// Run the manual fix
if (require.main === module) {
  manualFix2024SpielDesJahres()
    .then(() => {
      console.log('\nManual fix completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Manual fix failed:', error);
      process.exit(1);
    });
}

module.exports = { manualFix2024SpielDesJahres };
