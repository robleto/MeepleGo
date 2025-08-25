#!/usr/bin/env ts-node
/*
 * Backfill script: re-infer honor categories (Winner/Nominee/Special) for all games
 * to correct cases where truncated slugs caused misclassification.
 *
 * Safety: Only updates games where at least one honor's inferred category differs
 * from stored category. Adds _originalCategory for traceability inside each honor object.
 */
// Load environment variables (.env.local preferred, fallback to .env)
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
const envLocal = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envLocal)) {
  dotenv.config({ path: envLocal })
} else {
  dotenv.config() // default .env
}
import { createClient } from '@supabase/supabase-js'
import { inferHonorCategory } from '../src/utils/honors'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !serviceKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

interface Honor {
  category: 'Winner' | 'Nominee' | 'Special'
  award_type: string
  year?: number
  slug?: string | null
  title?: string | null
  name?: string | null
  position?: string | null
  result_raw?: string | null
  derived_result?: string | null
  [key: string]: any
}
interface Game { bgg_id: number; honors: Honor[] }

async function ensureLogTable() {
  // Attempt to create log table (idempotent via RPC or raw SQL not available here; using insert test)
  // Rely on a simple insert later; if table missing we inform user.
  // (Optional enhancement: use a SQL migration system.)
}

async function backfill() {
  const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'
  console.log(`🔁 Starting honor category backfill${dryRun ? ' (dry-run)' : ''}...`)
  const pageSize = 1000
  let from = 0
  let totalUpdated = 0
  let totalScanned = 0
  const changeSamples: Array<{ bgg_id: number; changes: number }> = []

  while (true) {
    const { data, error } = await supabase
      .from('games')
      .select('bgg_id, honors')
      .range(from, from + pageSize - 1)

    if (error) {
      console.error('Fetch error:', error)
      break
    }
    if (!data || data.length === 0) break

    for (const game of data as Game[]) {
      totalScanned++
      if (!Array.isArray(game.honors) || game.honors.length === 0) continue

      let mutated = false
      const updatedHonors = game.honors.map(h => {
        const inferred = inferHonorCategory(h)
        if (h.category !== inferred) {
          mutated = true
          return { ...h, _originalCategory: h.category, category: inferred }
        }
        return h
      })

      if (mutated) {
        changeSamples.push({ bgg_id: game.bgg_id, changes: updatedHonors.filter((h,i)=>h!==game.honors[i]).length })
        if (!dryRun) {
          const { error: upErr } = await supabase
            .from('games')
            .update({ honors: updatedHonors })
            .eq('bgg_id', game.bgg_id)
          if (upErr) {
            console.error(`Update failed for game ${game.bgg_id}:`, upErr)
          } else {
            totalUpdated++
            console.log(`✅ Updated game ${game.bgg_id} (reclassified honors)`)
            // Attempt to insert a log entry (requires a table honor_category_migrations with RLS allowing service key)
            await supabase.from('honor_category_migrations').insert({
              game_id: game.bgg_id,
              changed_count: updatedHonors.filter((h,i)=>h!==game.honors[i]).length,
              ran_at: new Date().toISOString()
            })
          }
        }
      }
    }

    if (data.length < pageSize) break
    from += pageSize
  }

  if (dryRun) {
    const affected = changeSamples.length
    console.log(`🔎 Dry-run summary: scanned=${totalScanned} affected=${affected}`)
    console.log('Sample (first 10):', changeSamples.slice(0,10))
  } else {
    console.log(`🎯 Backfill complete. Games updated: ${totalUpdated}`)
  }
}

backfill().catch(e => {
  console.error(e)
  process.exit(1)
})
