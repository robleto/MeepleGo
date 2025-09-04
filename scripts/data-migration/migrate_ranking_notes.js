#!/usr/bin/env node
/**
 * One-off helper to migrate legacy rankings.notes -> rankings.public_note (if new field exists and public_note is null).
 * Safe to run multiple times (idempotent).
 */
const dotenv = require('dotenv')
dotenv.config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars.')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  console.log('🔄 Migrating legacy notes -> public_note ...')
  // Fetch rankings where notes not null and public_note null
  const { data, error } = await supabase
    .from('rankings')
    .select('id, user_id, game_id, notes, public_note')
    .is('public_note', null)
    .not('notes', 'is', null)
    .limit(10000)

  if (error) throw error
  if (!data || !data.length) {
    console.log('✅ Nothing to migrate.')
    return
  }

  let migrated = 0
  for (const row of data) {
    const { error: upErr } = await supabase
      .from('rankings')
      .update({ public_note: row.notes })
      .eq('id', row.id)
    if (upErr) {
      console.log(`❌ Failed ${row.id}: ${upErr.message}`)
    } else migrated++
  }

  console.log(`✅ Migration complete. Migrated ${migrated} rows.`)
}

run().catch(e=>{ console.error('💥 Fatal:', e); process.exit(1) })
