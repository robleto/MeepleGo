import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const BUCKET = 'meeplego-images'
const BASE = process.env.R2_PUBLIC_BASE

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function exists(key) {
  try {
    await r2.send(
      new HeadObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    )
    return true
  } catch {
    return false
  }
}

function extFromContentType(ct) {
  if (!ct) return 'jpg'
  if (ct.includes('png')) return 'png'
  if (ct.includes('webp')) return 'webp'
  return 'jpg'
}

async function run() {
  while (true) {
    const { data: games } = await supabase
      .from('games')
      .select('id, image_url')
      .like('image_url', '%geekdo-images.com%')
      .limit(100)

    if (!games.length) break

    console.log(`Found ${games.length} remaining Geekdo images`)

    for (const game of games) {
      try {
        const res = await fetch(game.image_url)
        if (!res.ok) continue

        const ct = res.headers.get('content-type')
        const ext = extFromContentType(ct)

        const key = `games/${game.id}.${ext}`

        if (!(await exists(key))) {
          const buf = Buffer.from(await res.arrayBuffer())

          await r2.send(
            new PutObjectCommand({
              Bucket: BUCKET,
              Key: key,
              Body: buf,
              ContentType: ct,
              CacheControl: 'public, max-age=31536000, immutable',
            })
          )
        }

        const newUrl = `${BASE}/${key}`

        await supabase
          .from('games')
          .update({ image_url: newUrl })
          .eq('id', game.id)

        console.log(`Migrated ${game.id}`)

        await sleep(50)
      } catch (e) {
        console.log(`Failed ${game.id}`)
      }
    }
  }

  console.log('Geekdo migration complete')
}

run()
