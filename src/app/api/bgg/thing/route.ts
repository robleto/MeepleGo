import { NextRequest, NextResponse } from 'next/server'
import {
  cleanDescription,
  decodedTextValue,
  fetchBggXml,
  pickPrimaryName,
  toNumber,
  xmlParser,
} from '../_utils'

const THING_ENDPOINT =
  'https://boardgamegeek.com/xmlapi2/thing?id='

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const idParam = searchParams.get('id')?.trim()
  const bggId = idParam && Number.isFinite(Number(idParam)) ? Number(idParam) : null

  if (!bggId) {
    return NextResponse.json({ ok: false, error: 'id is required.' }, { status: 400 })
  }

  const url = `${THING_ENDPOINT}${bggId}&stats=1`
  const xmlResult = await fetchBggXml(url)
  if (!xmlResult.ok) {
    const status = xmlResult.status === 202 ? 503 : 502
    return NextResponse.json(
      {
        ok: false,
        error: xmlResult.error,
        status: xmlResult.status,
        details: xmlResult.details,
      },
      { status }
    )
  }

  const parsed = xmlParser.parse(xmlResult.xml)
  const item = parsed?.items?.item
  if (!item) {
    return NextResponse.json({ ok: false, error: 'BGG item not found.' }, { status: 404 })
  }

  const name = pickPrimaryName(item?.name)
  if (!name) {
    return NextResponse.json({ ok: false, error: 'Name missing.' }, { status: 422 })
  }

  const year_published = toNumber(item?.yearpublished)
  const min_players = toNumber(item?.minplayers)
  const max_players = toNumber(item?.maxplayers)
  const playtime_minutes = toNumber(item?.playingtime)
  const image_url = decodedTextValue(item?.image)
  const thumbnail_url = decodedTextValue(item?.thumbnail)
  const description = cleanDescription(decodedTextValue(item?.description))
  const bgg_type = item?.['@_type'] ?? null

  const links = Array.isArray(item?.link)
    ? item.link
    : item?.link
      ? [item.link]
      : []

  const categories = links
    .filter((link: any) => link?.['@_type'] === 'boardgamecategory')
    .map((link: any) => decodedTextValue(link))
    .filter(Boolean)

  const mechanics = links
    .filter((link: any) => link?.['@_type'] === 'boardgamemechanic')
    .map((link: any) => decodedTextValue(link))
    .filter(Boolean)

  const designer = links
    .filter((link: any) => link?.['@_type'] === 'boardgamedesigner')
    .map((link: any) => decodedTextValue(link))
    .filter(Boolean)

  const artists = links
    .filter((link: any) => link?.['@_type'] === 'boardgameartist')
    .map((link: any) => decodedTextValue(link))
    .filter(Boolean)

  const publisher =
    decodedTextValue(
      links.find((link: any) => link?.['@_type'] === 'boardgamepublisher')
    ) ?? null

  const ratings = item?.statistics?.ratings
  const weightRaw = ratings?.averageweight?.['@_value'] ?? ratings?.averageweight
  const weight = weightRaw ? Number(weightRaw) : null
  const ratingRaw = ratings?.average?.['@_value'] ?? ratings?.average
  const rating = ratingRaw ? Number(ratingRaw) : null
  const numRatingsRaw = ratings?.usersrated?.['@_value'] ?? ratings?.usersrated
  const num_ratings = numRatingsRaw ? Number(numRatingsRaw) : null

  return NextResponse.json({
    ok: true,
    game: {
      bgg_id: bggId,
      name,
      year_published,
      description,
      image_url,
      thumbnail_url,
      min_players,
      max_players,
      playtime_minutes,
      categories: categories.length ? categories : null,
      mechanics: mechanics.length ? mechanics : null,
      designer: designer.length ? designer : null,
      artists: artists.length ? artists : null,
      publisher,
      weight: Number.isFinite(weight) ? weight : null,
      rating: Number.isFinite(rating) ? rating : null,
      num_ratings: Number.isFinite(num_ratings) ? num_ratings : null,
      bgg_type,
    },
  })
}
