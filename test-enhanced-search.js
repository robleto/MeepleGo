/**
 * Test script to verify search improvements
 */
const { ultimateSearchWithDebug } = require('./src/utils/ultimateSearch')

// Mock game data for testing
const mockGames = [
  { id: 1, name: 'Root', publisher: 'Leder Games', categories: ['Strategy'], mechanics: [], year_published: 2018 },
  { id: 2, name: 'Root: The Riverfolk Expansion', publisher: 'Leder Games', categories: ['Strategy'], mechanics: [], year_published: 2019 },
  { id: 3, name: 'Star Wars: Outer Rim', publisher: 'Fantasy Flight Games', categories: ['Adventure'], mechanics: [], year_published: 2019 },
  { id: 4, name: 'The Game of Life: Goals', publisher: 'Hasbro', categories: ['Family'], mechanics: [], year_published: 2021 },
  { id: 5, name: 'Life', publisher: 'Hasbro', categories: ['Family'], mechanics: [], year_published: 1960 },
  { id: 6, name: 'Wingspan', publisher: 'Stonemaier Games', categories: ['Strategy'], mechanics: [], year_published: 2019 },
  { id: 7, name: 'Azul', publisher: 'Plan B Games', categories: ['Abstract'], mechanics: [], year_published: 2017 },
  { id: 8, name: 'Splendor', publisher: 'Space Cowboys', categories: ['Strategy'], mechanics: [], year_published: 2014 },
  { id: 9, name: 'Ticket to Ride', publisher: 'Days of Wonder', categories: ['Family'], mechanics: [], year_published: 2004 },
  { id: 10, name: 'Star Wars: Rebellion', publisher: 'Fantasy Flight Games', categories: ['Strategy'], mechanics: [], year_published: 2016 },
]

console.log('🧪 Testing Enhanced Search with Subtitle Handling\n')

// Test 1: Exact match should prioritize "Root" over "Root: The Riverfolk Expansion"
console.log('Test 1: Searching for "root"')
const rootResults = ultimateSearchWithDebug(mockGames, 'root', 5)
console.log('Top result:', rootResults[0]?.name)
console.log('Expected: Root (exact match should be first)\n')

// Test 2: Punctuation handling - colon issue
console.log('Test 2: Searching for "star wars outer rim"')
const starWarsResults = ultimateSearchWithDebug(mockGames, 'star wars outer rim', 5)
console.log('Top result:', starWarsResults[0]?.name)
console.log('Expected: Star Wars: Outer Rim (should handle colon)\n')

// Test 3: Subtitle search - the key test case
console.log('Test 3: Searching for "goals" (subtitle)')
const goalsResults = ultimateSearchWithDebug(mockGames, 'goals', 5)
console.log('Top result:', goalsResults[0]?.name)
console.log('Expected: The Game of Life: Goals (should find subtitle)\n')

// Test 4: Multi-word search
console.log('Test 4: Searching for "star wars"')
const starWarsGenericResults = ultimateSearchWithDebug(mockGames, 'star wars', 5)
console.log('Results:', starWarsGenericResults.map(g => g.name))
console.log('Expected: Both Star Wars games\n')

// Test 5: Game with similar name but not subtitle
console.log('Test 5: Searching for "life"')
const lifeResults = ultimateSearchWithDebug(mockGames, 'life', 5)
console.log('Results:', lifeResults.map(g => g.name))
console.log('Expected: Should show both "Life" and "The Game of Life: Goals"\n')

// Test 6: Fuzzy matching with typos
console.log('Test 6: Searching for "wingspn" (missing a)')
const typoResults = ultimateSearchWithDebug(mockGames, 'wingspn', 5)
console.log('Top result:', typoResults[0]?.name)
console.log('Expected: Wingspan (should handle typos)\n')

console.log('✅ Subtitle-enhanced search tests completed!')
