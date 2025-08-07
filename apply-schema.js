#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applySchema() {
  console.log('📋 Reading schema file...')
  
  try {
    const schemaSQL = fs.readFileSync('./supabase/schema.sql', 'utf8')
    console.log('✅ Schema file loaded successfully')
    
    console.log('🚀 Applying schema to database...')
    
    // Split the schema into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        })
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} warning: ${error.message}`)
          // Some errors are expected (like "already exists")
          if (!error.message.includes('already exists')) {
            errorCount++
          }
        } else {
          successCount++
        }
      } catch (err) {
        console.log(`❌ Statement ${i + 1} failed: ${err.message}`)
        errorCount++
      }
    }
    
    console.log(`\n📊 Results: ${successCount} successful, ${errorCount} errors`)
    
    // Test if tables were created
    console.log('\n🔍 Verifying table creation...')
    const { data, error } = await supabase
      .from('games')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ Games table still not accessible:', error.message)
      console.log('\n💡 You may need to run the schema manually in the Supabase SQL Editor')
      console.log('📋 Schema file location: ./supabase/schema.sql')
      console.log('🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/dsqceuerzoeotrcatxvb/sql')
    } else {
      console.log('✅ Schema applied successfully! Tables are now accessible.')
    }
    
  } catch (err) {
    console.error('❌ Failed to apply schema:', err.message)
    console.log('\n💡 Manual steps:')
    console.log('1. Go to https://supabase.com/dashboard/project/dsqceuerzoeotrcatxvb/sql')
    console.log('2. Copy and paste the contents of ./supabase/schema.sql')
    console.log('3. Run the SQL to create all tables')
  }
}

applySchema()
