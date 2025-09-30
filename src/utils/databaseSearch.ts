/**
 * Database search utilities for enhanced server-side search
 */
import { supabase } from '@/lib/supabase'
// Ranking is exported from '@/types/supabase' via '@/types' re-export chain (ensure correct import)
import type { GameWithRanking } from '@/types'
import type { Ranking } from '@/types/supabase'

// Reusable punctuation matcher (kept broad to mirror previous behavior)
const PUNCTUATION_REGEX = /[^A-Za-z0-9\s]/g

// Raw shape returned by the search_games_ranked RPC.
// (Columns should mirror the games table plus any ranking score fields the function returns.)
// We purposely allow extra unknown keys but type the ones we use.
interface RawSearchGame {
  id: string
  bgg_id: number
  name: string
  year_published: number | null
  image_url: string | null
  thumbnail_url: string | null
  categories: string[] | null
  mechanics: string[] | null
  min_players: number | null
  max_players: number | null
  playtime_minutes: number | null
  publisher: string | null
  description: string | null
  summary: string | null
  rank: number | null
  rating: number | null
  num_ratings: number | null
  cached_at: string | null
  created_at: string
  updated_at: string
  // Optional score field produced by ranking function (ignore for now)
  search_rank?: number
  // Unknown additional props (avoid any index access elsewhere)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO(meeplego#types): relax when RPC typed via generated types
  [key: string]: any
}

type RankingsRow = Ranking

/**
 * Enhanced database search using PostgreSQL full-text search (with fallback)
 */
export async function searchGamesDatabase(
  query: string,
  userId?: string,
  limit: number = 500,
  offset: number = 0
): Promise<{ games: GameWithRanking[]; error: string | null }> {
  try {
    if (!query.trim()) {
      return { games: [], error: null }
    }

    // Try the enhanced search function first
    try {
      const { data, error } = await supabase.rpc('search_games_ranked', {
        search_query: query.trim(),
      })

      if (!error && data) {
        const rawData = data as RawSearchGame[]
        // Collect game ids (skip falsy just in case)
        const gameIds = rawData.map((g) => g.id).filter(Boolean)

        let rankings: RankingsRow[] = []
        if (userId && gameIds.length > 0) {
          const { data: rankingsData } = await supabase
            .from('rankings')
            .select('*')
            .in('game_id', gameIds)
            .eq('user_id', userId)
          rankings = (rankingsData as RankingsRow[]) || []
        }

        const games: GameWithRanking[] = rawData
          .map<GameWithRanking>((game) => {
            const ranking = rankings.find((r) => r.game_id === game.id) || null
            return { ...game, ranking }
          })
          .slice(offset, offset + limit)

        return { games, error: null }
      }
    } catch (enhancedError) {
      console.log(
        'Enhanced search function not available, falling back to basic search'
      )
    }

    // Fall back to regular search if enhanced search fails
    return await searchGamesFallback(query, userId, limit, offset)
  } catch (err) {
    console.error('Search error:', err)
    return await searchGamesFallback(query, userId, limit, offset)
  }
}

/**
 * Fallback search using basic ilike for when full-text search isn't available
 */
export async function searchGamesFallback(
  query: string,
  userId?: string,
  limit: number = 500,
  offset: number = 0
): Promise<{ games: GameWithRanking[]; error: string | null }> {
  try {
    if (!query.trim()) {
      return { games: [], error: null }
    }

    const term = query.trim()

    // Create multiple search patterns to handle punctuation and subtitles
    const searchPatterns = [
      term, // Original term
      term.replace(PUNCTUATION_REGEX, ' '), // Remove punctuation (spaces)
      term.replace(PUNCTUATION_REGEX, ''), // Remove punctuation completely
      term.replace(/:/g, ''), // Specifically handle colons
      term.replace(/:/g, ' '), // Replace colons with spaces
    ]

    // For queries that might be subtitles (single words), also try broader patterns
    const words = term
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
    if (words.length === 1) {
      // Add patterns for single word that might be a subtitle
      searchPatterns.push(
        `%: ${term}%`, // Subtitle pattern: "Game: Subtitle"
        `%:${term}%`, // No space after colon
        `% ${term}%` // Just the word with spaces
      )
    }

    // Remove duplicates and empty patterns
    const uniquePatterns = searchPatterns.filter(
      (pattern, index, arr) => pattern.trim() && arr.indexOf(pattern) === index
    )

    let dbQuery = supabase.from('games').select(`
        *,
        rankings(*)
      `)

    // Build OR query for all search patterns - prioritize more precise matches
    const orConditions = uniquePatterns
      .flatMap((pattern) => [
        `name.ilike.%${pattern}%`,
        `publisher.ilike.%${pattern}%`,
        // Remove summary search as it's often too broad and irrelevant
      ])
      .filter(Boolean)
      .join(',')

    dbQuery = dbQuery.or(orConditions)

    // Filter rankings by current user if logged in
    if (userId) {
      dbQuery = dbQuery.eq('rankings.user_id', userId)
    }

    // Remove initial database ordering - we'll do custom sorting after
    // Add pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1)

    const { data, error } = await dbQuery

    if (error) {
      console.error('Fallback search error:', error)
      return { games: [], error: error.message }
    }

    const games: GameWithRanking[] = (data || []).map((game) => {
      const ranking = Array.isArray(
        (game as unknown as { rankings?: Ranking[] }).rankings
      )
        ? (game as unknown as { rankings?: Ranking[] }).rankings![0] || null
        : null
      const { rankings: _omit, ...rest } = game as Record<string, unknown>
      return {
        ...(rest as Omit<GameWithRanking, 'ranking'>),
        ranking,
      } as GameWithRanking
    })

    // Sort results to prioritize exact matches and popular games
    const sortedGames = games.sort((a, b) => {
      const queryLower = term.toLowerCase()
      const aNameLower = a.name.toLowerCase()
      const bNameLower = b.name.toLowerCase()

      // Exact match first
      if (aNameLower === queryLower && bNameLower !== queryLower) return -1
      if (bNameLower === queryLower && aNameLower !== queryLower) return 1

      // Starts with query second
      const aStartsWith = aNameLower.startsWith(queryLower)
      const bStartsWith = bNameLower.startsWith(queryLower)
      if (aStartsWith && !bStartsWith) return -1
      if (bStartsWith && !aStartsWith) return 1

      // If both are exact matches or both start with query, sort by popularity (rank)
      if (
        (aNameLower === queryLower && bNameLower === queryLower) ||
        (aStartsWith && bStartsWith)
      ) {
        const aRank = a.rank || 99999
        const bRank = b.rank || 99999
        return aRank - bRank
      }

      // For partial matches, prioritize those with better ranks
      const aRank = a.rank || 99999
      const bRank = b.rank || 99999

      // If rank difference is significant, use that
      if (Math.abs(aRank - bRank) > 1000) {
        return aRank - bRank
      }

      // Otherwise alphabetical
      return a.name.localeCompare(b.name)
    })

    return { games: sortedGames, error: null }
  } catch (err) {
    console.error('Fallback search error:', err)
    return { games: [], error: 'Search failed' }
  }
}
