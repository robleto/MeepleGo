#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addGameColumns() {
  console.log('🔧 Adding new columns to games table...')
  
  try {
    // Add designers column
    const { error: designersError } = await supabase.rpc('sql', {
      query: `
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'designers') THEN
            ALTER TABLE public.games ADD COLUMN designers text[] NULL;
          END IF;
        END $$;
      `
    })
    
    if (designersError) {
      console.log('⚠️ Designers column may already exist:', designersError.message)
    } else {
      console.log('✅ Designers column added')
    }

    // Add artists column
    const { error: artistsError } = await supabase.rpc('sql', {
      query: `
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'artists') THEN
            ALTER TABLE public.games ADD COLUMN artists text[] NULL;
          END IF;
        END $$;
      `
    })
    
    if (artistsError) {
      console.log('⚠️ Artists column may already exist:', artistsError.message)
    } else {
      console.log('✅ Artists column added')
    }

    // Add age column
    const { error: ageError } = await supabase.rpc('sql', {
      query: `
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'age') THEN
            ALTER TABLE public.games ADD COLUMN age integer NULL;
          END IF;
        END $$;
      `
    })
    
    if (ageError) {
      console.log('⚠️ Age column may already exist:', ageError.message)
    } else {
      console.log('✅ Age column added')
    }

    // Add weight column
    const { error: weightError } = await supabase.rpc('sql', {
      query: `
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'weight') THEN
            ALTER TABLE public.games ADD COLUMN weight numeric(3,2) NULL;
          END IF;
        END $$;
      `
    })
    
    if (weightError) {
      console.log('⚠️ Weight column may already exist:', weightError.message)
    } else {
      console.log('✅ Weight column added')
    }

    console.log('🎉 All columns processed successfully!')
    
  } catch (error) {
    console.error('❌ Error adding columns:', error)
  }
}

addGameColumns()
