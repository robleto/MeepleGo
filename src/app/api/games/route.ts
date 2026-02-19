import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import {
  computeAwardScoreStatsMap,
  computeAwardScoreStatsMapByGameId,
  normalizeAwardGameName,
  type AwardScoreRow,
  type AwardScoreStats,
} from '@/utils/awardScore'

function compareAwardStatsEntries(
  a: [string, AwardScoreStats],
  b: [string, AwardScoreStats],
  orderBy: 'asc' | 'desc'
) {
  const direction = orderBy === 'asc' ? 1 : -1
  const [, aStats] = a
  const [, bStats] = b

  if (aStats.score !== bStats.score) {
    return (aStats.score - bStats.score) * direction
  }
  if (aStats.winnerCount !== bStats.winnerCount) {
    return (aStats.winnerCount - bStats.winnerCount) * direction
  }
  if (aStats.nomineeCount !== bStats.nomineeCount) {
    return (aStats.nomineeCount - bStats.nomineeCount) * direction
  }
  if (aStats.distinctAwardSetCount !== bStats.distinctAwardSetCount) {
    return (
      (aStats.distinctAwardSetCount - bStats.distinctAwardSetCount) * direction
    )
  }

  const aYear = aStats.mostRecentYear ?? 0
  const bYear = bStats.mostRecentYear ?? 0
  if (aYear !== bYear) {
    return (aYear - bYear) * direction
  }

  return a[0].localeCompare(b[0])
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') || 'award_score'
    const orderBy = searchParams.get('orderBy') || 'asc'
    const q = (searchParams.get('q') || '').trim()

    const supabase = await getSupabaseServerClient()
    let query = supabase.from('games').select('*')

    // Name search (case-insensitive substring match)
    if (q) {
      // If searching, prefer ordering by name for UX
      query = query.ilike('name', `%${q}%`).order('name', { ascending: true })
    } else if (sort === 'award_score') {
      const currentYear = new Date().getFullYear()
      const { data: awardRows, error: awardError } = await supabase
        .from('awards_cache')
        .select('award_set,year,is_winner,is_nominee,position,game_name,game_id')
      const awardRowsSafe = !awardError
        ? ((awardRows as AwardScoreRow[] | null) || [])
        : []

      if (awardRowsSafe.length > 0) {
        const awardStatsById = computeAwardScoreStatsMapByGameId(
          awardRowsSafe,
          currentYear
        )

        if (awardStatsById.size > 0) {
          const rankedIds = Array.from(awardStatsById.entries())
            .sort((a, b) =>
              compareAwardStatsEntries(a, b, orderBy === 'asc' ? 'asc' : 'desc')
            )
            .map(([id]) => id)
            .slice(0, limit)

          if (rankedIds.length > 0) {
            const { data: games, error } = await supabase
              .from('games')
              .select('*')
              .in('id', rankedIds)

            if (error) {
              console.error('Error fetching games:', error)
              return NextResponse.json(
                { error: 'Failed to fetch games' },
                { status: 500 }
              )
            }

            const gamesById = new Map(
              (games || []).map((game) => [game.id, game])
            )
            const ordered = rankedIds
              .map((id) => gamesById.get(id))
              .filter(Boolean)

            return NextResponse.json({
              games: ordered,
              total: ordered.length,
            })
          }
        }

        const nameLookup = new Map<string, string>()
        awardRowsSafe.forEach((row) => {
          const key = normalizeAwardGameName(row.game_name)
          if (key && !nameLookup.has(key)) nameLookup.set(key, row.game_name)
        })

        const awardStatsByName = computeAwardScoreStatsMap(
          awardRowsSafe,
          currentYear
        )

        const rankedKeys = Array.from(awardStatsByName.entries())
          .sort((a, b) =>
            compareAwardStatsEntries(a, b, orderBy === 'asc' ? 'asc' : 'desc')
          )
          .map(([name]) => name)
          .slice(0, limit)
        const rankedNames = rankedKeys
          .map((key) => nameLookup.get(key))
          .filter((name): name is string => Boolean(name))

        if (rankedNames.length > 0) {
          const { data: games, error } = await supabase
            .from('games')
            .select('*')
            .in('name', rankedNames)

          if (error) {
            console.error('Error fetching games:', error)
            return NextResponse.json(
              { error: 'Failed to fetch games' },
              { status: 500 }
            )
          }

          const gamesByName = new Map(
            (games || []).map((game) => [
              normalizeAwardGameName(game.name),
              game,
            ])
          )
          const ordered = rankedNames
            .map((name) => gamesByName.get(normalizeAwardGameName(name)))
            .filter(Boolean)

          return NextResponse.json({
            games: ordered,
            total: ordered.length,
          })
        }
      }
      // Fall back to normal ordering if awards cache is unavailable
      const ascending = orderBy === 'asc'
      query = query.order('name', { ascending })
    } else {
      // Apply sorting only when not searching
      const ascending = orderBy === 'asc'
      query = query.order(sort, { ascending })
    }

    // Apply limit
    query = query.limit(limit)

    const { data: games, error } = await query

    if (error) {
      console.error('Error fetching games:', error)
      return NextResponse.json(
        { error: 'Failed to fetch games' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      games: games || [],
      total: games?.length || 0,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
