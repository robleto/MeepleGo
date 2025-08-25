#!/usr/bin/env node

/**
 * Add honors column to games table
 * 
 * This script adds a new 'honors' column to the games table to store
 * awards and honors data for each game.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addHonorsColumn() {
  console.log('🚀 Adding honors column to games table...\n');
  
  try {
    // First, check if the column already exists
    console.log('🔍 Checking if honors column already exists...');
    
    const { data: testData, error: testError } = await supabase
      .from('games')
      .select('honors')
      .limit(1);
    
    if (!testError) {
      console.log('✅ Honors column already exists!');
      console.log('   No changes needed.');
      return;
    }
    
    // Check if it's the expected "column does not exist" error
    if (testError.code === '42703' || testError.message.includes('column "honors" does not exist') || testError.message.includes('column games.honors does not exist')) {
      console.log('📝 Honors column does not exist, setup required...');
    } else {
      console.error('❌ Unexpected error checking column:', testError);
      process.exit(1);
    }
    
    console.log('📝 Honors column does not exist, adding it...');
    
    // Since we can't use exec_sql, we'll use individual SQL operations
    console.log('📝 Adding honors column...');
    
    // This approach uses the fact that Supabase client can execute DDL through the REST API
    // We'll create a simple function to test if we can add the column
    
    // Try to select a sample with the new column structure
    // If this fails, the column doesn't exist and we need manual intervention
    console.log('❌ Cannot automatically add column through Supabase client.');
    console.log('');
    console.log('🛠️  Manual setup required:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Run the following SQL:');
    console.log('');
    console.log('   -- Add honors column');
    console.log('   ALTER TABLE games ADD COLUMN IF NOT EXISTS honors JSONB DEFAULT \'[]\'::jsonb;');
    console.log('');
    console.log('   -- Add index for performance');  
    console.log('   CREATE INDEX IF NOT EXISTS idx_games_honors_gin ON games USING GIN (honors);');
    console.log('');
    console.log('   -- Add constraint to ensure it\'s an array');
    console.log('   ALTER TABLE games ADD CONSTRAINT IF NOT EXISTS check_honors_is_array');
    console.log('   CHECK (jsonb_typeof(honors) = \'array\' OR honors IS NULL);');
    console.log('');
    console.log('   4. After running the SQL, re-run this script to verify');
    
    return;
    
    console.log('\n🎉 Please run the SQL commands above, then test the honors import script!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  addHonorsColumn();
}

module.exports = { addHonorsColumn };
