const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// CORRECT 2024 Spiel des Jahres data with verified BGG IDs
const CORRECT_2024_SPIEL = [
  // WINNER (only one)
  { name: "Sky Team", bgg_id: 373106, year: 2024, category: "Winner", award_type: "Spiel des Jahres" },
  
  // NOMINEES (3 total including the winner - Sky Team appears as both)
  { name: "Captain Flip", bgg_id: 401953, year: 2024, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "In the Footsteps of Darwin", bgg_id: 322823, year: 2024, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Sky Team", bgg_id: 373106, year: 2024, category: "Nominee", award_type: "Spiel des Jahres" },
  
  // RECOMMENDED (6 total) - using "Special" category since "Recommended" is not allowed by constraint
  { name: "Harmonies", bgg_id: 367965, year: 2024, category: "Special", award_type: "Spiel des Jahres" },
  { name: "Match 5", bgg_id: 401434, year: 2024, category: "Special", award_type: "Spiel des Jahres" },
  { name: "Phantom Ink", bgg_id: 388571, year: 2024, category: "Special", award_type: "Spiel des Jahres" },
  { name: "Schätz it if you can", bgg_id: 413296, year: 2024, category: "Special", award_type: "Spiel des Jahres" },
  { name: "Trekking Through History", bgg_id: 350928, year: 2024, category: "Special", award_type: "Spiel des Jahres" },
  { name: "Trio", bgg_id: 364438, year: 2024, category: "Special", award_type: "Spiel des Jahres" }
];

async function fetchGameFromBGG(bggId) {
  try {
    const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`);
    const xml = await response.text();
    
    // Parse basic info from XML
    const nameMatch = xml.match(/<name[^>]*type="primary"[^>]*value="([^"]*)"[^>]*>/);
    const yearMatch = xml.match(/<yearpublished[^>]*value="([^"]*)"[^>]*>/);
    const imageMatch = xml.match(/<image>([^<]*)<\/image>/);
    const thumbnailMatch = xml.match(/<thumbnail>([^<]*)<\/thumbnail>/);
    const descMatch = xml.match(/<description>([^<]*)<\/description>/);
    
    return {
      bgg_id: parseInt(bggId),
      name: nameMatch ? nameMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"') : `Game ${bggId}`,
      year_published: yearMatch ? parseInt(yearMatch[1]) : null,
      image_url: imageMatch ? imageMatch[1] : null,
      thumbnail_url: thumbnailMatch ? thumbnailMatch[1] : null,
      description: descMatch ? descMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#10;/g, '\n') : null
    };
  } catch (error) {
    console.error(`Error fetching BGG ID ${bggId}:`, error.message);
    return null;
  }
}

async function fix2024SpielDesJahres() {
  console.log('Fixing 2024 Spiel des Jahres data...');
  
  // First, let's remove all incorrect 2024 Spiel des Jahres honors
  console.log('Step 1: Finding games with incorrect 2024 Spiel des Jahres honors...');
  
  const { data: gamesWithIncorrectHonors, error: fetchError } = await supabase
    .from('games')
    .select('bgg_id, name, honors')
    .not('honors', 'eq', '[]');
  
  if (fetchError) {
    console.error('Error fetching games:', fetchError);
    return;
  }
  
  // Remove incorrect 2024 Spiel des Jahres honors
  for (const game of gamesWithIncorrectHonors) {
    const incorrect2024Honors = game.honors.filter(honor => 
      honor.year === 2024 && honor.award_type === 'Spiel des Jahres'
    );
    
    if (incorrect2024Honors.length > 0) {
      console.log(`Removing incorrect 2024 honors from: ${game.name}`);
      
      // Remove all 2024 Spiel des Jahres honors
      const cleanedHonors = game.honors.filter(honor => 
        !(honor.year === 2024 && honor.award_type === 'Spiel des Jahres')
      );
      
      const { error: updateError } = await supabase
        .from('games')
        .update({ honors: cleanedHonors })
        .eq('bgg_id', game.bgg_id);
      
      if (updateError) {
        console.error(`Error updating ${game.name}:`, updateError);
      } else {
        console.log(`✓ Cleaned honors for ${game.name}`);
      }
    }
  }
  
  console.log('\nStep 2: Adding correct 2024 Spiel des Jahres data...');
  
  let processed = 0;
  let imported = 0;
  let updated = 0;
  
  for (const gameData of CORRECT_2024_SPIEL) {
    processed++;
    console.log(`\n[${processed}/${CORRECT_2024_SPIEL.length}] Processing: ${gameData.name} (${gameData.category})`);
    
    try {
      // Check if game exists
      const { data: existingGame, error: checkError } = await supabase
        .from('games')
        .select('bgg_id, name, honors')
        .eq('bgg_id', gameData.bgg_id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing game:', checkError);
        continue;
      }
      
      const honorData = {
        name: `${gameData.year} Spiel des Jahres ${gameData.category === 'Special' ? 'Recommended' : gameData.category}`,
        year: gameData.year,
        category: gameData.category,
        award_type: gameData.award_type,
        description: `${gameData.category === 'Special' ? 'Recommended' : gameData.category} for the ${gameData.year} Spiel des Jahres award`
      };
      
      if (existingGame) {
        // Game exists, add the correct honor
        const updatedHonors = [...(existingGame.honors || []), honorData];
        
        const { error: updateError } = await supabase
          .from('games')
          .update({ honors: updatedHonors })
          .eq('bgg_id', gameData.bgg_id);
        
        if (updateError) {
          console.error('Error updating game honors:', updateError);
        } else {
          console.log(`✓ Updated honors for existing game: ${existingGame.name}`);
          updated++;
        }
      } else {
        // Game doesn't exist, fetch from BGG and insert
        console.log(`  Fetching game data from BGG...`);
        const bggGame = await fetchGameFromBGG(gameData.bgg_id);
        
        if (bggGame) {
          const newGame = {
            ...bggGame,
            honors: [honorData]
          };
          
          const { error: insertError } = await supabase
            .from('games')
            .insert([newGame]);
          
          if (insertError) {
            console.error('Error inserting new game:', insertError);
          } else {
            console.log(`✓ Imported new game: ${bggGame.name}`);
            imported++;
          }
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`Error processing ${gameData.name}:`, error);
    }
  }
  
  console.log('\n=== 2024 SPIEL DES JAHRES FIX COMPLETE ===');
  console.log(`Total processed: ${processed}`);
  console.log(`New games imported: ${imported}`);
  console.log(`Existing games updated: ${updated}`);
  
  // Verify the results
  console.log('\nStep 3: Verifying correct 2024 data...');
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
    
    console.log('\\nCurrent 2024 Spiel des Jahres data:');
    spiel2024.sort((a, b) => a.name.localeCompare(b.name));
    spiel2024.forEach(game => {
      console.log(`${game.name} (BGG: ${game.bgg_id})`);
      game.honors.forEach(h => {
        console.log(`  - ${h.category}`);
      });
    });
  }
}

// Run the fix
if (require.main === module) {
  fix2024SpielDesJahres()
    .then(() => {
      console.log('\\nFix completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fix2024SpielDesJahres };
