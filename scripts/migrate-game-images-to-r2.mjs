import 'dotenv/config'
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_BUCKET = 'game-images',
  R2_ENDPOINT,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET = 'meeplego-images',
  R2_PUBLIC_BASE,
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
  throw new Error('Missing Supabase env vars')
if (
  !R2_ENDPOINT ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_PUBLIC_BASE
) {
  throw new Error('Missing R2 env vars')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const r2 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function guessContentType(path) {
  const p = path.toLowerCase()
  if (p.endsWith('.png')) return 'image/png'
  if (p.endsWith('.webp')) return 'image/webp'
  if (p.endsWith('.gif')) return 'image/gif'
  if (p.endsWith('.svg')) return 'image/svg+xml'
  return 'image/jpeg'
}

async function r2Exists(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

async function listAllFiles(prefix = '') {
  // Supabase list() returns up to 1000 per call; we page with offset.
  const out = []
  let offset = 0
  const limit = 1000

  while (true) {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list(prefix, { limit, offset, sortBy: { column: 'name', order: 'asc' } })

    if (error) throw error
    if (!data || data.length === 0) break

    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name

      if (item.id) {
        // Files have an id; folders do not
        out.push(fullPath)
      } else {
        // Folder: recurse
        const nested = await listAllFiles(fullPath)
        out.push(...nested)
      }
    }

    offset += data.length
    if (data.length < limit) break
  }

  return out
}

async function migrate() {
  console.log(`Listing all files in Supabase bucket: ${SUPABASE_BUCKET} ...`)
  const files = await listAllFiles('')
  console.log(`Found ${files.length} files.`)

  let uploaded = 0
  let skipped = 0
  let failed = 0

  for (const path of files) {
    const key = `games/${path}` // preserves any nested paths under a /games prefix in R2

    try {
      // Skip if already uploaded (idempotent reruns)
      if (await r2Exists(key)) {
        skipped++
        continue
      }

      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .download(path)
      if (error) throw error
      const buf = Buffer.from(await data.arrayBuffer())

      await r2.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: buf,
          ContentType: guessContentType(path),
          CacheControl: 'public, max-age=31536000, immutable',
        })
      )

      uploaded++
      if (uploaded % 50 === 0)
        console.log(`Uploaded ${uploaded}/${files.length}...`)
      // Be kind to rate limits
      await sleep(20)
    } catch (e) {
      failed++
      console.error(`FAILED: ${path}`, e?.message || e)
      fs.appendFileSync('migrate_failures.txt', `${path}\n`)
      await sleep(50)
    }
  }

  console.log({ uploaded, skipped, failed })
  console.log('Done.')
}

await migrate()
