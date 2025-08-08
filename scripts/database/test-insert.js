#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testDatabaseInsert() {
  console.log('🧪 Testing database insert directly...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, serviceKey);
  
  try {
    // Test game object like what our parser creates
    const testGame = {
      bgg_id: 999999, // Use a test ID that won't conflict
      name: 'Test Game for Summary',
      year_published: 2024,
      image_url: 'https://example.com/image.jpg',
      thumbnail_url: 'https://example.com/thumb.jpg',
      description: 'This is a test game description. It has multiple sentences for testing summary extraction.',
      summary: 'This is a test game description.',
      categories: ['Strategy', 'Test'],
      mechanics: ['Testing', 'Validation'],
      min_players: 2,
      max_players: 4,
      playtime_minutes: 60,
      publisher: 'Test Publisher',
      rank: 500,
      rating: 7.5,
      num_ratings: 100,
      cached_at: new Date().toISOString()
    };
    
    console.log('📋 Test game object:', JSON.stringify(testGame, null, 2));
    
    // Try to insert/upsert
    console.log('💾 Attempting upsert...');
    const { data, error } = await supabase
      .from('games')
      .upsert(testGame, {
        onConflict: 'bgg_id',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error('❌ Insert error:', error);
      console.log('🔍 Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Insert successful!');
      console.log('📊 Inserted data:', data);
      
      // Clean up test data
      console.log('🧹 Cleaning up test data...');
      await supabase
        .from('games')
        .delete()
        .eq('bgg_id', 999999);
      console.log('✅ Test data cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testDatabaseInsert();
