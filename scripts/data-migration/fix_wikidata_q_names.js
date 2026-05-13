#!/usr/bin/env node

/*
 * Fix games whose `name` ended up as a raw Wikidata Q-ID (e.g. "Q125985075").
 *
 * Background: an earlier Wikidata-import pass in this project's history
 * stored `name = gameLabel` from SPARQL. When the entity has no English
 * label, the SPARQL SERVICE wikibase:label resolver falls back to the
 * Q-ID — and that fallback got persisted to the DB.
 *
 * This script:
 *   - SELECTs games where name matches ^Q[0-9]+ and wikidata_id is set
 *   - Calls Wikidata's wbgetentities API in batches of 50 to fetch labels
 *     across en/de/fr/es/it/ja
 *   - UPDATEs name with the best available human label
 *   - If no label exists in any language (truly obscure entity), sets
 *     is_curated = false so the game stops appearing on /games browse
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
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const LANGS = ['en', 'de', 'fr', 'es', 'it', 'ja']
const UA = 'MeepleGo/1.0 (https://meeplego.com; greg.robleto@mfamfunds.com) qname-fix'

async function fetchEntities(qids) {
  const url = new URL('https://www.wikidata.org/w/api.php')
  url.searchParams.set('action', 'wbgetentities')
  url.searchParams.set('ids', qids.join('|'))
  url.searchParams.set('props', 'labels')
  url.searchParams.set('languages', LANGS.join('|'))
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')
  const res = await fetch(url.toString(), { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`Wikidata API HTTP ${res.status}`)
  const data = await res.json()
  return data?.entities ?? {}
}

function pickBestLabel(entity) {
  if (!entity?.labels) return null
  for (const lang of LANGS) {
    const l = entity.labels[lang]?.value
    // Skip labels that are themselves Q-IDs (rare but possible)
    if (l && !/^Q[0-9]+$/.test(l)) return { value: l, lang }
  }
  return null
}

async function main() {
  console.log('🔧 Fixing games with Q-style names...')

  // Paginate through all Q-named rows
  const broken = []
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('games')
      .select('id, bgg_id, wikidata_id, name')
      .filter('name', 'like', 'Q%')
      .not('wikidata_id', 'is', null)
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    // Belt-and-suspenders: only keep rows that actually match the Q-pattern
    const justQ = data.filter((r) => /^Q[0-9]+$/.test(r.name))
    broken.push(...justQ)
    if (data.length < pageSize) break
    from += pageSize
  }
  console.log(`   • ${broken.length} games to fix`)

  if (broken.length === 0) {
    console.log('✨ Nothing to do.')
    return
  }

  let fixed = 0
  let hidden = 0
  let errored = 0
  const BATCH = 50
  for (let i = 0; i < broken.length; i += BATCH) {
    const batch = broken.slice(i, i + BATCH)
    const qids = batch.map((b) => b.wikidata_id).filter(Boolean)
    let entities = {}
    try {
      entities = await fetchEntities(qids)
    } catch (e) {
      console.warn(`  ⚠️ batch ${i / BATCH} fetch failed: ${e.message}`)
      errored += batch.length
      continue
    }
    // Update each row
    const updates = batch.map(async (row) => {
      const ent = entities[row.wikidata_id]
      const best = pickBestLabel(ent)
      if (best) {
        const { error } = await supabase
          .from('games')
          .update({ name: best.value })
          .eq('id', row.id)
        if (error) {
          errored++
          return
        }
        fixed++
        if (fixed <= 10) {
          console.log(`  ✓ ${row.wikidata_id} → "${best.value}" [${best.lang}]`)
        }
      } else {
        // No human label anywhere — hide from /games
        const { error } = await supabase
          .from('games')
          .update({ is_curated: false })
          .eq('id', row.id)
        if (error) {
          errored++
          return
        }
        hidden++
      }
    })
    await Promise.all(updates)
    process.stdout.write(`\r   ${Math.min(i + BATCH, broken.length)}/${broken.length}`)
    // Rate-limit politeness: 100ms between batches
    if (i + BATCH < broken.length) await new Promise((r) => setTimeout(r, 100))
  }
  process.stdout.write('\n')

  console.log('\n📊 Summary:')
  console.log(`  • Found:           ${broken.length}`)
  console.log(`  • Renamed:         ${fixed}`)
  console.log(`  • Hidden (no label anywhere): ${hidden}`)
  console.log(`  • Errored:         ${errored}`)
}

main().catch((e) => {
  console.error('💥 Fatal:', e)
  process.exit(1)
})
