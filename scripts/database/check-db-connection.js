#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkDatabase() {
  console.log('🔍 Checking database connection and schema...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Expected: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test basic connection
    console.log('📡 Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('games')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ Connection error:', testError.message);
      return;
    }
    
    console.log(`✅ Connected! Games table has ${testData?.[0]?.count || 0} rows`);
    
    // Check if summary column exists by trying to select it
    console.log('🏗️ Checking for summary column...');
    const { data: schemaTest, error: schemaError } = await supabase
      .from('games')
      .select('bgg_id, name, summary')
      .limit(1);
    
    if (schemaError) {
      if (schemaError.message.includes('column "summary" does not exist')) {
        console.log('❌ Summary column does not exist in database');
        console.log('🔧 Need to run: ALTER TABLE games ADD COLUMN summary text;');
      } else {
        console.error('❌ Schema check error:', schemaError.message);
      }
    } else {
      console.log('✅ Summary column exists!');
      if (schemaTest && schemaTest.length > 0) {
        console.log('📊 Sample data:', schemaTest[0]);
      }
    }
    
    // Show table info
    console.log('\n📋 Games table info:');
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .limit(3);
      
    if (!gamesError && games) {
      console.log(`Found ${games.length} games (showing first 3):`);
      games.forEach(game => {
        console.log(`  - ${game.name} (${game.year_published || 'Unknown year'})`);
        console.log(`    BGG ID: ${game.bgg_id}, Summary: ${game.summary ? '✅' : '❌'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkDatabase();
