/**
 * Database search utilities for enhanced server-side search
 */
import { supabase } from '@/lib/supabase'
import type { GameWithRanking } from '@/types'

/**
 * Enhanced database search using PostgreSQL full-text search (with fallback)
 */
export async function searchGamesDatabase(
  query: string,
  userId?: string,
  limit: number = 500,
  offset: number = 0
): Promise<{ games: GameWithRanking[], error: string | null }> {
  try {
    if (!query.trim()) {
      return { games: [], error: null }
    }

    // Try the enhanced search function first
    try {
      const { data, error } = await supabase
        .rpc('search_games_ranked', { search_query: query.trim() })

      if (!error && data) {
        // Get the game IDs for a separate rankings query if needed
        const gameIds = data.map((game: any) => game.id)
        
        let rankings: any[] = []
        if (userId && gameIds.length > 0) {
          const { data: rankingsData } = await supabase
            .from('rankings')
            .select('*')
            .in('game_id', gameIds)
            .eq('user_id', userId)
          
          rankings = rankingsData || []
        }

        // Transform the data to match our GameWithRanking type
        const games: GameWithRanking[] = data
          .map((game: any) => ({
            ...game,
            ranking: rankings.find(r => r.game_id === game.id) || null
          }))
          .slice(offset, offset + limit)

        return { games, error: null }
      }
    } catch (enhancedError) {
      console.log('Enhanced search function not available, falling back to basic search')
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
): Promise<{ games: GameWithRanking[], error: string | null }> {
  try {
    if (!query.trim()) {
      return { games: [], error: null }
    }

    const term = query.trim()
    
    // Create multiple search patterns to handle punctuation and subtitles
    const searchPatterns = [
      term, // Original term
      term.replace(/['"''""!@#$%^&*()_+\-=\[\]{};:,.<>?/\\|`~]/g, ' '), // Remove punctuation
      term.replace(/['"''""!@#$%^&*()_+\-=\[\]{};:,.<>?/\\|`~]/g, ''), // Remove punctuation completely
      term.replace(/:/g, ''), // Specifically handle colons
      term.replace(/:/g, ' '), // Replace colons with spaces
    ]
    
    // For queries that might be subtitles (single words), also try broader patterns
    const words = term.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    if (words.length === 1) {
      // Add patterns for single word that might be a subtitle
      searchPatterns.push(
        `%: ${term}%`, // Subtitle pattern: "Game: Subtitle"
        `%:${term}%`,  // No space after colon
        `% ${term}%`,  // Just the word with spaces
      )
    }
    
    // Remove duplicates and empty patterns
    const uniquePatterns = searchPatterns.filter((pattern, index, arr) => 
      pattern.trim() && arr.indexOf(pattern) === index
    )
    
    let dbQuery = supabase
      .from('games')
      .select(`
        *,
        rankings(*)
      `)
    
    // Build OR query for all search patterns
    const orConditions = uniquePatterns.flatMap(pattern => [
      `name.ilike.%${pattern}%`,
      `publisher.ilike.%${pattern}%`,
      `summary.ilike.%${pattern}%`
    ]).join(',')
    
    dbQuery = dbQuery.or(orConditions)

    // Filter rankings by current user if logged in
    if (userId) {
      dbQuery = dbQuery.eq('rankings.user_id', userId)
    }

    // Order by relevance (exact matches first)
    dbQuery = dbQuery.order('name', { ascending: true })

    // Add pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1)

    const { data, error } = await dbQuery

    if (error) {
      console.error('Fallback search error:', error)
      return { games: [], error: error.message }
    }

    // Transform the data to match our GameWithRanking type
    const games: GameWithRanking[] = data?.map(game => ({
      ...game,
      ranking: game.rankings?.[0] || null
    })) || []

    // Sort results to prioritize exact matches
    const sortedGames = games.sort((a, b) => {
      const queryLower = term.toLowerCase()
      const aNameLower = a.name.toLowerCase()
      const bNameLower = b.name.toLowerCase()
      
      // Exact match first
      if (aNameLower === queryLower && bNameLower !== queryLower) return -1
      if (bNameLower === queryLower && aNameLower !== queryLower) return 1
      
      // Starts with query second
      if (aNameLower.startsWith(queryLower) && !bNameLower.startsWith(queryLower)) return -1
      if (bNameLower.startsWith(queryLower) && !aNameLower.startsWith(queryLower)) return 1
      
      // Default alphabetical
      return a.name.localeCompare(b.name)
    })

    return { games: sortedGames, error: null }
  } catch (err) {
    console.error('Fallback search error:', err)
    return { games: [], error: 'Search failed' }
  }
}
