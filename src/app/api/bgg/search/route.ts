import { NextRequest, NextResponse } from 'next/server'
import {
  decodedTextValue,
  fetchBggXml,
  pickPrimaryName,
  toNumber,
  xmlParser,
} from '../_utils'

const SEARCH_ENDPOINT =
  'https://boardgamegeek.com/xmlapi2/search?type=boardgame,boardgameexpansion&query='

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query')?.trim()
  const yearParam = searchParams.get('year')?.trim()
  const year = yearParam && Number.isFinite(Number(yearParam)) ? Number(yearParam) : null

  if (!query) {
    return NextResponse.json({ ok: false, error: 'Query is required.' }, { status: 400 })
  }

  const url = `${SEARCH_ENDPOINT}${encodeURIComponent(query)}`
  const xmlResult = await fetchBggXml(url)
  if (!xmlResult.ok) {
    const status = xmlResult.status === 202 ? 503 : 502
    return NextResponse.json(
      {
        ok: false,
        error: xmlResult.error,
        status: xmlResult.status,
        details: xmlResult.details,
        bodySnippet: xmlResult.bodySnippet,
      },
      { status }
    )
  }

  const parsed = xmlParser.parse(xmlResult.xml)
  const items = parsed?.items?.item
  if (!items) {
    return NextResponse.json({ ok: true, results: [] })
  }

  const list = Array.isArray(items) ? items : [items]
  let results = list
    .map((item: any) => {
      const bggId = toNumber(item?.['@_id'])
      const name = pickPrimaryName(item?.name)
      if (!bggId || !name) return null

      const yearPublished = toNumber(item?.yearpublished)
      return {
        bgg_id: bggId,
        name,
        year_published: yearPublished,
        type: item?.['@_type'] ?? null,
        thumbnail_url: decodedTextValue(item?.thumbnail),
      }
    })
    .filter(Boolean)

  if (year) {
    results = results.filter((result: any) => result.year_published === year)
  }

  return NextResponse.json({ ok: true, results })
}
