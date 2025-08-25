/**
 * Ultimate search utility combining multiple search strategies
 */
import Fuse from 'fuse.js'
import * as levenshtein from 'fast-levenshtein'
import type { GameWithRanking } from '@/types'

/**
 * Normalize text for better searching - removes punctuation and extra spaces
 */
function normalizeSearchText(text: string): string {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .trim()
    // Remove common punctuation that can interfere with matching
    .replace(/['"''""!@#$%^&*()_+\-=\[\]{};:,.<>?/\\|`~]/g, ' ')
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Create multiple search variations for better matching
 */
function createSearchVariations(query: string, gameName: string): Array<{ query: string, name: string }> {
  const variations = []
  
  // Original
  variations.push({ query: query.toLowerCase().trim(), name: gameName.toLowerCase().trim() })
  
  // Normalized (punctuation removed)
  variations.push({ 
    query: normalizeSearchText(query), 
    name: normalizeSearchText(gameName) 
  })
  
  // Colon-specific variations
  if (gameName.includes(':')) {
    // Split on colon and try matching parts
    const nameParts = gameName.split(':').map(part => part.trim().toLowerCase())
    const queryLower = query.toLowerCase().trim()
    
    // Try matching against each part
    nameParts.forEach(part => {
      variations.push({ query: queryLower, name: part })
    })
    
    // Try matching against parts joined with space
    variations.push({ 
      query: queryLower, 
      name: nameParts.join(' ') 
    })
  }
  
  // If query has multiple words, try matching against parts
  const queryWords = query.toLowerCase().trim().split(/\s+/)
  if (queryWords.length > 1) {
    queryWords.forEach(word => {
      variations.push({ query: word, name: gameName.toLowerCase() })
    })
  }
  
  return variations
}

/**
 * Check if query matches game name with comprehensive variations
 */
function isNormalizedMatch(query: string, gameName: string): { isMatch: boolean, score: number, matchType: string } {
  if (!query || !gameName) {
    return { isMatch: false, score: 0, matchType: 'none' }
  }
  
  const variations = createSearchVariations(query, gameName)
  let bestMatch = { isMatch: false, score: 0, matchType: 'none' }
  
  for (const { query: q, name: n } of variations) {
    if (!q || !n) continue
    
    // Exact match
    if (n === q) {
      return { isMatch: true, score: 1.0, matchType: 'exact-variation' }
    }
    
    // Starts with match
    if (n.startsWith(q)) {
      const score = 0.95 - (n.length - q.length) * 0.01
      if (score > bestMatch.score) {
        bestMatch = { isMatch: true, score, matchType: 'starts-with-variation' }
      }
    }
    
    // Contains match
    if (n.includes(q)) {
      const position = n.indexOf(q)
      const score = 0.85 - (position * 0.02)
      if (score > bestMatch.score) {
        bestMatch = { isMatch: true, score, matchType: 'contains-variation' }
      }
    }
    
    // Word-by-word matching for multi-word queries
    const queryWords = q.split(' ').filter(w => w.length > 0)
    const nameWords = n.split(' ').filter(w => w.length > 0)
    
    if (queryWords.length > 1 && nameWords.length > 0) {
      const matchedWords = queryWords.filter(queryWord => 
        nameWords.some(nameWord => 
          nameWord.includes(queryWord) || queryWord.includes(nameWord) ||
          (queryWord.length > 2 && nameWord.length > 2 && 
           (nameWord.startsWith(queryWord.slice(0, 3)) || queryWord.startsWith(nameWord.slice(0, 3))))
        )
      )
      
      if (matchedWords.length === queryWords.length) {
        const score = 0.8 * (matchedWords.length / queryWords.length)
        if (score > bestMatch.score) {
          bestMatch = { isMatch: true, score, matchType: 'all-words-variation' }
        }
      } else if (matchedWords.length >= Math.ceil(queryWords.length * 0.6)) {
        const score = 0.6 * (matchedWords.length / queryWords.length)
        if (score > bestMatch.score) {
          bestMatch = { isMatch: true, score, matchType: 'partial-words-variation' }
        }
      }
    }
    
    // Single word matching with substring tolerance
    if (queryWords.length === 1) {
      const singleWord = queryWords[0]
      if (singleWord && singleWord.length > 2) {
        const foundInName = nameWords.some(nameWord => 
          nameWord.includes(singleWord) || singleWord.includes(nameWord) ||
          (nameWord.length > 2 && singleWord.length > 2 &&
           (nameWord.startsWith(singleWord.slice(0, 3)) || singleWord.startsWith(nameWord.slice(0, 3))))
        )
        
        if (foundInName) {
          const score = 0.7
          if (score > bestMatch.score) {
            bestMatch = { isMatch: true, score, matchType: 'single-word-variation' }
          }
        }
      }
    }
  }
  
  return bestMatch
}

/**
 * Advanced search scorer that combines multiple algorithms
 */
export class UltimateGameSearch {
  private fuse: Fuse<GameWithRanking>
  private games: GameWithRanking[]
  
  constructor(games: GameWithRanking[]) {
    this.games = games
    // Optimized Fuse.js configuration for game names
    this.fuse = new Fuse(games, {
      keys: [
        { name: 'name', weight: 0.8 },
        { name: 'publisher', weight: 0.15 },
        { name: 'categories', weight: 0.05 }
      ],
      threshold: 0.3,
      location: 0,
      distance: 100,
      includeScore: true,
      ignoreLocation: false,
      minMatchCharLength: 1,
    })
  }

  /**
   * Ultimate search that combines exact matching, fuzzy search, and scoring
   */
  search(query: string, limit: number = 50): GameWithRanking[] {
    if (!query.trim()) return []
    
    const results = new Map<string, { game: GameWithRanking, score: number }>()
    
    // Step 1: Normalized exact/partial matches (handles punctuation)
    this.games.forEach(game => {
      const normalizedMatch = isNormalizedMatch(query, game.name)
      
      if (normalizedMatch.isMatch) {
        results.set(game.id.toString(), { game, score: normalizedMatch.score })
      }
    })
    
    // Step 2: Original exact matches for backward compatibility
    const queryLower = query.trim().toLowerCase()
    this.games.forEach(game => {
      const gameId = game.id.toString()
      const gameName = game.name.toLowerCase()
      
      // Skip if we already have a better normalized match
      if (results.has(gameId) && results.get(gameId)!.score > 0.9) {
        return
      }
      
      if (gameName === queryLower) {
        results.set(gameId, { game, score: 1.0 })
      } else if (gameName.startsWith(queryLower)) {
        const score = 0.95 - (gameName.length - queryLower.length) * 0.01
        if (!results.has(gameId) || results.get(gameId)!.score < score) {
          results.set(gameId, { game, score })
        }
      } else if (gameName.includes(queryLower)) {
        const position = gameName.indexOf(queryLower)
        const score = 0.85 - (position * 0.02)
        if (!results.has(gameId) || results.get(gameId)!.score < score) {
          results.set(gameId, { game, score })
        }
      }
    })
    
    // Step 3: Fuzzy search for non-exact matches
    const fuseResults = this.fuse.search(query, { limit: limit * 2 })
    fuseResults.forEach(result => {
      const gameId = result.item.id.toString()
      if (!results.has(gameId)) {
        // Convert Fuse score (lower is better) to our score (higher is better)
        const fuseScore = result.score || 0
        const adjustedScore = Math.max(0, 0.8 - fuseScore)
        results.set(gameId, { game: result.item, score: adjustedScore })
      }
    })
    
    // Step 4: Levenshtein distance for typo tolerance
    this.games.forEach(game => {
      const gameId = game.id.toString()
      if (!results.has(gameId)) {
        // Use normalized text for Levenshtein comparison
        const normalizedQuery = normalizeSearchText(query)
        const normalizedName = normalizeSearchText(game.name)
        
        const distance = levenshtein.get(normalizedQuery, normalizedName)
        const maxLength = Math.max(normalizedQuery.length, normalizedName.length)
        
        // Only consider if distance is reasonable
        if (distance <= Math.max(2, Math.floor(normalizedQuery.length * 0.4))) {
          const similarity = 1 - (distance / maxLength)
          if (similarity > 0.5) {
            results.set(gameId, { game, score: similarity * 0.7 })
          }
        }
      }
    })
    
    // Sort by score and return
    return Array.from(results.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.game)
  }
  
  /**
   * Search with detailed scoring information
   */
  searchWithScores(query: string, limit: number = 50): Array<{ game: GameWithRanking, score: number, matchType: string }> {
    if (!query.trim()) return []
    
    const results = new Map<string, { game: GameWithRanking, score: number, matchType: string }>()
    
    // Normalized matches (handles punctuation)
    this.games.forEach(game => {
      const normalizedMatch = isNormalizedMatch(query, game.name)
      
      if (normalizedMatch.isMatch) {
        results.set(game.id.toString(), { 
          game, 
          score: normalizedMatch.score, 
          matchType: normalizedMatch.matchType 
        })
      }
    })
    
    // Original exact matches
    const queryLower = query.trim().toLowerCase()
    this.games.forEach(game => {
      const gameId = game.id.toString()
      const gameName = game.name.toLowerCase()
      
      // Skip if we already have a better normalized match
      if (results.has(gameId) && results.get(gameId)!.score > 0.9) {
        return
      }
      
      if (gameName === queryLower) {
        results.set(gameId, { game, score: 1.0, matchType: 'exact' })
      } else if (gameName.startsWith(queryLower)) {
        const score = 0.95 - (gameName.length - queryLower.length) * 0.01
        if (!results.has(gameId) || results.get(gameId)!.score < score) {
          results.set(gameId, { game, score, matchType: 'starts-with' })
        }
      } else if (gameName.includes(queryLower)) {
        const position = gameName.indexOf(queryLower)
        const score = 0.85 - (position * 0.02)
        if (!results.has(gameId) || results.get(gameId)!.score < score) {
          results.set(gameId, { game, score, matchType: 'contains' })
        }
      }
    })
    
    // Fuzzy search
    const fuseResults = this.fuse.search(query, { limit: limit * 2 })
    fuseResults.forEach(result => {
      const gameId = result.item.id.toString()
      if (!results.has(gameId)) {
        const fuseScore = result.score || 0
        const adjustedScore = Math.max(0, 0.8 - fuseScore)
        results.set(gameId, { game: result.item, score: adjustedScore, matchType: 'fuzzy' })
      }
    })
    
    return Array.from(results.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }
  
  updateIndex(games: GameWithRanking[]) {
    this.games = games
    this.fuse = new Fuse(games, {
      keys: [
        { name: 'name', weight: 0.8 },
        { name: 'publisher', weight: 0.15 },
        { name: 'categories', weight: 0.05 }
      ],
      threshold: 0.3,
      includeScore: true,
    })
  }
}

/**
 * Quick search function using ultimate search
 */
export function ultimateSearchGames(games: GameWithRanking[], query: string, limit: number = 50): GameWithRanking[] {
  const searcher = new UltimateGameSearch(games)
  return searcher.search(query, limit)
}

/**
 * Search with debugging info
 */
export function ultimateSearchWithDebug(games: GameWithRanking[], query: string, limit: number = 50) {
  const searcher = new UltimateGameSearch(games)
  const results = searcher.searchWithScores(query, limit)
  
  console.log(`🔍 Search for "${query}":`, results.map(r => ({
    name: r.game.name,
    score: r.score.toFixed(3),
    matchType: r.matchType
  })))
  
  return results.map(r => r.game)
}
