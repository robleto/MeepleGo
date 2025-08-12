/**
 * Fuzzy search utilities for game names
 */

/**
 * Normalize text for fuzzy searching by removing punctuation, extra spaces, and converting to lowercase
 */
export function normalizeForSearch(text: string): string {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .trim()
    // Remove common punctuation and special characters
    .replace(/['"''""!@#$%^&*()_+\-=\[\]{};:,.<>?/\\|`~]/g, ' ')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculate a simple similarity score between two normalized strings
 * Returns a score from 0 to 1, where 1 is a perfect match
 */
export function calculateSimilarity(query: string, target: string): number {
  const normalizedQuery = normalizeForSearch(query)
  const normalizedTarget = normalizeForSearch(target)
  
  if (!normalizedQuery || !normalizedTarget) return 0
  if (normalizedQuery === normalizedTarget) return 1
  
  // Check for exact substring match
  if (normalizedTarget.includes(normalizedQuery)) {
    // Bonus for matches at the beginning
    if (normalizedTarget.startsWith(normalizedQuery)) {
      return 0.9
    }
    return 0.8
  }
  
  // Check if all query words are present in target
  const queryWords = normalizedQuery.split(' ').filter(w => w.length > 0)
  const targetWords = normalizedTarget.split(' ').filter(w => w.length > 0)
  
  if (queryWords.length === 0) return 0
  
  const matchingWords = queryWords.filter(queryWord => 
    targetWords.some(targetWord => 
      targetWord.includes(queryWord) || queryWord.includes(targetWord)
    )
  )
  
  const wordMatchRatio = matchingWords.length / queryWords.length
  
  // Require at least 60% of words to match for a meaningful score
  if (wordMatchRatio < 0.6) return 0
  
  return wordMatchRatio * 0.7 // Scale down to distinguish from substring matches
}

/**
 * Fuzzy search games by name with similarity scoring
 */
export function fuzzySearchGames<T extends { name: string }>(
  games: T[], 
  query: string, 
  limit: number = 10
): T[] {
  if (!query.trim()) return []
  
  const scoredGames = games
    .map(game => ({
      game,
      score: calculateSimilarity(query, game.name)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    
  return scoredGames.map(item => item.game)
}

/**
 * Test if a query would match a game name with fuzzy logic
 */
export function isGameMatch(query: string, gameName: string, threshold: number = 0.6): boolean {
  return calculateSimilarity(query, gameName) >= threshold
}
