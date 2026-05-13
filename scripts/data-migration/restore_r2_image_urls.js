#!/usr/bin/env node

/*
 * Reconstruct R2 image_url values for every games row from the canonical
 * pattern: https://<R2_BUCKET_HOST>/games/<game.id>.jpg
 *
 * Use after the audit script falsely nulled URLs due to rate-limiting.
 * Sets image_url for all games where it's currently NULL. Existing
 * non-null values (e.g. non-R2 sources) are left alone.
 *
 * GameImage handles 404s / missing files gracefully on the client, so
 * setting the URL for every game is safe even when the file doesn't
 * exist in R2 — the fallback initials placeholder renders instead.
 */

const dotenv = require('dotenv')
const { createClient } = require('@supabase/supabase-js')

dotenv.config({ path: '.env' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Allow override via env, default to the bucket we've been using.
const R2_HOST =
  process.env.R2_PUBLIC_HOST ||
  'pub-b37a6979556a4dc182bda57e5f8ffeb7.r2.dev'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function r2Url(gameId) {
  return `https://${R2_HOST}/games/${gameId}.jpg`
}

async function fetchAllGameIds() {
  const ids = []
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('games')
      .select('id, image_url')
      .is('image_url', null)
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    ids.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return ids
}

async function main() {
  console.log('🔄 Restoring R2 image URLs for games with null image_url...')
  console.log(`   Using bucket host: ${R2_HOST}`)

  const games = await fetchAllGameIds()
  console.log(`   • ${games.length} games to restore`)

  if (games.length === 0) {
    console.log('✨ Nothing to do.')
    return
  }

  let updated = 0
  let failed = 0
  const BATCH = 500
  for (let i = 0; i < games.length; i += BATCH) {
    const batch = games.slice(i, i + BATCH)
    // Update each row individually; cheap enough at this scale and avoids
    // any cross-row constraint friction.
    const results = await Promise.all(
      batch.map((g) =>
        supabase.from('games').update({ image_url: r2Url(g.id) }).eq('id', g.id)
      )
    )
    for (const r of results) {
      if (r.error) {
        failed++
        if (failed < 5) console.warn('  ⚠️', r.error.message)
      } else updated++
    }
    process.stdout.write(`\r   ${Math.min(i + BATCH, games.length)}/${games.length}`)
  }
  process.stdout.write('\n')

  console.log('\n📊 Summary:')
  console.log(`  • Updated: ${updated}`)
  console.log(`  • Failed:  ${failed}`)
  console.log(
    '\nIf the actual R2 file is missing for some games, GameImage will catch\n' +
      'that on the client (onError + zero-dimension check) and render the\n' +
      'initials fallback. No further action needed.'
  )
}

main().catch((e) => {
  console.error('💥 Fatal:', e)
  process.exit(1)
})
