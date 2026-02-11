import { getSupabaseServerClient } from '@/lib/supabaseServer'
import type { AwardsApiAward } from '@/lib/awardsApi'

export type AwardsCacheRow = {
  award_id: string
  award_slug: string | null
  award_url: string | null
  award_set: string
  year: number
  title: string | null
  position: string | null
  is_winner: boolean | null
  is_nominee: boolean | null
  game_name: string
  game_id?: string | null
  source?: string | null
  source_url?: string | null
  source_confidence?: number | null
}

export async function getAwardsCache(
  awardSet: string
): Promise<AwardsCacheRow[] | null> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from('awards_cache')
      .select(
        [
          'award_id',
          'award_slug',
          'award_url',
          'award_set',
          'year',
          'title',
          'position',
          'is_winner',
          'is_nominee',
          'game_name',
          'game_id',
          'source',
          'source_url',
          'source_confidence',
        ].join(',')
      )
      .eq('award_set', awardSet)

    if (error) {
      console.warn('Awards cache fetch error:', error.message)
      return null
    }

    return (data || []) as AwardsCacheRow[]
  } catch (error) {
    console.warn('Awards cache unavailable:', (error as Error)?.message)
    return null
  }
}

export function awardsFromCache(rows: AwardsCacheRow[]): AwardsApiAward[] {
  const awardsMap = new Map<string, AwardsApiAward>()

  rows.forEach((row) => {
    const key =
      row.award_id ||
      `${row.award_set}|${row.year}|${row.title || ''}|${row.position || ''}|${
        row.award_url || ''
      }`

    if (!awardsMap.has(key)) {
      awardsMap.set(key, {
        id: row.award_id || key,
        slug: row.award_slug || '',
        url: row.award_url || '',
        year: row.year,
        title: row.title || '',
        primaryName: undefined,
        alternateNames: undefined,
        boardgames: [],
        awardSet: row.award_set,
        position: row.position || row.title || '',
        isWinner: row.is_winner ?? undefined,
        isNominee: row.is_nominee ?? undefined,
      })
    }

    const entry = awardsMap.get(key)!
    if (row.game_name) {
      entry.boardgames.push({
        name: row.game_name,
        id: row.game_id || undefined,
      })
    }
  })

  return Array.from(awardsMap.values())
}

export async function getAwardsForSet(
  awardSet: string,
  fallback: () => Promise<AwardsApiAward[]>
): Promise<AwardsApiAward[]> {
  const cacheRows = await getAwardsCache(awardSet)
  if (cacheRows && cacheRows.length > 0) {
    return awardsFromCache(cacheRows)
  }
  return fallback()
}
