#!/usr/bin/env node

/*
 * One-time seed: populate public.games with minimal rows extracted from
 * data/honors/enhanced-honors-complete.json. Only (bgg_id, name) are written.
 * Everything else (image_url, year_published, rating, etc.) stays null.
 *
 * Use after schema restore migrations have run. Idempotent on bgg_id —
 * games already present are skipped.
 */

const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const { createClient } = require('@supabase/supabase-js')

dotenv.config({ path: '.env' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error(
    '❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'
  )
  process.exit(1)
}

const supabase = createClient(url, key)

const HONORS_FILE = path.join(
  __dirname,
  '../../data/honors/enhanced-honors-complete.json'
)

const BATCH_SIZE = 500

async function main() {
  console.log('🌱 Seeding games from honors JSON...')
  console.log(`📁 Reading ${HONORS_FILE}`)

  const raw = fs.readFileSync(HONORS_FILE, 'utf8')
  const honors = JSON.parse(raw)
  console.log(`📚 Loaded ${honors.length} honors`)

  // Collect unique (bgg_id, name) pairs. Prefer the first non-empty name we
  // see for any given bggId.
  const unique = new Map()
  let totalRefs = 0
  for (const h of honors) {
    const bgs = Array.isArray(h.boardgames) ? h.boardgames : []
    for (const g of bgs) {
      if (!g || typeof g.bggId !== 'number') continue
      totalRefs++
      if (!unique.has(g.bggId) && g.name) {
        unique.set(g.bggId, String(g.name).trim())
      }
    }
  }
  console.log(
    `🎲 ${unique.size} unique games (${totalRefs} total references) ready to seed`
  )

  // Find which bgg_ids already exist so we don't waste round trips. We can
  // just upsert via ON CONFLICT, but the games table's unique index is a
  // partial index (WHERE bgg_id IS NOT NULL), which PostgREST upsert can't
  // target directly. Manual existence check is simpler and clear.
  const allBggIds = [...unique.keys()]
  const existing = new Set()
  const chunkSize = 1000
  for (let i = 0; i < allBggIds.length; i += chunkSize) {
    const chunk = allBggIds.slice(i, i + chunkSize)
    const { data, error } = await supabase
      .from('games')
      .select('bgg_id')
      .in('bgg_id', chunk)
    if (error) {
      console.error(`❌ Existence check failed at chunk ${i}: ${error.message}`)
      process.exit(1)
    }
    for (const row of data || []) existing.add(row.bgg_id)
  }
  console.log(`📌 ${existing.size} games already in DB, skipping those`)

  const toInsert = []
  for (const [bggId, name] of unique.entries()) {
    if (existing.has(bggId)) continue
    toInsert.push({ bgg_id: bggId, name })
  }
  console.log(`➕ Inserting ${toInsert.length} new games`)

  let inserted = 0
  let failed = 0
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('games').insert(batch)
    if (error) {
      console.error(
        `❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error.message}`
      )
      failed += batch.length
    } else {
      inserted += batch.length
      console.log(
        `  ✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${inserted}/${toInsert.length})`
      )
    }
  }

  console.log('\n📊 Summary:')
  console.log(`  • Unique games in honors: ${unique.size}`)
  console.log(`  • Already in DB: ${existing.size}`)
  console.log(`  • Inserted: ${inserted}`)
  console.log(`  • Failed: ${failed}`)
  console.log(
    '\nNext: re-run `node scripts/populate-industry-awards.js` to link awards to these new game rows.'
  )
}

main().catch((e) => {
  console.error('💥 Fatal:', e)
  process.exit(1)
})
