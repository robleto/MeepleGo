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
 * Calculate Levenshtein distance between two strings (edit distance)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Calculate similarity based on edit distance
 */
function editDistanceSimilarity(query: string, target: string): number {
  if (!query || !target) return 0
  if (query === target) return 1
  
  const maxLength = Math.max(query.length, target.length)
  if (maxLength === 0) return 1
  
  const distance = levenshteinDistance(query, target)
  return 1 - (distance / maxLength)
}

/**
 * Check if words are similar enough considering typos
 */
function areWordsSimilar(word1: string, word2: string): boolean {
  if (!word1 || !word2) return false
  if (word1 === word2) return true
  
  // Direct substring match
  if (word1.includes(word2) || word2.includes(word1)) return true
  
  // For short words, be more strict
  if (word1.length <= 3 || word2.length <= 3) {
    return word1 === word2 || word1.includes(word2) || word2.includes(word1)
  }
  
  // For longer words, allow some edit distance
  const similarity = editDistanceSimilarity(word1, word2)
  
  // Allow up to 2 character differences for words 4-6 chars
  if (word1.length <= 6 || word2.length <= 6) {
    return similarity >= 0.66 // ~2 chars different
  }
  
  // For longer words, allow more differences but higher threshold
  return similarity >= 0.75
}

/**
 * Calculate a comprehensive similarity score between two normalized strings
 * Returns a score from 0 to 1, where 1 is a perfect match
 */
export function calculateSimilarity(query: string, target: string): number {
  const normalizedQuery = normalizeForSearch(query)
  const normalizedTarget = normalizeForSearch(target)
  
  if (!normalizedQuery || !normalizedTarget) return 0
  if (normalizedQuery === normalizedTarget) return 1
  
  // Check for exact substring match first
  if (normalizedTarget.includes(normalizedQuery)) {
    // Bonus for matches at the beginning
    if (normalizedTarget.startsWith(normalizedQuery)) {
      return 0.95
    }
    return 0.9
  }
  
  // Check reverse (query contains target)
  if (normalizedQuery.includes(normalizedTarget)) {
    return 0.85
  }
  
  // Split into words for word-based matching
  const queryWords = normalizedQuery.split(' ').filter(w => w.length > 0)
  const targetWords = normalizedTarget.split(' ').filter(w => w.length > 0)
  
  if (queryWords.length === 0) return 0
  
  // Count similar words (allows typos)
  let matchedWords = 0
  let totalQueryWords = queryWords.length
  
  for (const queryWord of queryWords) {
    let foundMatch = false
    
    for (const targetWord of targetWords) {
      if (areWordsSimilar(queryWord, targetWord)) {
        foundMatch = true
        break
      }
    }
    
    if (foundMatch) {
      matchedWords++
    }
  }
  
  const wordMatchRatio = matchedWords / totalQueryWords
  
  // Require at least 50% of words to match for a meaningful score
  if (wordMatchRatio < 0.5) return 0
  
  // Calculate overall string similarity as well
  const overallSimilarity = editDistanceSimilarity(normalizedQuery, normalizedTarget)
  
  // Combine word matching and overall similarity
  const combinedScore = (wordMatchRatio * 0.7) + (overallSimilarity * 0.3)
  
  // Scale the score to leave room for exact matches
  return Math.min(combinedScore * 0.8, 0.8)
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
export function isGameMatch(query: string, gameName: string, threshold: number = 0.4): boolean {
  return calculateSimilarity(query, gameName) >= threshold
}
