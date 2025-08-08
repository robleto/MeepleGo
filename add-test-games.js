const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function addTestGames() {
  console.log('🎮 Adding test games for 2025...');
  
  const testGames = [
    {
      bgg_id: 999001,
      name: 'Test Game Alpha 2025',
      year_published: 2025,
      rating: 8.5,
      rank: 1,
      min_players: 2,
      max_players: 4,
      playtime_minutes: 90,
      description: 'A fantastic test game from 2025'
    },
    {
      bgg_id: 999002,
      name: 'Test Game Beta 2025',
      year_published: 2025,
      rating: 7.8,
      rank: 2,
      min_players: 1,
      max_players: 6,
      playtime_minutes: 60,
      description: 'Another great test game from 2025'
    },
    {
      bgg_id: 999003,
      name: 'Test Game Gamma 2025',
      year_published: 2025,
      rating: 9.2,
      rank: 3,
      min_players: 3,
      max_players: 5,
      playtime_minutes: 120,
      description: 'The best test game from 2025'
    },
    {
      bgg_id: 999004,
      name: 'Test Game Delta 2025',
      year_published: 2025,
      rating: 6.9,
      rank: 4,
      min_players: 2,
      max_players: 8,
      playtime_minutes: 45,
      description: 'A fun party test game from 2025'
    },
    {
      bgg_id: 999005,
      name: 'Test Game Epsilon 2025',
      year_published: 2025,
      rating: 8.1,
      rank: 5,
      min_players: 1,
      max_players: 1,
      playtime_minutes: 30,
      description: 'A solo test game from 2025'
    }
  ];

  for (const game of testGames) {
    console.log(`📝 Adding: ${game.name}`);
    
    const { data, error } = await supabase
      .from('games')
      .upsert(game, { onConflict: 'bgg_id' });
    
    if (error) {
      console.error(`❌ Error adding ${game.name}:`, error);
    } else {
      console.log(`✅ Added: ${game.name}`);
    }
  }
  
  // Check total games from 2025
  const { data: games2025, error: countError } = await supabase
    .from('games')
    .select('name, year_published, rating')
    .eq('year_published', 2025)
    .order('rating', { ascending: false });
    
  if (countError) {
    console.error('❌ Error counting 2025 games:', countError);
  } else {
    console.log(`🎯 Total 2025 games in database: ${games2025.length}`);
    games2025.forEach(game => {
      console.log(`  - ${game.name} (Rating: ${game.rating})`);
    });
  }
}

addTestGames().then(() => {
  console.log('🏁 Test games added successfully!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error:', error);
  process.exit(1);
});
