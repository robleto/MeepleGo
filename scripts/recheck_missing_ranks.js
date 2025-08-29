#!/usr/bin/env node
/**
 * Re-check games still missing a BGG rank (rank IS NULL, bgg_id NOT NULL).
 * Fetches current rank from BGG and updates if now available.
 * Use sparingly (BGG rate limits). Default: gentle single-thread with 2-4s delay.
 *
 * Options:
 *  --limit <n>             Limit number of games processed
 *  --concurrency <n>       Parallel fetch concurrency (default 1; keep low to respect rate limits)
 *  --delay-min <ms>        Minimum delay between requests per worker (default 2000)
 *  --delay-max <ms>        Maximum additional jitter (default 2000)
 *  --since-days <d>        Only consider games created within last <d> days (optional)
 *  --dry-run               Do not write updates, just report potential changes
 *  --test                  Shortcut for --limit 10 and more verbose logging
 *  --order <field>         Order base selection (bgg_id|id, default bgg_id)
 */

const dotenv = require('dotenv')
dotenv.config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
  process.exit(1)
}

const args = process.argv.slice(2)
const getArg = (key, def = null) => {
  const i = args.indexOf(key)
  return i !== -1 && args[i + 1] ? args[i + 1] : def
}
const has = (key) => args.includes(key)

const testMode = has('--test')
const limit = testMode ? 10 : (getArg('--limit') ? parseInt(getArg('--limit'), 10) : null)
const concurrency = parseInt(getArg('--concurrency', '1'), 10)
const delayMin = parseInt(getArg('--delay-min', '2000'), 10)
const delayMax = parseInt(getArg('--delay-max', '2000'), 10)
const sinceDays = getArg('--since-days') ? parseInt(getArg('--since-days'), 10) : null
const dryRun = has('--dry-run')
const orderField = ['bgg_id','id'].includes(getArg('--order','bgg_id')) ? getArg('--order','bgg_id') : 'bgg_id'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

let processed = 0
let updated = 0
let skipped = 0
let unranked = 0
let errors = 0
const start = Date.now()

async function fetchMissingGames(batchSize = 500) {
  let q = supabase
    .from('games')
    .select('id,bgg_id,name,created_at', { count: 'exact' })
    .is('rank', null)
    .not('bgg_id', 'is', null)
    .order(orderField, { ascending: true })
    .limit(batchSize)

  if (sinceDays) {
    const cutoff = new Date(Date.now() - sinceDays * 86400_000).toISOString()
    q = q.gte('created_at', cutoff)
  }

  const { data, error } = await q
  if (error) throw error
  return data || []
}

async function fetchRank(bggId, attempt = 0) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&type=boardgame&stats=1`
  const res = await fetch(url)
  if (res.status === 429) {
    const wait = Math.min(30000, 4000 + attempt * 3000)
    console.log(`⏳ 429 rate limited (BGG ${bggId}) waiting ${wait/1000}s`)
    await new Promise(r=>setTimeout(r, wait))
    return fetchRank(bggId, attempt+1)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()
  if (!xml.includes('<item')) return 'NOT_FOUND'
  const m = xml.match(/<rank[^>]+name="boardgame"[^>]+value="(\d+)"/)
  return m ? parseInt(m[1],10) : 'UNRANKED'
}

async function updateRank(gameId, rank) {
  if (dryRun) return true
  const { error } = await supabase
    .from('games')
    .update({ rank: rank })
    .eq('id', gameId)
  if (error) throw new Error(error.message)
  return true
}

async function worker(id, queue) {
  while (true) {
    const game = queue.shift()
    if (!game) break
    processed++
    try {
      const rank = await fetchRank(game.bgg_id)
      if (rank === 'NOT_FOUND') {
        skipped++
        console.log(`[${id}] ❓ ${game.name} (bgg:${game.bgg_id}) not found`)
      } else if (rank === 'UNRANKED') {
        unranked++
        console.log(`[${id}] ↕️  ${game.name} (bgg:${game.bgg_id}) still unranked`)
      } else {
        await updateRank(game.id, rank)
        updated++
        console.log(`[${id}] ✅ #${rank} ${game.name}`)
      }
    } catch (e) {
      errors++
      console.log(`[${id}] ❌ ${game.name} (${game.bgg_id}) ${e.message}`)
    }
    const jitter = delayMin + Math.random() * delayMax
    await new Promise(r=>setTimeout(r, jitter))
    if (limit && processed >= limit) break
  }
}

async function run() {
  console.log('🔁 Rechecking missing ranks...')
  console.log(`Options: limit=${limit||'∞'} concurrency=${concurrency} delay=${delayMin}-${delayMax}ms order=${orderField} sinceDays=${sinceDays||'ALL'} dryRun=${dryRun}`)
  const batch = await fetchMissingGames(limit || 500)
  if (!batch.length) {
    console.log('🎉 No games need re-check (all ranked or missing bgg_id).')
    return
  }
  console.log(`Found ${batch.length} candidate games (processing up to limit).`)
  const queue = batch.slice(0, limit || batch.length)
  const workers = []
  for (let i=0;i<concurrency;i++) workers.push(worker(i+1, queue))
  await Promise.all(workers)
  const elapsed = (Date.now()-start)/1000
  console.log('\n📊 Summary:')
  console.log(`  Processed: ${processed}`)
  console.log(`  Updated:   ${updated}`)
  console.log(`  Unranked:  ${unranked}`)
  console.log(`  NotFound:  ${skipped}`)
  console.log(`  Errors:    ${errors}`)
  console.log(`  Rate:      ${(processed/elapsed).toFixed(2)} games/sec`)
  if (dryRun) console.log('🛈 Dry-run mode (no DB writes).')
}

run().catch(e=>{ console.error('Fatal:', e); process.exit(1) })
