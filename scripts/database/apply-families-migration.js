#!/usr/bin/env node

/**
 * Apply database migration to add families column
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
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

async function applyMigration() {
  console.log('🔧 Applying families column migration...');
  
  try {
    // Read the migration SQL
    const sqlPath = path.join(__dirname, '../database/add-families-column.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Try direct query if RPC fails
        const { error: directError } = await supabase
          .from('games')
          .select('*')
          .limit(0); // This will fail if column doesn't exist, success if it does
          
        if (statement.includes('ADD COLUMN families') && directError && directError.message.includes('families')) {
          console.log('✅ Families column already exists, skipping...');
          continue;
        }
        
        throw error;
      }
      
      console.log(`✅ Statement ${i + 1} executed successfully`);
    }
    
    // Verify the migration worked
    console.log('🔍 Verifying migration...');
    const { data, error } = await supabase
      .from('games')
      .select('families')
      .limit(1);
    
    if (error) {
      throw new Error(`Migration verification failed: ${error.message}`);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 The families column has been added to the games table');
    console.log('🚀 You can now run the family import script');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 Alternative approach:');
    console.error('   1. Open your Supabase dashboard');
    console.error('   2. Go to the SQL Editor');
    console.error('   3. Run the contents of scripts/database/add-families-column.sql');
    process.exit(1);
  }
}

if (require.main === module) {
  applyMigration();
}
