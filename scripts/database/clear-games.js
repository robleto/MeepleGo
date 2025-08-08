#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function clearGamesTable() {
  console.log('🧹 Clearing games table for fresh import...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, serviceKey);
  
  try {
    // Get current count
    const { count: beforeCount } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Current games in table: ${beforeCount}`);
    
    if (beforeCount === 0) {
      console.log('✅ Table is already empty');
      return;
    }
    
    // Clear the table
    console.log('🗑️ Deleting all games...');
    const { error } = await supabase
      .from('games')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (error) {
      console.error('❌ Error clearing table:', error);
    } else {
      console.log('✅ Games table cleared successfully');
      
      // Verify
      const { count: afterCount } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 Games remaining: ${afterCount}`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

clearGamesTable();
