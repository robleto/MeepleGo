/**
 * recover-images-from-bgg.mjs
 *
 * Finds all games whose image_url is a broken Supabase Storage URL
 * (or null/empty), fetches the image from BoardGameGeek API using bgg_id,
 * uploads it to Cloudflare R2, and updates the DB record.
 *
 * Usage:
 *   node scripts/recover-images-from-bgg.mjs
 *
 * Env vars (via .env.local):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *   R2_PUBLIC_BASE
 *   R2_BUCKET          (default: meeplego-images)
 *   PAGE_SIZE          (default: 200)
 *   MAX_UPLOADS        (default: 9999)
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  R2_ENDPOINT,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET = 'meeplego-images',
  R2_PUBLIC_BASE,
  PAGE_SIZE = '200',
  MAX_UPLOADS = '9999',
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
  throw new Error('Missing Supabase env vars')
if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_BASE)
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

function isR2(url) {
  return typeof url === 'string' && url.includes('.r2.dev/')
}

function isSupabaseStorage(url) {
  return typeof url === 'string' && url.includes('.supabase.co/storage/v1/object/public/')
}

function extFromContentType(ct) {
  const c = (ct || '').toLowerCase()
  if (c.includes('png')) return 'png'
  if (c.includes('webp')) return 'webp'
  if (c.includes('gif')) return 'gif'
  if (c.includes('svg')) return 'svg'
  return 'jpg'
}

async function r2Exists(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

/**
 * Fetches the image URL for a BGG game ID via the BGG XML API v2.
 * Returns null if not found or on error.
 */
async function getImageUrlFromBGG(bggId) {
  const apiUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&type=boardgame`
  try {
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'MeepleGo-ImageRecovery/1.0' },
    })
    if (!res.ok) return null

    const xml = await res.text()
    // BGG XML: <image>//cf.geekdo-images.com/...</image>
    const m = xml.match(/<image>\s*([^<\s]+)\s*<\/image>/)
    if (!m) return null
    const imageRaw = m[1]

    // BGG returns paths like //cf.geekdo-images.com/... — add https:
    return imageRaw.startsWith('//') ? `https:${imageRaw}` : imageRaw
  } catch (e) {
    return null
  }
}

async function run() {
  const pageSize = parseInt(PAGE_SIZE, 10)
  const maxUploads = parseInt(MAX_UPLOADS, 10)

  let uploaded = 0
  let skipped = 0
  let failed = 0
  let scanned = 0
  let offset = 0

  console.log('Scanning for broken Supabase Storage image URLs...')
  console.log(`PAGE_SIZE=${pageSize} MAX_UPLOADS=${maxUploads}`)

  while (uploaded < maxUploads) {
    const { data, error } = await supabase
      .from('games')
      .select('id, bgg_id, image_url')
      .range(offset, offset + pageSize - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    for (const row of data) {
      scanned++

      const { id, bgg_id, image_url } = row

      // Skip if already on R2
      if (isR2(image_url)) {
        skipped++
        continue
      }

      // Only recover broken Supabase Storage URLs (or null/empty)
      const needsRecovery = isSupabaseStorage(image_url) || !image_url
      if (!needsRecovery) {
        // geekdo or other URLs are handled by finish-geekdo-ingest.mjs
        skipped++
        continue
      }

      if (!bgg_id) {
        console.warn(`  SKIP id=${id} — no bgg_id, cannot recover`)
        skipped++
        continue
      }

      try {
        // Check if we already have this in R2 (idempotent retry support)
        const candidateKeys = [`games/${id}.jpg`, `games/${id}.png`, `games/${id}.webp`]
        let alreadyInR2 = false
        for (const existingKey of candidateKeys) {
          if (await r2Exists(existingKey)) {
            const newUrl = `${R2_PUBLIC_BASE}/${existingKey}`
            await supabase.from('games').update({ image_url: newUrl }).eq('id', id)
            console.log(`  REPAIR id=${id} → already in R2 at ${existingKey}`)
            skipped++
            alreadyInR2 = true
            break
          }
        }
        if (alreadyInR2) continue

        // Fetch image URL from BGG
        const bggImageUrl = await getImageUrlFromBGG(bgg_id)

        // Throttle BGG API — they ask for 2–5 s between calls in bulk
        await sleep(2000)

        if (!bggImageUrl) {
          console.warn(`  SKIP id=${id} bgg_id=${bgg_id} — no image found on BGG`)
          fs.appendFileSync('recover_no_image.txt', `${id}\t${bgg_id}\n`)
          skipped++
          continue
        }

        // Download the image
        const imgRes = await fetch(bggImageUrl, {
          headers: { 'User-Agent': 'MeepleGo-ImageRecovery/1.0' },
          redirect: 'follow',
        })
        if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.status} ${bggImageUrl}`)

        const ct = imgRes.headers.get('content-type') || 'image/jpeg'
        const ext = extFromContentType(ct)
        const key = `games/${id}.${ext}`
        const buf = Buffer.from(await imgRes.arrayBuffer())

        // Upload to R2
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

        // Update DB
        const { error: uerr } = await supabase
          .from('games')
          .update({ image_url: newUrl })
          .eq('id', id)

        if (uerr) throw uerr

        uploaded++
        console.log(`  [${uploaded}] Recovered id=${id} bgg_id=${bgg_id} → ${newUrl}`)

        if (uploaded >= maxUploads) break
      } catch (e) {
        failed++
        console.error(`  FAILED id=${id} bgg_id=${bgg_id}:`, e?.message || e)
        fs.appendFileSync('recover_failures.txt', `${id}\t${bgg_id}\t${image_url}\n`)
        await sleep(500)
      }
    }

    offset += data.length
    if (data.length < pageSize) break
  }

  console.log('\n--- Done ---')
  console.log({ scanned, uploaded, skipped, failed })
  if (failed > 0) console.log('Failed IDs written to recover_failures.txt')
}

run().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
