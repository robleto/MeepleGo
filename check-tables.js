#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTables() {
  console.log('🔍 Checking existing tables...')
  
  try {
    // Try to check what tables exist by attempting to query each one
    const tables = ['games', 'profiles', 'rankings', 'game_lists', 'game_list_items', 'awards']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ Table '${table}' - Error: ${error.message}`)
        } else {
          console.log(`✅ Table '${table}' exists and is accessible`)
        }
      } catch (err) {
        console.log(`❌ Table '${table}' - Exception: ${err.message}`)
      }
    }
  } catch (err) {
    console.error('❌ Failed to check tables:', err.message)
  }
}

checkTables()
