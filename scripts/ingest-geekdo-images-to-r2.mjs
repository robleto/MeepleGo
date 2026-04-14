import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import fs from 'node:fs'

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  R2_ENDPOINT,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET = 'meeplego-images',
  R2_PUBLIC_BASE,
  GAMES_TABLE = 'games',
  IMAGE_COLUMN = 'image_url',
  ID_COLUMN = 'id',

  // knobs
  PAGE_SIZE = '500',
  MAX_UPLOADS = '500', // per run; set higher once confident
  START_OFFSET = '0', // resume support
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
  throw new Error('Missing Supabase env vars')
if (
  !R2_ENDPOINT ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_PUBLIC_BASE
)
  throw new Error('Missing R2 env vars')

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

function isGeekdo(url) {
  if (!url) return false
  const u = url.toLowerCase()
  return u.includes('geekdo-images.com') || u.includes('boardgamegeek.com')
}

function isR2(url) {
  return typeof url === 'string' && url.includes('.r2.dev/')
}

async function r2Exists(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

function extFromContentType(ct) {
  const c = (ct || '').toLowerCase()
  if (c.includes('png')) return 'png'
  if (c.includes('webp')) return 'webp'
  if (c.includes('gif')) return 'gif'
  if (c.includes('svg')) return 'svg'
  return 'jpg'
}

async function run() {
  const pageSize = parseInt(PAGE_SIZE, 10)
  const maxUploads = parseInt(MAX_UPLOADS, 10)
  let offset = parseInt(START_OFFSET, 10)

  let uploaded = 0
  let skipped = 0
  let failed = 0
  let scanned = 0

  console.log(
    `Paging ${GAMES_TABLE} with PAGE_SIZE=${pageSize}, starting offset=${offset}, MAX_UPLOADS=${maxUploads}`
  )

  while (uploaded < maxUploads) {
    const { data, error } = await supabase
      .from(GAMES_TABLE)
      .select(`${ID_COLUMN}, ${IMAGE_COLUMN}`)
      .range(offset, offset + pageSize - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    for (const row of data) {
      scanned++

      const id = row[ID_COLUMN]
      const url = row[IMAGE_COLUMN]

      if (!isGeekdo(url) || isR2(url)) {
        skipped++
        continue
      }

      try {
        const res = await fetch(url, { redirect: 'follow' })
        if (!res.ok) throw new Error(`Fetch failed ${res.status}`)

        const ct = res.headers.get('content-type') || 'image/jpeg'
        const ext = extFromContentType(ct)
        const key = `games/${id}.${ext}`

        if (await r2Exists(key)) {
          // If already uploaded but DB wasn't updated, fix DB now
          const newUrl = `${R2_PUBLIC_BASE}/${key}`
          const { error: uerr } = await supabase
            .from(GAMES_TABLE)
            .update({ [IMAGE_COLUMN]: newUrl })
            .eq(ID_COLUMN, id)
          if (uerr) throw uerr

          skipped++
          continue
        }

        const buf = Buffer.from(await res.arrayBuffer())

        await r2.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: buf,
            ContentType: ct,
            CacheControl: 'public, max-age=31536000, immutable',
          })
        )

        const newUrl = `${R2_PUBLIC_BASE}/${key}`

        const { error: uerr } = await supabase
          .from(GAMES_TABLE)
          .update({ [IMAGE_COLUMN]: newUrl })
          .eq(ID_COLUMN, id)

        if (uerr) throw uerr

        uploaded++
        if (uploaded % 25 === 0)
          console.log(
            `Uploaded ${uploaded}/${maxUploads} (offset ${offset})...`
          )

        // a gentle throttle to avoid hammering geekdo
        await sleep(80)

        if (uploaded >= maxUploads) break
      } catch (e) {
        failed++
        console.error(`FAILED id=${id}`, e?.message || e)
        fs.appendFileSync('geekdo_ingest_failures.txt', `${id}\t${url}\n`)
        await sleep(200)
      }
    }

    offset += data.length
    // write a resume checkpoint each page
    fs.writeFileSync('geekdo_ingest_checkpoint.txt', String(offset))

    if (data.length < pageSize) break
  }

  console.log({ scanned, uploaded, skipped, failed, next_offset: offset })
  console.log('Checkpoint saved to geekdo_ingest_checkpoint.txt')
}

run()
