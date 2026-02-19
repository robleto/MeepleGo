#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const migrationPath = path.join(
  process.cwd(),
  'database/migrations/20260208_add_game_source_fields.sql'
)

async function main() {
  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found:', migrationPath)
    process.exit(1)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationPath, 'utf8')
  const statements = sql
    .split(/;\s*\n/)
    .map((stmt) => stmt.trim())
    .filter(Boolean)

  const supabase = createClient(supabaseUrl, supabaseKey)

  for (const stmt of statements) {
    console.log('Applying statement...')
    const { error } = await supabase.rpc('sql', { query: stmt })
    if (error) {
      console.error('Failed to apply statement:', error.message)
      process.exit(1)
    }
  }

  console.log('✅ Migration applied.')
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
