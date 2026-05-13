#!/usr/bin/env node

/*
 * List the actual contents of R2 and relink games.image_url to the keys
 * that exist.
 *
 * Two phases:
 *   1. LIST every object in the bucket (paginated) → build an in-memory set
 *      of available keys.
 *   2. For each game, look for the best matching key, in this order:
 *        - games/<game.id>.{jpg|jpeg|png|webp}
 *        - games/<bgg_id>.{jpg|jpeg|png|webp}
 *        - any key whose basename contains <game.id> or <bgg_id>
 *      and UPDATE image_url to point at the public URL for that key.
 *      If nothing matches, NULL out image_url so the GameImage fallback
 *      renders.
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

const {
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  R2_ENDPOINT,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET = 'meeplego-images',
  R2_PUBLIC_BASE,
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
  throw new Error('Missing Supabase env vars')
if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_BASE)
  throw new Error('Missing R2 env vars')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const r2 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

const EXTS = ['jpg', 'jpeg', 'png', 'webp']

async function listAllKeys() {
  console.log(`📦 Listing all objects in R2 bucket "${R2_BUCKET}"...`)
  const keys = []
  let token = undefined
  let page = 0
  while (true) {
    const res = await r2.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        ContinuationToken: token,
        MaxKeys: 1000,
      })
    )
    for (const obj of res.Contents || []) keys.push(obj.Key)
    page++
    process.stdout.write(`\r   page ${page}, ${keys.length} keys so far`)
    if (!res.IsTruncated) break
    token = res.NextContinuationToken
  }
  process.stdout.write('\n')
  return keys
}

function summarizeKeys(keys) {
  const prefixes = new Map()
  const exts = new Map()
  for (const k of keys) {
    const slash = k.indexOf('/')
    const prefix = slash >= 0 ? k.slice(0, slash) : '(root)'
    prefixes.set(prefix, (prefixes.get(prefix) || 0) + 1)
    const dot = k.lastIndexOf('.')
    const ext = dot >= 0 ? k.slice(dot + 1).toLowerCase() : '(none)'
    exts.set(ext, (exts.get(ext) || 0) + 1)
  }
  console.log('\n🔎 Bucket summary:')
  console.log('   • Top prefixes:')
  for (const [p, n] of [...prefixes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10))
    console.log(`       ${p}/  → ${n}`)
  console.log('   • Extensions:')
  for (const [e, n] of [...exts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8))
    console.log(`       .${e}   → ${n}`)
  console.log('   • Sample keys:')
  for (const k of keys.slice(0, 5)) console.log(`       ${k}`)
}

async function fetchAllGames() {
  const rows = []
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('games')
      .select('id, bgg_id, image_url')
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return rows
}

function buildKeyIndex(keys) {
  // For each key, map several IDs to it so we can look up by game.id,
  // bgg_id, or basename match.
  const byBasename = new Map() // "uuid_or_bggid" → fullKey
  for (const k of keys) {
    const filename = k.split('/').pop() || k
    const dot = filename.lastIndexOf('.')
    const stem = dot >= 0 ? filename.slice(0, dot) : filename
    if (!byBasename.has(stem)) byBasename.set(stem, k)
  }
  return { byBasename }
}

function pickKeyForGame(game, index) {
  // Try exact stem match on game.id first
  const byGameId = index.byBasename.get(game.id)
  if (byGameId) return byGameId
  // Then bgg_id (number-as-string)
  if (game.bgg_id != null) {
    const byBgg = index.byBasename.get(String(game.bgg_id))
    if (byBgg) return byBgg
  }
  return null
}

async function main() {
  const keys = await listAllKeys()
  console.log(`✅ ${keys.length} total objects`)
  summarizeKeys(keys)

  const games = await fetchAllGames()
  console.log(`\n🎲 ${games.length} games to evaluate`)

  const index = buildKeyIndex(keys)

  const toUpdate = []
  const toNull = []
  for (const g of games) {
    const key = pickKeyForGame(g, index)
    if (key) {
      const url = `${R2_PUBLIC_BASE.replace(/\/$/, '')}/${key}`
      if (g.image_url !== url) toUpdate.push({ id: g.id, url })
    } else {
      if (g.image_url != null) toNull.push(g.id)
    }
  }
  console.log(`\n📝 Plan:`)
  console.log(`   • Repoint to existing R2 key: ${toUpdate.length}`)
  console.log(`   • NULL out (no R2 key found): ${toNull.length}`)
  console.log(`   • Unchanged: ${games.length - toUpdate.length - toNull.length}`)

  if (toUpdate.length === 0 && toNull.length === 0) {
    console.log('✨ Nothing to change.')
    return
  }

  const BATCH = 500
  console.log('\n💾 Applying updates...')
  let updated = 0
  for (let i = 0; i < toUpdate.length; i += BATCH) {
    const batch = toUpdate.slice(i, i + BATCH)
    const results = await Promise.all(
      batch.map((u) => supabase.from('games').update({ image_url: u.url }).eq('id', u.id))
    )
    for (const r of results) if (!r.error) updated++
    process.stdout.write(`\r   updates: ${Math.min(i + BATCH, toUpdate.length)}/${toUpdate.length}`)
  }
  process.stdout.write('\n')

  let nulled = 0
  for (let i = 0; i < toNull.length; i += BATCH) {
    const batch = toNull.slice(i, i + BATCH)
    const { error } = await supabase
      .from('games')
      .update({ image_url: null })
      .in('id', batch)
    if (!error) nulled += batch.length
    process.stdout.write(`\r   nulls: ${Math.min(i + BATCH, toNull.length)}/${toNull.length}`)
  }
  process.stdout.write('\n')

  console.log('\n📊 Done:')
  console.log(`   • Updated:  ${updated}`)
  console.log(`   • Nulled:   ${nulled}`)
}

main().catch((e) => {
  console.error('💥 Fatal:', e)
  process.exit(1)
})
