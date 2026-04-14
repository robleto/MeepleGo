import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  R2_PUBLIC_BASE,
  GAMES_TABLE = 'games',
  IMAGE_COLUMN = 'image_url',
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
  throw new Error('Missing Supabase env vars')
if (!R2_PUBLIC_BASE) throw new Error('Missing R2_PUBLIC_BASE')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Matches any public supabase storage URL like:
// https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
const re = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/

async function run() {
  let updated = 0
  let skipped = 0
  let offset = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from(GAMES_TABLE)
      .select(`id, ${IMAGE_COLUMN}`)
      .range(offset, offset + pageSize - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    for (const row of data) {
      const url = row[IMAGE_COLUMN]
      if (!url || typeof url !== 'string') {
        skipped++
        continue
      }

      // already R2
      if (url.includes('.r2.dev/')) {
        skipped++
        continue
      }

      // only handle supabase storage URLs
      if (!url.includes('.supabase.co/storage/v1/object/public/')) {
        skipped++
        continue
      }

      const m = url.match(re)
      if (!m) {
        skipped++
        continue
      }

      const bucket = m[1]
      const path = m[2]

      // We migrated files from game-images bucket into R2 under /games/<path>
      // If you have other buckets, we still map to /games/ and preserve the object path.
      const newUrl = `${R2_PUBLIC_BASE}/games/${path}`

      const { error: uerr } = await supabase
        .from(GAMES_TABLE)
        .update({ [IMAGE_COLUMN]: newUrl })
        .eq('id', row.id)

      if (uerr) throw uerr

      updated++
      if (updated % 200 === 0) console.log(`Updated ${updated} rows...`)
    }

    offset += data.length
    if (data.length < pageSize) break
  }

  console.log({ updated, skipped })
}

run()
