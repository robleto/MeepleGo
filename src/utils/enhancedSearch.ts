/**
 * Enhanced search utilities using Fuse.js for superior fuzzy search
 */
import Fuse, { FuseResult, IFuseOptions } from 'fuse.js'
import type { GameWithRanking } from '@/types'

// Fuse.js options optimized for game search
const fuseOptions: IFuseOptions<GameWithRanking> = {
  // Keys to search - with weights for importance
  keys: [
    {
      name: 'name',
      weight: 0.7 // Most important
    },
    {
      name: 'publisher',
      weight: 0.15
    },
    {
      name: 'categories',
      weight: 0.1
    },
    {
      name: 'mechanics',
      weight: 0.05
    }
  ],
  
  // Search settings - more permissive for punctuation
  threshold: 0.4, // Lower = more strict (0 = exact match, 1 = match anything)
  location: 0, // Where in the string to start looking
  distance: 200, // Increased distance for longer game names with punctuation
  minMatchCharLength: 1,
  
  // Return scores and matched indices
  includeScore: true,
  includeMatches: true,
  
  // Search behavior - more flexible for punctuation
  ignoreLocation: true, // Don't care about position for punctuation handling
  ignoreFieldNorm: false, // Field normalization
  findAllMatches: false,
  
  // Use extended search for more powerful queries
  useExtendedSearch: false
}

/**
 * Enhanced fuzzy search using Fuse.js
 */
export class EnhancedGameSearch {
  private fuse: Fuse<GameWithRanking>

  constructor(games: GameWithRanking[]) {
    this.fuse = new Fuse(games, fuseOptions)
  }

  /**
   * Search games with scoring and ranking
   */
  search(query: string, limit: number = 50): GameWithRanking[] {
    if (!query.trim()) return []

    const results = this.fuse.search(query.trim(), { limit })
    
    // Return games sorted by relevance score
    return results.map(result => result.item)
  }

  /**
   * Search with detailed results including scores and matches
   */
  searchWithDetails(query: string, limit: number = 50): Array<{
    game: GameWithRanking
    score: number
    matches?: FuseResult<GameWithRanking>['matches']
  }> {
    if (!query.trim()) return []

    const results = this.fuse.search(query.trim(), { limit })
    
    return results.map(result => ({
      game: result.item,
      score: result.score || 0,
      matches: result.matches
    }))
  }

  /**
   * Update the search index with new games
   */
  updateIndex(games: GameWithRanking[]) {
    this.fuse = new Fuse(games, fuseOptions)
  }
}

/**
 * Quick search function for immediate use
 */
export function searchGames(games: GameWithRanking[], query: string, limit: number = 50): GameWithRanking[] {
  const searcher = new EnhancedGameSearch(games)
  return searcher.search(query, limit)
}

/**
 * Search with exact match boosting - prioritizes exact matches
 */
export function searchGamesWithExactBoost(games: GameWithRanking[], query: string, limit: number = 50): GameWithRanking[] {
  if (!query.trim()) return []
  
  const queryLower = query.trim().toLowerCase()
  
  // Normalize query for punctuation handling
  const normalizedQuery = query.trim()
    .toLowerCase()
    .replace(/['"''""!@#$%^&*()_+\-=\[\]{};:,.<>?/\\|`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  // Find exact matches first
  const exactMatches = games.filter(game => 
    game.name.toLowerCase() === queryLower
  )
  
  // Find normalized exact matches (handles punctuation)
  const normalizedExactMatches = games.filter(game => {
    const normalizedName = game.name
      .toLowerCase()
      .replace(/['"''""!@#$%^&*()_+\-=\[\]{};:,.<>?/\\|`~]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    return normalizedName === normalizedQuery && !exactMatches.includes(game)
  })
  
  // Find starts-with matches
  const startsWithMatches = games.filter(game => {
    const gameLower = game.name.toLowerCase()
    const normalizedName = game.name
      .toLowerCase()
      .replace(/['"''""!@#$%^&*()_+\-=\[\]{};:,.<>?/\\|`~]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    return (
      (gameLower.startsWith(queryLower) || normalizedName.startsWith(normalizedQuery)) &&
      !exactMatches.includes(game) &&
      !normalizedExactMatches.includes(game)
    )
  })
  
  // Use Fuse.js for fuzzy matches, excluding exact and starts-with matches
  const excludeIds = new Set([...exactMatches, ...normalizedExactMatches, ...startsWithMatches].map(g => g.id))
  const remainingGames = games.filter(game => !excludeIds.has(game.id))
  
  const searcher = new EnhancedGameSearch(remainingGames)
  const fuzzyMatches = searcher.search(query, Math.max(0, limit - exactMatches.length - normalizedExactMatches.length - startsWithMatches.length))
  
  // Combine results with exact matches first
  return [
    ...exactMatches,
    ...normalizedExactMatches,
    ...startsWithMatches,
    ...fuzzyMatches
  ].slice(0, limit)
}

/**
 * Multi-field search that searches across game properties
 */
export function multiFieldSearch(games: GameWithRanking[], query: string, limit: number = 50): GameWithRanking[] {
  const searcher = new EnhancedGameSearch(games)
  return searcher.search(query, limit)
}
