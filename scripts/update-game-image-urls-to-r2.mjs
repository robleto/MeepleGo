import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_BUCKET = 'game-images',
  R2_PUBLIC_BASE,
  GAMES_TABLE = 'games',
  IMAGE_COLUMN = 'image_url',
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
  throw new Error('Missing Supabase env vars')
if (!R2_PUBLIC_BASE) throw new Error('Missing R2_PUBLIC_BASE')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Matches: .../storage/v1/object/public/game-images/<path>
const re = new RegExp(`/storage/v1/object/public/${SUPABASE_BUCKET}/(.+)$`)

async function run() {
  let updated = 0
  let untouched = 0
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
        untouched++
        continue
      }

      const m = url.match(re)
      if (!m) {
        // not a Supabase storage url for this bucket → leave it alone
        untouched++
        continue
      }

      const path = m[1] // the object path inside bucket
      // We stored in R2 under /games/<same path>
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

  console.log({ updated, untouched })
}

await run()
