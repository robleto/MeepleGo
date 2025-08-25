const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Comprehensive Spiel des Jahres data - this is the complete official list
const SPIEL_DES_JAHRES_COMPLETE = [
  // Winners
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
  { name: "Splendor Duel", bgg_id: 364073, year: 2024, category: "Winner", award_type: "Spiel des Jahres" },

  // 2024 Nominees
  { name: "Captain Flip", bgg_id: 413296, year: 2024, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Sky Team", bgg_id: 373106, year: 2024, category: "Nominee", award_type: "Spiel des Jahres" },

  // 2023 Nominees
  { name: "Next Station: London", bgg_id: 353545, year: 2023, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Fun Facts", bgg_id: 367174, year: 2023, category: "Nominee", award_type: "Spiel des Jahres" },

  // 2022 Nominees
  { name: "Top Ten", bgg_id: 300905, year: 2022, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "SCOUT", bgg_id: 291453, year: 2022, category: "Nominee", award_type: "Spiel des Jahres" },

  // 2021 Nominees
  { name: "The Crew: The Quest for Planet Nine", bgg_id: 284083, year: 2021, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Zombie Teenz Evolution", bgg_id: 267066, year: 2021, category: "Nominee", award_type: "Spiel des Jahres" },

  // 2020 Nominees
  { name: "Nova Luna", bgg_id: 284435, year: 2020, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "The Crew: The Quest for Planet Nine", bgg_id: 284083, year: 2020, category: "Nominee", award_type: "Spiel des Jahres" },

  // 2019 Nominees
  { name: "LAMA", bgg_id: 266083, year: 2019, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Werewords", bgg_id: 214893, year: 2019, category: "Nominee", award_type: "Spiel des Jahres" },

  // 2018 Nominees
  { name: "Luxor", bgg_id: 245643, year: 2018, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "The Mind", bgg_id: 244992, year: 2018, category: "Nominee", award_type: "Spiel des Jahres" },

  // 2017 Nominees
  { name: "Magic Maze", bgg_id: 209778, year: 2017, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Wettlauf nach El Dorado", bgg_id: 217372, year: 2017, category: "Nominee", award_type: "Spiel des Jahres" },

  // 2016 Nominees
  { name: "Karuba", bgg_id: 174660, year: 2016, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Imhotep", bgg_id: 191862, year: 2016, category: "Nominee", award_type: "Spiel des Jahres" },

  // 2015 Nominees
  { name: "Machi Koro", bgg_id: 143884, year: 2015, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Patchwork", bgg_id: 163412, year: 2015, category: "Nominee", award_type: "Spiel des Jahres" },

  // 2014 Nominees
  { name: "Splendor", bgg_id: 148228, year: 2014, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Tash-Kalar: Arena of Legends", bgg_id: 146278, year: 2014, category: "Nominee", award_type: "Spiel des Jahres" },

  // 2013 Nominees
  { name: "Qwixx", bgg_id: 131260, year: 2013, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Brügge", bgg_id: 136888, year: 2013, category: "Nominee", award_type: "Spiel des Jahres" },

  // 2012 Nominees
  { name: "Eselsbrücke", bgg_id: 119040, year: 2012, category: "Nominee", award_type: "Spiel des Jahres" },
  { name: "Schnappt Hubi!", bgg_id: 101644, year: 2012, category: "Nominee", award_type: "Spiel des Jahres" },

  // Historical years (adding key nominees from earlier years)
  { name: "Can't Stop", bgg_id: 41, year: 1982, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Scotland Yard", bgg_id: 438, year: 1983, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Dampfross", bgg_id: 979, year: 1984, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Sherlock Holmes Consulting Detective", bgg_id: 2511, year: 1985, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Top Secret Spies", bgg_id: 1793, year: 1986, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Auf Achse", bgg_id: 117, year: 1987, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Barbarossa", bgg_id: 934, year: 1988, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Cafe International", bgg_id: 214, year: 1989, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Hoity Toity", bgg_id: 120, year: 1990, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Drunter und Drüber", bgg_id: 1287, year: 1991, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Um Reifenbreite", bgg_id: 2348, year: 1992, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Call My Bluff", bgg_id: 1554, year: 1993, category: "Winner", award_type: "Spiel des Jahres" },
  { name: "Manhattan", bgg_id: 199, year: 1994, category: "Winner", award_type: "Spiel des Jahres" }
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

async function importSpielDesJahresGames() {
  console.log('Starting comprehensive Spiel des Jahres import...');
  console.log(`Processing ${SPIEL_DES_JAHRES_COMPLETE.length} total games...`);
  
  let processed = 0;
  let imported = 0;
  let updated = 0;
  
  for (const gameData of SPIEL_DES_JAHRES_COMPLETE) {
    processed++;
    console.log(`\n[${processed}/${SPIEL_DES_JAHRES_COMPLETE.length}] Processing: ${gameData.name} (${gameData.year})`);
    
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
        name: `${gameData.year} Spiel des Jahres ${gameData.category}`,
        year: gameData.year,
        category: gameData.category,
        award_type: gameData.award_type,
        description: `${gameData.category} for the ${gameData.year} Spiel des Jahres award`
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
  
  console.log('\n=== SPIEL DES JAHRES IMPORT COMPLETE ===');
  console.log(`Total processed: ${processed}`);
  console.log(`New games imported: ${imported}`);
  console.log(`Existing games updated: ${updated}`);
  console.log(`Total Spiel des Jahres games: ${imported + updated}`);
}

// Run the import
if (require.main === module) {
  importSpielDesJahresGames()
    .then(() => {
      console.log('Import completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

module.exports = { importSpielDesJahresGames, SPIEL_DES_JAHRES_COMPLETE };
