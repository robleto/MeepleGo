#!/usr/bin/env node

/*
 * Populate public.industry_award_games by joining honors JSON →
 * industry_awards (by bgg_honor_id) → games (by bgg_id). Use after
 * populate-industry-awards.js when the awards page shows categories
 * but no winners listed under them.
 *
 * Idempotent: skips (award_id, game_id) pairs that already exist via
 * the unique constraint.
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
const BATCH = 500

async function fetchAllPages(table, columns) {
  const rows = []
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + pageSize - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return rows
}

async function main() {
  console.log('🔗 Linking awards to games...')

  console.log('📥 Loading honors JSON...')
  const honors = JSON.parse(fs.readFileSync(HONORS_FILE, 'utf8'))
  console.log(`   • ${honors.length} honors`)

  console.log('📥 Loading industry_awards (id, bgg_honor_id)...')
  const awards = await fetchAllPages('industry_awards', 'id, bgg_honor_id')
  const awardByHonorId = new Map()
  awards.forEach((a) => {
    if (a.bgg_honor_id) awardByHonorId.set(String(a.bgg_honor_id), a.id)
  })
  console.log(`   • ${awards.length} awards loaded`)

  console.log('📥 Loading games (id, bgg_id, name)...')
  const games = await fetchAllPages('games', 'id, bgg_id, name')
  const gameByBggId = new Map()
  games.forEach((g) => {
    if (typeof g.bgg_id === 'number') gameByBggId.set(g.bgg_id, g)
  })
  console.log(`   • ${games.length} games loaded`)

  console.log('🧮 Building link rows...')
  const toInsert = []
  let missingAward = 0
  let missingGame = 0
  for (const h of honors) {
    const awardId = awardByHonorId.get(String(h.id))
    if (!awardId) {
      missingAward++
      continue
    }
    const bgs = Array.isArray(h.boardgames) ? h.boardgames : []
    for (const g of bgs) {
      if (!g || typeof g.bggId !== 'number') continue
      const game = gameByBggId.get(g.bggId)
      if (!game) {
        missingGame++
        continue
      }
      toInsert.push({
        award_id: awardId,
        game_id: game.id,
        bgg_game_id: g.bggId,
        game_name: g.name || game.name || '',
      })
    }
  }
  console.log(`   • ${toInsert.length} candidate link rows`)
  console.log(`   • ${missingAward} honors with no matching industry_awards row`)
  console.log(`   • ${missingGame} boardgame refs with no matching game row`)

  console.log('💾 Inserting (ignoring conflicts on award_id+game_id)...')
  let ok = 0
  let conflict = 0
  let failed = 0
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH)
    const { error } = await supabase
      .from('industry_award_games')
      .upsert(batch, {
        onConflict: 'award_id,game_id',
        ignoreDuplicates: true,
      })
    if (error) {
      console.error(
        `❌ Batch ${Math.floor(i / BATCH) + 1} (${batch.length} rows) failed: ${error.message}`
      )
      failed += batch.length
    } else {
      ok += batch.length
      process.stdout.write(
        `\r   ${Math.min(i + BATCH, toInsert.length)}/${toInsert.length}`
      )
    }
  }
  process.stdout.write('\n')

  const { count: total } = await supabase
    .from('industry_award_games')
    .select('*', { count: 'exact', head: true })

  console.log('\n📊 Summary:')
  console.log(`  • Sent for upsert: ${ok}`)
  console.log(`  • Failed batches: ${failed}`)
  console.log(`  • Total rows in industry_award_games now: ${total ?? 'n/a'}`)
}

main().catch((e) => {
  console.error('💥 Fatal:', e)
  process.exit(1)
})
