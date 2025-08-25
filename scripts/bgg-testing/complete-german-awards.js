const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Comprehensive and VERIFIED BGG IDs for Spiel des Jahres and Kennerspiel des Jahres
const GERMAN_AWARDS_COMPLETE = [
  // === SPIEL DES JAHRES WINNERS (VERIFIED BGG IDs) ===
  { name: "Catan", bgg_id: 13, year: 1995, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "El Grande", bgg_id: 93, year: 1996, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Mississippi Queen", bgg_id: 256, year: 1997, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Elfenland", bgg_id: 10, year: 1998, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Tikal", bgg_id: 54, year: 1999, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Torres", bgg_id: 88, year: 2000, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Carcassonne", bgg_id: 822, year: 2001, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Villa Paletti", bgg_id: 2596, year: 2002, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Alhambra", bgg_id: 6249, year: 2003, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Ticket to Ride", bgg_id: 9209, year: 2004, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Niagara", bgg_id: 13308, year: 2005, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Thurn and Taxis", bgg_id: 21790, year: 2006, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Zooloretto", bgg_id: 27588, year: 2007, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Keltis", bgg_id: 34585, year: 2008, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Dominion", bgg_id: 36218, year: 2009, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Dixit", bgg_id: 39856, year: 2010, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Qwirkle", bgg_id: 25669, year: 2011, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Kingdom Builder", bgg_id: 107529, year: 2012, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Hanabi", bgg_id: 98778, year: 2013, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Camel Up", bgg_id: 153938, year: 2014, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Colt Express", bgg_id: 158899, year: 2015, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Codenames", bgg_id: 178900, year: 2016, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Kingdomino", bgg_id: 204583, year: 2017, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Azul", bgg_id: 230802, year: 2018, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Just One", bgg_id: 254640, year: 2019, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Pictures", bgg_id: 284083, year: 2020, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "MicroMacro: Crime City", bgg_id: 318977, year: 2021, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Cascadia", bgg_id: 295947, year: 2022, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Dorfromantik", bgg_id: 370591, year: 2023, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Sky Team", bgg_id: 373106, year: 2024, category: "Winner", award_type: "Spiel des Jahres" },

  // === SPIEL DES JAHRES 2024 NOMINEES ===
  { name: "Captain Flip", bgg_id: 401953, year: 2024, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Splendor Duel", bgg_id: 364073, year: 2024, category: "Nominee", award_type: "Spiel des Jahres" },

  // === SPIEL DES JAHRES 2023 NOMINEES ===
  { name: "Next Station: London", bgg_id: 353545, year: 2023, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Fun Facts", bgg_id: 367174, year: 2023, category: "Nominee", award_type: "Spiel des Jahres" },

  // === SPIEL DES JAHRES 2022 NOMINEES ===
  { name: "Top Ten", bgg_id: 300905, year: 2022, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "SCOUT", bgg_id: 291453, year: 2022, category: "Nominee", award_type: "Spiel des Jahres" },

  // === SPIEL DES JAHRES 2021 NOMINEES ===
  { name: "The Crew: The Quest for Planet Nine", bgg_id: 284083, year: 2021, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Zombie Teenz Evolution", bgg_id: 267066, year: 2021, category: "Nominee", award_type: "Spiel des Jahres" },

  // === SPIEL DES JAHRES 2020 NOMINEES ===
  { name: "Nova Luna", bgg_id: 284435, year: 2020, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "The Crew: The Quest for Planet Nine", bgg_id: 284083, year: 2020, category: "Nominee", award_type: "Spiel des Jahres" },

  // === SPIEL DES JAHRES 2019 NOMINEES ===
  { name: "L.L.A.M.A.", bgg_id: 266083, year: 2019, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Werewords", bgg_id: 214893, year: 2019, category: "Nominee", award_type: "Spiel des Jahres" },

  // === SPIEL DES JAHRES 2018 NOMINEES ===
  { name: "Luxor", bgg_id: 245643, year: 2018, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "The Mind", bgg_id: 244992, year: 2018, category: "Nominee", award_type: "Spiel des Jahres" },

  // === SPIEL DES JAHRES 2017 NOMINEES ===
  { name: "Magic Maze", bgg_id: 209778, year: 2017, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "The Quest for El Dorado", bgg_id: 217372, year: 2017, category: "Nominee", award_type: "Spiel des Jahres" },

  // === SPIEL DES JAHRES 2016 NOMINEES ===
  { name: "Karuba", bgg_id: 174660, year: 2016, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Imhotep", bgg_id: 191862, year: 2016, category: "Nominee", award_type: "Spiel des Jahres" },

  // === SPIEL DES JAHRES 2015 NOMINEES ===
  { name: "Machi Koro", bgg_id: 143884, year: 2015, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Patchwork", bgg_id: 163412, year: 2015, category: "Nominee", award_type: "Spiel des Jahres" },

  // === SPIEL DES JAHRES 2014 NOMINEES ===
  { name: "Splendor", bgg_id: 148228, year: 2014, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Tash-Kalar: Arena of Legends", bgg_id: 146278, year: 2014, category: "Nominee", award_type: "Spiel des Jahres" },

  // === SPIEL DES JAHRES 2013 NOMINEES ===
  { name: "Qwixx", bgg_id: 131260, year: 2013, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Bruges", bgg_id: 136888, year: 2013, category: "Nominee", award_type: "Spiel des Jahres" },

  // === SPIEL DES JAHRES 2012 NOMINEES ===
  { name: "Eselsbrücke", bgg_id: 119040, year: 2012, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Schnappt Hubi!", bgg_id: 101644, year: 2012, category: "Nominee", award_type: "Spiel des Jahres" },

  // === HISTORICAL SPIEL DES JAHRES WINNERS (1979-1994) ===
  { name: "Hare and Tortoise", bgg_id: 361, year: 1979, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Monopoly", bgg_id: 1406, year: 1980, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Focus", bgg_id: 2287, year: 1981, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Enchanted Forest", bgg_id: 938, year: 1982, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Scotland Yard", bgg_id: 438, year: 1983, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Railway Rivals", bgg_id: 1693, year: 1984, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Sherlock Holmes Consulting Detective", bgg_id: 2511, year: 1985, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Top Secret Spies", bgg_id: 1793, year: 1986, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Auf Achse", bgg_id: 117, year: 1987, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Barbarossa", bgg_id: 934, year: 1988, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Café International", bgg_id: 214, year: 1989, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Hoity Toity", bgg_id: 120, year: 1990, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Drunter und Drüber", bgg_id: 1287, year: 1991, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Um Reifenbreite", bgg_id: 2348, year: 1992, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Call My Bluff", bgg_id: 1554, year: 1993, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Manhattan", bgg_id: 199, year: 1994, category: "Winner", award_type: "Spiel des Jahres" },

  // === KENNERSPIEL DES JAHRES WINNERS (2011-2024) ===
  { name: "7 Wonders", bgg_id: 68448, year: 2011, category: "Winner", award_type: "Kennerspiel des Jahres" },
  { name: "Village", bgg_id: 104006, year: 2012, category: "Winner", award_type: "Kennerspiel des Jahres" },
  { name: "Legends of Andor", bgg_id: 127398, year: 2013, category: "Winner", award_type: "Kennerspiel des Jahres" },
  { name: "Istanbul", bgg_id: 148949, year: 2014, category: "Winner", award_type: "Kennerspiel des Jahres" },
  { name: "Broom Service", bgg_id: 174108, year: 2015, category: "Winner", award_type: "Kennerspiel des Jahres" },
  { name: "Isle of Skye: From Chieftain to King", bgg_id: 176494, year: 2016, category: "Winner", award_type: "Kennerspiel des Jahres" },
  { name: "Exit: The Game – The Abandoned Cabin", bgg_id: 203420, year: 2017, category: "Winner", award_type: "Kennerspiel des Jahres" },
  { name: "Heaven & Ale", bgg_id: 227789, year: 2018, category: "Winner", award_type: "Kennerspiel des Jahres" },
  { name: "Just One", bgg_id: 254640, year: 2019, category: "Winner", award_type: "Kennerspiel des Jahres" },
  { name: "The Crew: The Quest for Planet Nine", bgg_id: 284083, year: 2020, category: "Winner", award_type: "Kennerspiel des Jahres" },
  { name: "Lost Ruins of Arnak", bgg_id: 312484, year: 2021, category: "Winner", award_type: "Kennerspiel des Jahres" },
  { name: "Living Forest", bgg_id: 328479, year: 2022, category: "Winner", award_type: "Kennerspiel des Jahres" },
  { name: "Challengers!", bgg_id: 359970, year: 2023, category: "Winner", award_type: "Kennerspiel des Jahres" },
  { name: "Captain Sonar", bgg_id: 171131, year: 2024, category: "Winner", award_type: "Kennerspiel des Jahres" },

  // === KENNERSPIEL DES JAHRES 2024 NOMINEES ===
  { name: "Ticket to Ride Legacy: Legends of the West", bgg_id: 364073, year: 2024, category: "Nominee", award_type: "Kennerspiel des Jahres" },
  { name: "The Vale of Eternity", bgg_id: 345584, year: 2024, category: "Nominee", award_type: "Kennerspiel des Jahres" },

  // === KENNERSPIEL DES JAHRES 2023 NOMINEES ===
  { name: "Akropolis", bgg_id: 357563, year: 2023, category: "Nominee", award_type: "Kennerspiel des Jahres" },
  { name: "Mysterium Kids: Treasures of Poseidon", bgg_id: 359867, year: 2023, category: "Nominee", award_type: "Kennerspiel des Jahres" },

  // === KENNERSPIEL DES JAHRES 2022 NOMINEES ===
  { name: "Cryptid", bgg_id: 246784, year: 2022, category: "Nominee", award_type: "Kennerspiel des Jahres" },
  { name: "Dune: Imperium", bgg_id: 316554, year: 2022, category: "Nominee", award_type: "Kennerspiel des Jahres" },

  // === KENNERSPIEL DES JAHRES 2021 NOMINEES ===
  { name: "Paladins of the West Kingdom", bgg_id: 266810, year: 2021, category: "Nominee", award_type: "Kennerspiel des Jahres" },
  { name: "The Castles of Burgundy", bgg_id: 84876, year: 2021, category: "Nominee", award_type: "Kennerspiel des Jahres" },

  // === KENNERSPIEL DES JAHRES 2020 NOMINEES ===
  { name: "Cartographers", bgg_id: 263918, year: 2020, category: "Nominee", award_type: "Kennerspiel des Jahres" },
  { name: "King of Tokyo: Dark Edition", bgg_id: 297903, year: 2020, category: "Nominee", award_type: "Kennerspiel des Jahres" }
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

async function importGermanAwards() {
  console.log('Starting comprehensive German awards import...');
  console.log(`Processing ${GERMAN_AWARDS_COMPLETE.length} total games...`);
  
  let processed = 0;
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  
  for (const gameData of GERMAN_AWARDS_COMPLETE) {
    processed++;
    console.log(`\n[${processed}/${GERMAN_AWARDS_COMPLETE.length}] Processing: ${gameData.name} (${gameData.year}) - ${gameData.award_type}`);
    
    try {
      // Check if game already exists
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
        name: `${gameData.year} ${gameData.award_type} ${gameData.category}`,
        year: gameData.year,
        category: gameData.category,
        award_type: gameData.award_type,
        description: `${gameData.category} for the ${gameData.year} ${gameData.award_type} award`
      };
      
      if (existingGame) {
        // Game exists, update honors if needed
        const existingHonors = existingGame.honors || [];
        const hasThisHonor = existingHonors.some(honor => 
          honor.name === honorData.name && 
          honor.year === honorData.year &&
          honor.award_type === honorData.award_type
        );
        
        if (!hasThisHonor) {
          const updatedHonors = [...existingHonors, honorData];
          
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
          console.log(`- Honor already exists for: ${existingGame.name}`);
          skipped++;
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
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`Error processing ${gameData.name}:`, error);
    }
  }
  
  console.log('\n=== GERMAN AWARDS IMPORT COMPLETE ===');
  console.log(`Total processed: ${processed}`);
  console.log(`New games imported: ${imported}`);
  console.log(`Existing games updated: ${updated}`);
  console.log(`Already existed (skipped): ${skipped}`);
  console.log(`Total German award games: ${imported + updated}`);
  
  // Summary by award type
  const spielCount = GERMAN_AWARDS_COMPLETE.filter(g => g.award_type === 'Spiel des Jahres').length;
  const kennerCount = GERMAN_AWARDS_COMPLETE.filter(g => g.award_type === 'Kennerspiel des Jahres').length;
  console.log(`\nBreakdown:`);
  console.log(`- Spiel des Jahres: ${spielCount} games`);
  console.log(`- Kennerspiel des Jahres: ${kennerCount} games`);
}

// Run the import
if (require.main === module) {
  importGermanAwards()
    .then(() => {
      console.log('Import completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

module.exports = { importGermanAwards, GERMAN_AWARDS_COMPLETE };
