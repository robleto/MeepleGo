import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import https from 'https'
import { fileURLToPath } from 'url'

// Basic script: fetch thumbnail/image URLs from games table and store locally under public/games/{id}-{hash}.jpg
// Resize strategy is deferred (Next/Image can optimize), but we ensure consistent naming and skip already cached files.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Missing SUPABASE env vars (SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY)'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface GameRecord {
  id: number
  name: string
  image_url: string | null
  thumbnail_url: string | null
}

async function fetchGames(batch = 1000): Promise<GameRecord[]> {
  const { data, error } = await supabase
    .from('games')
    .select('id,name,image_url,thumbnail_url')
    .order('id', { ascending: true })
    .limit(batch)
  if (error) throw error
  return data as GameRecord[]
}

function hash(str: string) {
  return crypto.createHash('md5').update(str).digest('hex').slice(0, 8)
}

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          file.close()
          fs.unlinkSync(dest)
          return reject(new Error('HTTP ' + res.statusCode))
        }
        res.pipe(file)
        file.on('finish', () => file.close(() => resolve()))
      })
      .on('error', (err) => {
        file.close()
        if (fs.existsSync(dest)) fs.unlinkSync(dest)
        reject(err)
      })
  })
}

async function main() {
  const outDir = path.join(process.cwd(), 'public', 'games')
  fs.mkdirSync(outDir, { recursive: true })

  console.log('Fetching games...')
  const games = await fetchGames()
  console.log(`Found ${games.length} games`)

  let downloaded = 0
  for (const g of games) {
    const src = g.image_url || g.thumbnail_url
    if (!src) continue
    const ext = path.extname(new URL(src).pathname) || '.jpg'
    const filename = `${g.id}-${hash(src)}${ext}`
    const local = path.join(outDir, filename)
    if (fs.existsSync(local)) continue
    try {
      await download(src, local)
      downloaded++
      if (downloaded % 25 === 0) console.log(`Downloaded ${downloaded}`)
    } catch (e) {
      console.warn('Failed download', g.id, src, (e as Error).message)
    }
  }
  console.log('Done. New downloads:', downloaded)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
