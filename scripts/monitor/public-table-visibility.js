#!/usr/bin/env node
/**
 * Public Table Visibility Monitor
 *
 * Compares anon vs service-role visible row counts for designated public tables.
 * Fails (exit code 1) if a table has rows with the service key but zero (or below
 * a configurable threshold) rows with the anon key, indicating accidental RLS
 * enablement or missing SELECT policy.
 *
 * Usage:
 *   node scripts/monitor/public-table-visibility.js
 *
 * Env (from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anonKey || !serviceKey) {
  console.error('❌ Missing required Supabase env vars. Aborting.')
  process.exit(1)
}

// Tables expected to be publicly readable
const PUBLIC_TABLES = [
  { name: 'games', minAnon: 1 },
  { name: 'awards_cache', minAnon: 1 },
]

function format(n) {
  return typeof n === 'number' ? n.toLocaleString() : '—'
}

async function count(client, table) {
  const { count, error } = await client
    .from(table)
    .select('*', { count: 'exact', head: true })
  if (error) throw new Error(`${table}: ${error.message}`)
  return count || 0
}

;(async () => {
  const anon = createClient(url, anonKey)
  const service = createClient(url, serviceKey)

  let failures = 0
  console.log('🔍 Public table visibility check')
  console.log('Table                        Service   Anon   Status')
  console.log('------------------------------------------------------')

  for (const t of PUBLIC_TABLES) {
    try {
      const [svcCount, anonCount] = await Promise.all([
        count(service, t.name),
        count(anon, t.name),
      ])
      const good = anonCount >= t.minAnon || svcCount === 0
      if (!good) failures++
      console.log(
        `${t.name.padEnd(28)} ${format(svcCount).padStart(8)} ${format(
          anonCount
        ).padStart(7)}  ${good ? '✅' : '❌'}${!good ? ' (invisible to anon)' : ''}`
      )
    } catch (e) {
      failures++
      console.log(`${t.name.padEnd(28)} ERROR    ERROR  ❌ (${e.message})`)
    }
  }

  if (failures > 0) {
    console.error(`\n❌ Visibility check failed (${failures} table(s) problematic).`)
    process.exit(1)
  }

  console.log('\n✅ All public tables visible to anon users.')
})()
