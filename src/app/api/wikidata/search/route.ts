import { NextRequest, NextResponse } from 'next/server'
import { extractQid, fetchSparql, pickBindingValue, pickNumber } from '../_utils'

const BOARDGAME_QID = 'Q131436'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query')?.trim()
  const yearParam = searchParams.get('year')?.trim()
  const year = yearParam && Number.isFinite(Number(yearParam)) ? Number(yearParam) : null

  if (!query) {
    return NextResponse.json({ ok: false, error: 'Query is required.' }, { status: 400 })
  }

  const sparql = `
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX mwapi: <https://www.mediawiki.org/ontology#API/>
PREFIX bd: <http://www.bigdata.com/rdf#>
PREFIX schema: <http://schema.org/>

SELECT ?item ?itemLabel ?year ?publisherLabel ?minPlayers ?maxPlayers ?playtime WHERE {
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:endpoint "www.wikidata.org";
                    wikibase:api "EntitySearch";
                    mwapi:search "${query.replace(/"/g, '')}";
                    mwapi:language "en".
    ?item wikibase:apiOutputItem mwapi:item.
  }
  ?item wdt:P31/wdt:P279* wd:${BOARDGAME_QID}.
  OPTIONAL { ?item wdt:P577 ?publicationDate. BIND(YEAR(?publicationDate) AS ?year) }
  OPTIONAL { ?item wdt:P123 ?publisher }
  OPTIONAL { ?item wdt:P1872 ?minPlayers }
  OPTIONAL { ?item wdt:P1873 ?maxPlayers }
  OPTIONAL { ?item wdt:P2047 ?playtime }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 25
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

  const bindings = result.data?.results?.bindings ?? []
  let results = bindings
    .map((binding: any) => {
      const item = pickBindingValue(binding, 'item')
      const wikidata_id = extractQid(item)
      const name = pickBindingValue(binding, 'itemLabel')
      if (!wikidata_id || !name) return null

      const year_published = pickNumber(binding, 'year')
      const publisher = pickBindingValue(binding, 'publisherLabel')
      const min_players = pickNumber(binding, 'minPlayers')
      const max_players = pickNumber(binding, 'maxPlayers')
      const playtime_minutes = pickNumber(binding, 'playtime')

      return {
        wikidata_id,
        name,
        year_published,
        publisher,
        min_players,
        max_players,
        playtime_minutes,
      }
    })
    .filter(Boolean)

  if (year) {
    results = results.filter((item: any) => item.year_published === year)
  }

  return NextResponse.json({ ok: true, results })
}
