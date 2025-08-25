import { useState, useEffect, useMemo } from 'react'
import type { GameWithRanking } from '@/types'
import { ultimateSearchGames } from './ultimateSearch'
import { searchGamesWithExactBoost } from './enhancedSearch'
import { fuzzySearchGames, isGameMatch } from './fuzzySearch'

export type SortKey = 'name' | 'year_published' | 'rating' | 'ranking' | 'playtime_minutes' | 'min_players' | 'max_players'
export type SortOrder = 'asc' | 'desc'
export type GroupKey = 'none' | 'year_published' | 'publisher' | 'min_players' | 'categories' | 'mechanics'

export const SORT_OPTIONS = [
  { value: 'name' as SortKey, label: 'Name' },
  { value: 'year_published' as SortKey, label: 'Year' },
  { value: 'rating' as SortKey, label: 'BGG Rating' },
  { value: 'ranking' as SortKey, label: 'My Rating' },
  { value: 'playtime_minutes' as SortKey, label: 'Play Time' },
  { value: 'min_players' as SortKey, label: 'Min Players' },
  { value: 'max_players' as SortKey, label: 'Max Players' },
]

export const GROUP_OPTIONS = [
  { value: 'none' as GroupKey, label: 'None' },
  { value: 'year_published' as GroupKey, label: 'Year' },
  { value: 'publisher' as GroupKey, label: 'Publisher' },
  { value: 'min_players' as GroupKey, label: 'Min Players' },
  { value: 'categories' as GroupKey, label: 'Category' },
  { value: 'mechanics' as GroupKey, label: 'Mechanic' },
]

export function useViewMode(defaultMode: 'grid' | 'list' = 'grid') {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gamesViewMode') as 'grid' | 'list'
      return stored || defaultMode
    }
    return defaultMode
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gamesViewMode', viewMode)
    }
  }, [viewMode])

  return [viewMode, setViewMode] as const
}

export function useGameFilters(games: GameWithRanking[], options?: { disableClientSorting?: boolean }) {
  const { disableClientSorting = false } = options || {}
  const [hasMounted, setHasMounted] = useState(false)

  // Search state
  const [searchTerm, setSearchTerm] = useState('')

  // Initialize state from localStorage
  const [sortBy, setSortBy] = useState<SortKey>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gamesSortBy') as SortKey
      return stored || 'name' // Default to name for games page
    }
    return 'name'
  })

  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gamesSortOrder') as SortOrder
      return stored || 'asc' // Default to asc for games page
    }
    return 'asc'
  })

  const [groupBy, setGroupBy] = useState<GroupKey>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gamesGroupBy') as GroupKey
      return stored || 'year_published' // Default to year_published for games page
    }
    return 'year_published'
  })

  const [filterType, setFilterType] = useState<'none' | 'year' | 'publisher' | 'players' | 'category' | 'mechanic' | 'game' | 'award'>('none')
  const [filterValue, setFilterValue] = useState<string>('all')

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Save games-specific filter state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gamesSortBy', sortBy)
      localStorage.setItem('gamesSortOrder', sortOrder)
      localStorage.setItem('gamesGroupBy', groupBy)
    }
  }, [sortBy, sortOrder, groupBy])

  // Filter games based on current filter settings and search term
  const filteredGames = (() => {
    let filtered = games
    
    // Apply search term first using the ultimate search algorithm
    if (searchTerm.trim()) {
      // Use the ultimate search that combines multiple algorithms
      const ultimateResults = ultimateSearchGames(games, searchTerm.trim(), 1000)
      
      // If ultimate search finds results, use those; otherwise fall back to enhanced search
      if (ultimateResults.length > 0) {
        filtered = ultimateResults
      } else {
        // Fallback: enhanced search with exact match boosting
        const enhancedResults = searchGamesWithExactBoost(games, searchTerm.trim(), 1000)
        if (enhancedResults.length > 0) {
          filtered = enhancedResults
        } else {
          // Final fallback: original fuzzy search
          const fuzzyResults = fuzzySearchGames(games, searchTerm.trim())
          if (fuzzyResults.length > 0) {
            filtered = fuzzyResults
          } else {
            // Last resort: basic name matching
            filtered = games.filter(game => 
              isGameMatch(searchTerm.trim(), game.name, 0.3)
            )
          }
        }
      }
    }
    
    // Apply additional filters
    return filtered.filter((game) => {
      if (filterType === 'year') {
        return filterValue === 'all' || game.year_published === Number(filterValue)
      }
      if (filterType === 'publisher') {
        return filterValue === 'all' || game.publisher === filterValue
      }
      if (filterType === 'players') {
        const players = Number(filterValue)
        if (filterValue === 'all') return true
        return game.min_players !== null && game.max_players !== null && 
               game.min_players <= players && game.max_players >= players
      }
      if (filterType === 'category') {
        if (filterValue === 'all') return true
        const cats = game.categories || []
        return cats.includes(filterValue)
      }
      if (filterType === 'mechanic') {
        if (filterValue === 'all') return true
        const mechs = game.mechanics || []
        return mechs.includes(filterValue)
      }
      if (filterType === 'game') {
        return String(game.id) === filterValue
      }
      if (filterType === 'award') {
        const honors: any[] = Array.isArray((game as any).honors) ? (game as any).honors : []
        return honors.some(h => {
          const cat = (h.category || h.result_category || '').toLowerCase()
          const res = (h.result_raw || h.derived_result || '').toLowerCase()
          return cat.includes('winner') || res.includes('winner')
        })
      }
      return true
    })
  })()

  // Group and sort logic for games
  const groupedGames = (() => {
    if (groupBy === 'none') {
      if (disableClientSorting) {
        // Server handles sorting, just return filtered games as-is
        return [{ key: 'All Games', games: filteredGames }]
      }
      
      const sorted = [...filteredGames].sort((a, b) => {
        if (sortBy === 'ranking') {
          const aRank = a.ranking?.ranking || 0
          const bRank = b.ranking?.ranking || 0
          return sortOrder === 'asc' ? aRank - bRank : bRank - aRank
        }
        if (sortBy === 'name') {
          return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)
        }
        if (sortBy === 'year_published') {
          const aYear = a.year_published || 0
          const bYear = b.year_published || 0
          return sortOrder === 'asc' ? aYear - bYear : bYear - aYear
        }
        if (sortBy === 'rating') {
          const aRating = a.rating || 0
          const bRating = b.rating || 0
          return sortOrder === 'asc' ? aRating - bRating : bRating - aRating
        }
        if (sortBy === 'playtime_minutes') {
          const aTime = a.playtime_minutes || 0
          const bTime = b.playtime_minutes || 0
          return sortOrder === 'asc' ? aTime - bTime : bTime - aTime
        }
        if (sortBy === 'min_players') {
          const aPlayers = a.min_players || 0
          const bPlayers = b.min_players || 0
          return sortOrder === 'asc' ? aPlayers - bPlayers : bPlayers - aPlayers
        }
        if (sortBy === 'max_players') {
          const aPlayers = a.max_players || 0
          const bPlayers = b.max_players || 0
          return sortOrder === 'asc' ? aPlayers - bPlayers : bPlayers - aPlayers
        }
        return 0
      })
      return [{ key: 'All Games', games: sorted }]
    }
    
    if (groupBy === 'year_published') {
      const groups = new Map<number, GameWithRanking[]>()
      filteredGames.forEach(game => {
        const year = game.year_published || 0
        if (!groups.has(year)) {
          groups.set(year, [])
        }
        groups.get(year)!.push(game)
      })
      
      return Array.from(groups.entries())
        .sort(([a], [b]) => b - a) // Sort years descending
        .map(([year, games]) => ({
          key: year === 0 ? 'Unknown Year' : year.toString(),
          games: disableClientSorting ? games : games.sort((a, b) => {
            if (sortBy === 'name') {
              return sortOrder === 'asc' 
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name)
            }
            if (sortBy === 'rating') {
              const aRating = a.rating || 0
              const bRating = b.rating || 0
              return sortOrder === 'asc' ? aRating - bRating : bRating - aRating
            }
            return 0
          })
        }))
    }

    if (groupBy === 'publisher') {
      const groups = new Map<string, GameWithRanking[]>()
      filteredGames.forEach(game => {
        const publisher = game.publisher || 'Unknown Publisher'
        if (!groups.has(publisher)) {
          groups.set(publisher, [])
        }
        groups.get(publisher)!.push(game)
      })
      
      return Array.from(groups.entries())
        .sort(([a], [b]) => a.localeCompare(b)) // Sort publishers alphabetically
        .map(([publisher, games]) => ({
          key: publisher,
          games: disableClientSorting ? games : games.sort((a, b) => {
            if (sortBy === 'name') {
              return sortOrder === 'asc' 
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name)
            }
            return 0
          })
        }))
    }

    if (groupBy === 'min_players') {
      const groups = new Map<number, GameWithRanking[]>()
      filteredGames.forEach(game => {
        const players = game.min_players || 0
        if (!groups.has(players)) {
          groups.set(players, [])
        }
        groups.get(players)!.push(game)
      })
      
      return Array.from(groups.entries())
        .sort(([a], [b]) => a - b) // Sort player counts ascending
        .map(([players, games]) => ({
          key: players === 0 ? 'Unknown Players' : `${players}+ Players`,
          games: disableClientSorting ? games : games.sort((a, b) => {
            if (sortBy === 'name') {
              return sortOrder === 'asc' 
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name)
            }
            return 0
          })
        }))
    }

    if (groupBy === 'categories') {
      const groups = new Map<string, GameWithRanking[]>()
      filteredGames.forEach(game => {
        const cats = (game.categories && game.categories.length > 0) ? game.categories : ['Uncategorized']
        cats.forEach(cat => {
          const key = cat || 'Uncategorized'
          if (!groups.has(key)) groups.set(key, [])
          groups.get(key)!.push(game)
        })
      })

      return Array.from(groups.entries())
        .sort(([a], [b]) => a.localeCompare(b)) // alphabetical
        .map(([cat, games]) => ({
          key: cat,
          games: disableClientSorting ? games : games.sort((a, b) => a.name.localeCompare(b.name))
        }))
    }

    if (groupBy === 'mechanics') {
      const groups = new Map<string, GameWithRanking[]>()
      filteredGames.forEach(game => {
        const mechs = (game.mechanics && game.mechanics.length > 0) ? game.mechanics : ['No Mechanic']
        mechs.forEach(mech => {
          const key = mech || 'No Mechanic'
          if (!groups.has(key)) groups.set(key, [])
          groups.get(key)!.push(game)
        })
      })

      return Array.from(groups.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mech, games]) => ({
          key: mech,
          games: disableClientSorting ? games : games.sort((a, b) => a.name.localeCompare(b.name))
        }))
    }

    return [{ key: 'All Games', games: filteredGames }]
  })()

  // Extract unique values for filters
  const uniqueYears = Array.from(new Set(games.map(g => g.year_published).filter((year): year is number => year !== null))).sort((a, b) => b - a)
  const uniquePublishers = Array.from(new Set(games.map(g => g.publisher).filter((pub): pub is string => pub !== null))).sort()
  const uniquePlayerCounts = Array.from(new Set(
    games.flatMap(g => {
      if (!g.min_players || !g.max_players) return [] as number[]
      const counts: number[] = []
      for (let i = g.min_players; i <= g.max_players; i++) {
        counts.push(i)
      }
      return counts
    })
  )).sort((a, b) => a - b)

  const uniqueCategories = Array.from(new Set(
    games.flatMap(g => (g.categories || [])).filter((c): c is string => !!c)
  )).sort((a, b) => a.localeCompare(b))

  const uniqueMechanics = Array.from(new Set(
    games.flatMap(g => (g.mechanics || [])).filter((m): m is string => !!m)
  )).sort((a, b) => a.localeCompare(b))

  return {
    // State
    hasMounted,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    groupBy,
    setGroupBy,
    filterType,
    setFilterType,
    filterValue,
    setFilterValue,
    
    // Computed
    filteredGames,
    groupedGames,
    uniqueYears,
    uniquePublishers,
    uniquePlayerCounts,
    uniqueCategories,
    uniqueMechanics,
  }
}
