import { NextRequest, NextResponse } from 'next/server'
import { extractQid, fetchSparql, pickBindingValue, pickNumber } from '../_utils'

const BOARDGAME_QID = 'Q131436'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const idParam = searchParams.get('id')?.trim()
  const wikidataId = idParam && idParam.startsWith('Q') ? idParam : null

  if (!wikidataId) {
    return NextResponse.json({ ok: false, error: 'id is required.' }, { status: 400 })
  }

  const sparql = `
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX mwapi: <https://www.mediawiki.org/ontology#API/>
PREFIX bd: <http://www.bigdata.com/rdf#>
PREFIX schema: <http://schema.org/>

SELECT ?item ?itemLabel ?itemDescription ?year ?publisherLabel ?minPlayers ?maxPlayers ?playtime WHERE {
  BIND(wd:${wikidataId} AS ?item)
  ?item wdt:P31/wdt:P279* wd:${BOARDGAME_QID}.
  OPTIONAL { ?item wdt:P577 ?publicationDate. BIND(YEAR(?publicationDate) AS ?year) }
  OPTIONAL { ?item wdt:P123 ?publisher }
  OPTIONAL { ?item wdt:P1872 ?minPlayers }
  OPTIONAL { ?item wdt:P1873 ?maxPlayers }
  OPTIONAL { ?item wdt:P2047 ?playtime }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  OPTIONAL { ?item schema:description ?itemDescription FILTER (lang(?itemDescription) = "en") }
}
LIMIT 1
`

  const result = await fetchSparql(sparql)
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        status: result.status,
        details: result.details,
        bodySnippet: result.bodySnippet,
      },
      { status: result.status === 429 ? 503 : 502 }
    )
  }

  const binding = result.data?.results?.bindings?.[0]
  if (!binding) {
    return NextResponse.json({ ok: false, error: 'Item not found.' }, { status: 404 })
  }

  const item = pickBindingValue(binding, 'item')
  const resolvedId = extractQid(item)
  const name = pickBindingValue(binding, 'itemLabel')
  if (!resolvedId || !name) {
    return NextResponse.json({ ok: false, error: 'Name missing.' }, { status: 422 })
  }

  const year_published = pickNumber(binding, 'year')
  const publisher = pickBindingValue(binding, 'publisherLabel')
  const min_players = pickNumber(binding, 'minPlayers')
  const max_players = pickNumber(binding, 'maxPlayers')
  const playtime_minutes = pickNumber(binding, 'playtime')
  const description = pickBindingValue(binding, 'itemDescription')

  return NextResponse.json({
    ok: true,
    game: {
      wikidata_id: resolvedId,
      name,
      year_published,
      publisher,
      min_players,
      max_players,
      playtime_minutes,
      description,
    },
  })
}
