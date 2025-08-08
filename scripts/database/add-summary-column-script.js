#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function addSummaryColumn() {
  console.log('🔧 Adding summary column to games table...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }
  
  // Use service role key for admin operations
  const supabase = createClient(supabaseUrl, serviceKey);
  
  try {
    console.log('📊 Adding summary column...');
    
    // Add the summary column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE games ADD COLUMN IF NOT EXISTS summary text NULL;`
    });
    
    if (error) {
      console.error('❌ Error adding column:', error.message);
      
      // Try alternative approach with direct SQL
      console.log('🔄 Trying alternative approach...');
      const { data: altData, error: altError } = await supabase
        .from('games')
        .select('summary')
        .limit(1);
        
      if (altError && altError.message.includes('does not exist')) {
        console.log('💡 Column still does not exist. You may need to run this SQL manually:');
        console.log('   ALTER TABLE games ADD COLUMN summary text NULL;');
        console.log('🔗 Go to: https://supabase.com/dashboard/project/dsqceuerzoeotrcatxvb/sql');
      }
    } else {
      console.log('✅ Summary column added successfully!');
      
      // Test the column
      const { data: testData, error: testError } = await supabase
        .from('games')
        .select('bgg_id, summary')
        .limit(1);
        
      if (!testError) {
        console.log('✅ Column is working and accessible');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('💡 Manual SQL needed:');
    console.log('   ALTER TABLE games ADD COLUMN summary text NULL;');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/dsqceuerzoeotrcatxvb/sql');
  }
}

addSummaryColumn();
