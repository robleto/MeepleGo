#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addSummaryColumn() {
  console.log('🔧 Adding summary column to games table...')
  
  try {
    // First, let's manually add the column using direct SQL execution
    // We'll use a raw query approach
    const { data, error } = await supabase.rpc('sql', {
      query: 'ALTER TABLE public.games ADD COLUMN IF NOT EXISTS summary text NULL;'
    })
    
    if (error) {
      console.log('⚠️ Could not use RPC, trying alternative approach...')
      
      // Try using a simple upsert to test if column exists
      const testGame = {
        bgg_id: 999999,
        name: 'Test Game Summary',
        summary: 'This is a test summary.',
        cached_at: new Date().toISOString()
      }
      
      const { data: testData, error: testError } = await supabase
        .from('games')
        .upsert(testGame, { onConflict: 'bgg_id' })
        .select()
      
      if (testError) {
        if (testError.message.includes("summary")) {
          console.log('❌ Summary column does not exist. Manual schema update needed.')
          console.log('🔧 Please add this to your database schema:')
          console.log('   ALTER TABLE public.games ADD COLUMN summary text NULL;')
        } else {
          console.error('❌ Unexpected error:', testError)
        }
      } else {
        console.log('✅ Summary column exists and working!')
        // Clean up test data
        await supabase.from('games').delete().eq('bgg_id', 999999)
      }
    } else {
      console.log('✅ Summary column added via RPC')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addSummaryColumn()
