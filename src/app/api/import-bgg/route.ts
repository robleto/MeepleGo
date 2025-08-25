import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { XMLParser } from 'fast-xml-parser'
import { decodeHtmlEntities } from '@/utils/csvParser'

// Lightweight server-side Supabase client (use service role via env var if needed)
function serverClient() {
  return supabase // assuming supabase already configured with service key when on server
}

// Extract helper safely
function text(node: any): string | null {
  if (node == null) return null
  if (typeof node === 'string') return node
  if (typeof node === 'object' && '@_value' in node) return node['@_value']
  return null
}

export async function POST(req: NextRequest) {
  try {
    const { bggId } = await req.json()
    if (!bggId || !Number.isFinite(Number(bggId))) {
      return NextResponse.json({ error: 'Invalid bggId' }, { status: 400 })
    }

    // Fetch from BGG XML API
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`
    const resp = await fetch(url, { next: { revalidate: 0 } })
    if (!resp.ok) {
      return NextResponse.json({ error: 'BGG fetch failed' }, { status: 502 })
    }
    const xml = await resp.text()

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
    const parsed = parser.parse(xml)
    const item = parsed?.items?.item
    if (!item) {
      return NextResponse.json({ error: 'BGG item not found' }, { status: 404 })
    }

    // Name: choose primary name and decode HTML entities
    let name: string | null = null
    if (Array.isArray(item.name)) {
      const primary = item.name.find((n: any) => n['@_type'] === 'primary')
      name = primary ? primary['@_value'] : item.name[0]['@_value']
    } else if (item.name) {
      name = item.name['@_value'] || item.name
    }
    if (!name) return NextResponse.json({ error: 'Name missing' }, { status: 422 })
    
    // Decode HTML entities in the name
    name = decodeHtmlEntities(name)

  const year_published = item.yearpublished ? Number(item.yearpublished['@_value'] || item.yearpublished) : null
  const min_players = item.minplayers ? Number(item.minplayers['@_value'] || item.minplayers) : null
  const max_players = item.maxplayers ? Number(item.maxplayers['@_value'] || item.maxplayers) : null
  const playtime_minutes = item.playingtime ? Number(item.playingtime['@_value'] || item.playingtime) : null
  const image_url = item.image || null
  const thumbnail_url = item.thumbnail || null

    // Categories & mechanics from link elements (decode HTML entities)
    const links = Array.isArray(item.link) ? item.link : (item.link ? [item.link] : [])
    const categories: string[] = links
      .filter((l: any) => l['@_type'] === 'boardgamecategory')
      .map((l: any) => decodeHtmlEntities(l['@_value']))
      .filter(Boolean)
    const mechanics: string[] = links
      .filter((l: any) => l['@_type'] === 'boardgamemechanic')
      .map((l: any) => decodeHtmlEntities(l['@_value']))
      .filter(Boolean)
    const rawPublisher = links.find((l: any) => l['@_type'] === 'boardgamepublisher')?.['@_value']
    const publisher = rawPublisher ? decodeHtmlEntities(rawPublisher) : null

    const rawDescription = item.description ? (item.description['@_value'] || item.description) : null
    let description = rawDescription ? decodeHtmlEntities(rawDescription) : null
    if (description) {
      // Normalize whitespace & line breaks similar to hygiene script
      description = description
        .replace(/&amp;#10;|&#10;/g, ' ') // line breaks
        .replace(/\s+/g, ' ') // collapse whitespace
        .trim()
    }

    // Designers
    const designers: string[] = links
      .filter((l: any) => l['@_type'] === 'boardgamedesigner')
      .map((l: any) => decodeHtmlEntities(l['@_value']))
      .filter(Boolean)

    // Weight (complexity) from statistics
    let weight: number | null = null
    const ratings = item.statistics?.ratings
    if (ratings && ratings.averageweight && ratings.averageweight['@_value']) {
      const w = parseFloat(ratings.averageweight['@_value'])
      if (!Number.isNaN(w)) weight = w
    }

    // Derive summary (first sentence or truncated) if we have description
    let summary: string | null = null
    if (description) {
      const sentenceEnd = description.indexOf('. ')
      summary = sentenceEnd > -1 ? description.slice(0, sentenceEnd + 1) : description.slice(0, 240)
      if (summary.length > 260) summary = summary.slice(0, 260) + '…'
    }

    const client = serverClient()

    // Upsert game by bgg_id uniqueness
    const { data: existing, error: existingErr } = await client
      .from('games')
      .select('*')
      .eq('bgg_id', Number(bggId))
      .maybeSingle()
    if (existingErr) throw existingErr

    let gameId = existing?.id
    if (!gameId) {
      const { data: inserted, error: insertErr } = await client
        .from('games')
        .insert({
          bgg_id: Number(bggId),
          name,
          year_published,
          image_url,
          thumbnail_url,
          categories: categories.length ? categories : null,
          mechanics: mechanics.length ? mechanics : null,
          min_players,
          max_players,
          playtime_minutes,
          publisher,
          description,
          summary, // pre-populated summary
          designer: designers.length ? designers : null,
          weight,
          rank: null,
          rating: null,
          num_ratings: null,
        })
        .select()
        .single()
      if (insertErr) throw insertErr
      gameId = inserted.id
    } else {
      // Optionally update missing fields
      const patch: any = {}
      if (!existing.year_published && year_published) patch.year_published = year_published
      if (!existing.min_players && min_players) patch.min_players = min_players
      if (!existing.max_players && max_players) patch.max_players = max_players
      if (!existing.playtime_minutes && playtime_minutes) patch.playtime_minutes = playtime_minutes
      if (!existing.image_url && image_url) patch.image_url = image_url
      if (!existing.thumbnail_url && thumbnail_url) patch.thumbnail_url = thumbnail_url
      if ((!existing.categories || !existing.categories.length) && categories.length) patch.categories = categories
      if ((!existing.mechanics || !existing.mechanics.length) && mechanics.length) patch.mechanics = mechanics
      if (publisher && !existing.publisher) patch.publisher = publisher
      if (!existing.description && description) patch.description = description
      if (!existing.summary && summary) patch.summary = summary
      if ((!existing.designer || !existing.designer.length) && designers.length) patch.designer = designers
      if (!existing.weight && weight) patch.weight = weight
      if (Object.keys(patch).length) {
        const { error: updErr } = await client.from('games').update(patch).eq('id', gameId)
        if (updErr) throw updErr
      }
    }

    // Return the (possibly updated) game row
    const { data: finalGame, error: finalErr } = await client.from('games').select('*').eq('id', gameId).single()
    if (finalErr) throw finalErr

    return NextResponse.json({ game: finalGame }, { status: 200 })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
