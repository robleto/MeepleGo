import { useState, useEffect, useMemo, useRef } from 'react'
import type { GameWithRanking } from '@/types'
import { ultimateSearchGames } from './ultimateSearch'
import { searchGamesWithExactBoost } from './enhancedSearch'
import { fuzzySearchGames, isGameMatch } from './fuzzySearch'

// Honor objects can come from enhanced data merges; model only accessed fields
interface HonorLike {
  category?: string | null
  result_category?: string | null
  result_raw?: string | null
  derived_result?: string | null
}

function compareByAwardScore(
  a: GameWithRanking,
  b: GameWithRanking,
  sortOrder: SortOrder
) {
  const direction = sortOrder === 'asc' ? 1 : -1
  const aScore = a.award_score ?? 0
  const bScore = b.award_score ?? 0
  if (aScore !== bScore) {
    return (aScore - bScore) * direction
  }

  const aRating = (a as any).rating ?? -Infinity
  const bRating = (b as any).rating ?? -Infinity
  if (aRating !== bRating) {
    return (aRating - bRating) * direction
  }

  const aYear = a.year_published || 0
  const bYear = b.year_published || 0
  if (aYear !== bYear) {
    return (aYear - bYear) * direction
  }

  return a.name.localeCompare(b.name)
}

export type SortKey =
  | 'name'
  | 'year_published'
  | 'rating'
  | 'ranking'
  | 'rank'
  | 'playtime_minutes'
  | 'min_players'
  | 'max_players'
  | 'award_score'
export type SortOrder = 'asc' | 'desc'
export type GroupKey =
  | 'none'
  | 'my_rankings'
  | 'ranking_value'
  | 'year_published'
  | 'publisher'
  | 'min_players'
  | 'categories'
  | 'mechanics'
export type GroupSortOrder = 'asc' | 'desc'

export const SORT_OPTIONS = [
  { value: 'name' as SortKey, label: 'Name' },
  { value: 'year_published' as SortKey, label: 'Year' },
  { value: 'rating' as SortKey, label: 'Rating' },
  { value: 'ranking' as SortKey, label: 'My Rating' },
  { value: 'award_score' as SortKey, label: 'Smart' },
  { value: 'playtime_minutes' as SortKey, label: 'Play Time' },
  { value: 'min_players' as SortKey, label: 'Min Players' },
  { value: 'max_players' as SortKey, label: 'Max Players' },
]

export const GROUP_OPTIONS = [
  { value: 'none' as GroupKey, label: 'None' },
  { value: 'my_rankings' as GroupKey, label: 'My Rankings' },
  { value: 'ranking_value' as GroupKey, label: 'Rating Value' },
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

export function useGameFilters(
  games: GameWithRanking[],
  options?: {
    disableClientSorting?: boolean
    forceClientSortKeys?: SortKey[]
    defaultViewMode?: 'grid' | 'list'
    defaultSortBy?: SortKey
    defaultSortOrder?: SortOrder
    defaultGroupBy?: GroupKey
    defaultGroupSortOrder?: GroupSortOrder
    storageKeyPrefix?: string
  }
) {
  const {
    disableClientSorting = false,
    forceClientSortKeys = [],
    defaultViewMode = 'grid',
    defaultSortBy = 'name',
    defaultSortOrder = 'asc',
    defaultGroupBy = 'none',
    defaultGroupSortOrder = 'asc',
    storageKeyPrefix = 'games',
  } = options || {}
  const viewKey = `${storageKeyPrefix}ViewMode`
  const sortByKey = `${storageKeyPrefix}SortBy`
  const sortOrderKey = `${storageKeyPrefix}SortOrder`
  const groupByKey = `${storageKeyPrefix}GroupBy`
  const groupSortOrderKey = `${storageKeyPrefix}GroupSortOrder`
  const [hasMounted, setHasMounted] = useState(false)

  // Local view mode state (duplicated here so consumers can rely on single hook)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(viewKey) as 'grid' | 'list'
      return stored || defaultViewMode
    }
    return defaultViewMode
  })
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(viewKey, viewMode)
    }
  }, [viewMode, viewKey])

  // Search state
  const [searchTerm, setSearchTerm] = useState('')

  // Initialize state from localStorage
  const [sortBy, setSortBy] = useState<SortKey>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(sortByKey) as SortKey
      const result = stored || defaultSortBy
      return result
    }
    return defaultSortBy
  })

  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(sortOrderKey) as SortOrder
      return stored || defaultSortOrder
    }
    return defaultSortOrder
  })

  const [groupBy, setGroupBy] = useState<GroupKey>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(groupByKey) as GroupKey
      return stored || defaultGroupBy
    }
    return defaultGroupBy
  })

  const [groupSortOrder, setGroupSortOrder] = useState<GroupSortOrder>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(groupSortOrderKey) as GroupSortOrder
      if (stored) return stored
      // Default to descending when grouping by Year
      const storedGroupBy = localStorage.getItem(groupByKey) as GroupKey | null
      if (storedGroupBy === 'year_published') return 'desc'
      return defaultGroupSortOrder
    }
    return defaultGroupSortOrder
  })

  const [filterType, setFilterType] = useState<
    | 'none'
    | 'year'
    | 'publisher'
    | 'players'
    | 'category'
    | 'mechanic'
    | 'family'
    | 'game'
    | 'award'
    | 'playtime'
    | 'weight'
  >('none')
  const [filterValue, setFilterValue] = useState<string>('all')

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Save games-specific filter state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(sortByKey, sortBy)
      localStorage.setItem(sortOrderKey, sortOrder)
      localStorage.setItem(groupByKey, groupBy)
      localStorage.setItem(groupSortOrderKey, groupSortOrder)
    }
  }, [sortBy, sortOrder, groupBy, groupSortOrder, sortByKey, sortOrderKey, groupByKey, groupSortOrderKey])

  // When transitioning into Year grouping, prefer Z-A (desc) if no explicit user choice yet
  const prevGroupByRef = useRef<GroupKey>(groupBy)
  useEffect(() => {
    if (prevGroupByRef.current !== groupBy) {
      if (
        groupBy === 'year_published' &&
        prevGroupByRef.current !== 'year_published' &&
        groupSortOrder === 'asc'
      ) {
        setGroupSortOrder('desc')
      }
      prevGroupByRef.current = groupBy
    }
  }, [groupBy, groupSortOrder])

  // Filter games based on current filter settings and search term
  const filteredGames = (() => {
    let filtered = games

    // Apply search term first using the ultimate search algorithm
    if (searchTerm.trim()) {
      const norm = (s: string) =>
        s
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')

      const term = norm(searchTerm.trim())

      // Prefer strict substring match on title first
      const direct = games.filter((g) => norm(g.name || '').includes(term))
      if (direct.length > 0) {
        filtered = direct
      } else {
        // Use the ultimate search that combines multiple algorithms
        const ultimateResults = ultimateSearchGames(
          games,
          searchTerm.trim(),
          1000
        )

        // If ultimate search finds results, use those; otherwise fall back to enhanced search
        if (ultimateResults.length > 0) {
          filtered = ultimateResults
        } else {
          // Fallback: enhanced search with exact match boosting
          const enhancedResults = searchGamesWithExactBoost(
            games,
            searchTerm.trim(),
            1000
          )
          if (enhancedResults.length > 0) {
            filtered = enhancedResults
          } else {
            // Final fallback: original fuzzy search
            const fuzzyResults = fuzzySearchGames(games, searchTerm.trim())
            if (fuzzyResults.length > 0) {
              filtered = fuzzyResults
            } else {
              // Last resort: basic name matching
              filtered = games.filter((game) =>
                isGameMatch(searchTerm.trim(), game.name, 0.3)
              )
            }
          }
        }
      }
    }

    // Apply additional filters
    return filtered.filter((game) => {
      if (filterType === 'year') {
        return (
          filterValue === 'all' || game.year_published === Number(filterValue)
        )
      }
      if (filterType === 'publisher') {
        return filterValue === 'all' || game.publisher === filterValue
      }
      if (filterType === 'players') {
        const players = Number(filterValue)
        if (filterValue === 'all') return true
        return (
          game.min_players !== null &&
          game.max_players !== null &&
          game.min_players <= players &&
          game.max_players >= players
        )
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
        const honorsRaw = (game as unknown as { honors?: unknown }).honors
        // Dynamic honors array from upstream enrichment; runtime narrowing applied.
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- TODO(meeplego#types): Replace with typed enrichment shape
        const honors: HonorLike[] = Array.isArray(honorsRaw)
          ? (honorsRaw.filter(
              (h): h is HonorLike => typeof h === 'object' && h !== null
            ) as HonorLike[])
          : []
        return honors.some((h) => {
          const cat = (h.category || h.result_category || '')?.toLowerCase()
          const res = (h.result_raw || h.derived_result || '')?.toLowerCase()
          return cat.includes('winner') || res.includes('winner')
        })
      }
      if (filterType === 'playtime') {
        const playtime = Number(filterValue)
        if (filterValue === 'all') return true
        if (!game.playtime_minutes) return false
        // Match games that can be played in the specified time (allow some tolerance)
        return game.playtime_minutes <= playtime * 1.2 // 20% tolerance
      }
      if (filterType === 'weight') {
        const weight = Number(filterValue)
        if (filterValue === 'all') return true
        if (!(game as any).weight) return false
        // Match games with similar weight (within 0.5 range)
        return Math.abs((game as any).weight - weight) <= 0.5
      }
      return true
    })
  })()

  // Group and sort logic for games
  const groupedGames = (() => {
    // Helper function to sort games within a group
    const sortGamesInGroup = (games: GameWithRanking[]) => {
      return [...games].sort((a, b) => {
        if (sortBy === 'ranking') {
          const aRank = a.ranking?.ranking || 0
          const bRank = b.ranking?.ranking || 0
          return sortOrder === 'asc' ? aRank - bRank : bRank - aRank
        }
        if (sortBy === 'award_score') {
          return compareByAwardScore(a, b, sortOrder)
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
          const aRating = (a as any).rating ?? -Infinity
          const bRating = (b as any).rating ?? -Infinity
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
    }

    if (groupBy === 'none') {
      const shouldClientSort =
        !disableClientSorting || forceClientSortKeys.includes(sortBy)
      if (!shouldClientSort) {
        // Server handles sorting, just return filtered games as-is
        return [{ key: 'All Games', games: filteredGames }]
      }

      const sorted = sortGamesInGroup(filteredGames)
      return [{ key: 'All Games', games: sorted }]
    }

    if (groupBy === 'my_rankings') {
      const groups = new Map<string, GameWithRanking[]>()
      filteredGames.forEach((game) => {
        const ranking = game.ranking?.ranking
        let groupKey: string

        if (ranking === null || ranking === undefined) {
          groupKey = 'Unranked'
        } else if (ranking >= 9) {
          groupKey = 'Outstanding (9-10)'
        } else if (ranking >= 7) {
          groupKey = 'Great (7-8)'
        } else if (ranking >= 5) {
          groupKey = 'Good (5-6)'
        } else if (ranking >= 3) {
          groupKey = 'Fair (3-4)'
        } else {
          groupKey = 'Poor (1-2)'
        }

        if (!groups.has(groupKey)) {
          groups.set(groupKey, [])
        }
        groups.get(groupKey)!.push(game)
      })

      // Define the order for ranking groups
      const rankingOrder = [
        'Outstanding (9-10)',
        'Great (7-8)',
        'Good (5-6)',
        'Fair (3-4)',
        'Poor (1-2)',
        'Unranked',
      ]

      return rankingOrder
        .filter((key) => groups.has(key))
        .map((key) => ({
          key,
          games: sortGamesInGroup(groups.get(key)!),
        }))
    }

    if (groupBy === 'ranking_value') {
      const groups = new Map<string, GameWithRanking[]>()
      filteredGames.forEach((game) => {
        const val = game.ranking?.ranking
        const key =
          typeof val === 'number' && val >= 1 && val <= 10
            ? String(val)
            : 'Unranked'
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(game)
      })
      const order = [
        '10',
        '9',
        '8',
        '7',
        '6',
        '5',
        '4',
        '3',
        '2',
        '1',
        'Unranked',
      ]
      return order
        .filter((k) => groups.has(k))
        .map((k) => ({
          key: k,
          games: [...groups.get(k)!].sort((a, b) =>
            a.name.localeCompare(b.name)
          ),
        }))
    }

    if (groupBy === 'year_published') {
      const groups = new Map<number, GameWithRanking[]>()
      filteredGames.forEach((game) => {
        const year = game.year_published || 0
        if (!groups.has(year)) {
          groups.set(year, [])
        }
        groups.get(year)!.push(game)
      })

      return Array.from(groups.entries())
        .sort(([a], [b]) => (groupSortOrder === 'asc' ? a - b : b - a)) // Respect group sort order
        .map(([year, games]) => ({
          key: year === 0 ? 'Unknown Year' : year.toString(),
          games: sortGamesInGroup(games), // Always sort within groups
        }))
    }

    if (groupBy === 'publisher') {
      const groups = new Map<string, GameWithRanking[]>()
      filteredGames.forEach((game) => {
        const publisher = game.publisher || 'Unknown Publisher'
        if (!groups.has(publisher)) {
          groups.set(publisher, [])
        }
        groups.get(publisher)!.push(game)
      })

      return Array.from(groups.entries())
        .sort(([a], [b]) =>
          groupSortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
        ) // Respect group sort order
        .map(([publisher, games]) => ({
          key: publisher,
          games: sortGamesInGroup(games), // Always sort within groups
        }))
    }

    if (groupBy === 'min_players') {
      const groups = new Map<number, GameWithRanking[]>()
      filteredGames.forEach((game) => {
        const players = game.min_players || 0
        if (!groups.has(players)) {
          groups.set(players, [])
        }
        groups.get(players)!.push(game)
      })

      return Array.from(groups.entries())
        .sort(([a], [b]) => (groupSortOrder === 'asc' ? a - b : b - a)) // Respect group sort order
        .map(([players, games]) => ({
          key: players === 0 ? 'Unknown Players' : `${players}+ Players`,
          games: sortGamesInGroup(games), // Always sort within groups
        }))
    }

    if (groupBy === 'categories') {
      const groups = new Map<string, GameWithRanking[]>()
      filteredGames.forEach((game) => {
        const cats =
          game.categories && game.categories.length > 0
            ? game.categories
            : ['Uncategorized']
        cats.forEach((cat) => {
          const key = cat || 'Uncategorized'
          if (!groups.has(key)) groups.set(key, [])
          groups.get(key)!.push(game)
        })
      })

      return Array.from(groups.entries())
        .sort(([a], [b]) =>
          groupSortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
        ) // Respect group sort order
        .map(([cat, games]) => ({
          key: cat,
          games: sortGamesInGroup(games), // Always sort within groups
        }))
    }

    if (groupBy === 'mechanics') {
      const groups = new Map<string, GameWithRanking[]>()
      filteredGames.forEach((game) => {
        const mechs =
          game.mechanics && game.mechanics.length > 0
            ? game.mechanics
            : ['No Mechanic']
        mechs.forEach((mech) => {
          const key = mech || 'No Mechanic'
          if (!groups.has(key)) groups.set(key, [])
          groups.get(key)!.push(game)
        })
      })

      return Array.from(groups.entries())
        .sort(([a], [b]) =>
          groupSortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
        ) // Respect group sort order
        .map(([mech, games]) => ({
          key: mech,
          games: sortGamesInGroup(games), // Always sort within groups
        }))
    }

    return [{ key: 'All Games', games: filteredGames }]
  })()

  // Extract unique values for filters
  const uniqueYears = Array.from(
    new Set(
      games
        .map((g) => g.year_published)
        .filter((year): year is number => year !== null)
    )
  ).sort((a, b) => b - a)
  const uniquePublishers = Array.from(
    new Set(
      games.map((g) => g.publisher).filter((pub): pub is string => pub !== null)
    )
  ).sort()
  const uniquePlayerCounts = Array.from(
    new Set(
      games.flatMap((g) => {
        if (!g.min_players || !g.max_players) return [] as number[]
        const counts: number[] = []
        for (let i = g.min_players; i <= g.max_players; i++) {
          counts.push(i)
        }
        return counts
      })
    )
  ).sort((a, b) => a - b)

  const uniqueCategories = Array.from(
    new Set(
      games.flatMap((g) => g.categories || []).filter((c): c is string => !!c)
    )
  ).sort((a, b) => a.localeCompare(b))

  const uniqueMechanics = Array.from(
    new Set(
      games.flatMap((g) => g.mechanics || []).filter((m): m is string => !!m)
    )
  ).sort((a, b) => a.localeCompare(b))

  return {
    // State
    hasMounted,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    groupBy,
    setGroupBy,
    groupSortOrder,
    setGroupSortOrder,
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

export function useRankingsFilters(
  games: GameWithRanking[],
  options?: { disableClientSorting?: boolean }
) {
  const { disableClientSorting = false } = options || {}
  const [hasMounted, setHasMounted] = useState(false)

  // Local view mode state with rankings-specific defaults
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rankingsViewMode') as 'grid' | 'list'
      return stored || 'list' // Default to list for rankings
    }
    return 'list'
  })
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rankingsViewMode', viewMode)
    }
  }, [viewMode])

  // Search state
  const [searchTerm, setSearchTerm] = useState('')

  // Initialize state from localStorage with rankings-specific defaults
  const [sortBy, setSortBy] = useState<SortKey>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rankingsSortBy') as SortKey
      return stored || 'ranking' // Default to My Rating
    }
    return 'ranking'
  })

  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rankingsSortOrder') as SortOrder
      return stored || 'desc' // High-to-low ratings
    }
    return 'desc'
  })

  const [groupBy, setGroupBy] = useState<GroupKey>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rankingsGroupBy') as GroupKey
      return stored || 'ranking_value' // Default to rating value buckets
    }
    return 'ranking_value'
  })

  const [groupSortOrder, setGroupSortOrder] = useState<GroupSortOrder>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(
        'rankingsGroupSortOrder'
      ) as GroupSortOrder
      if (stored) return stored
      const storedGroupBy = localStorage.getItem(
        'rankingsGroupBy'
      ) as GroupKey | null
      // Prefer Z-A when defaulting into Year grouping
      return storedGroupBy === 'year_published' ? 'desc' : 'desc'
    }
    return 'desc'
  })

  const [filterType, setFilterType] = useState<
    | 'none'
    | 'year'
    | 'publisher'
    | 'players'
    | 'category'
    | 'mechanic'
    | 'family'
    | 'game'
    | 'award'
    | 'playtime'
    | 'weight'
  >('none')
  const [filterValue, setFilterValue] = useState<string>('all')

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Save rankings-specific filter state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rankingsSortBy', sortBy)
      localStorage.setItem('rankingsSortOrder', sortOrder)
      localStorage.setItem('rankingsGroupBy', groupBy)
      localStorage.setItem('rankingsGroupSortOrder', groupSortOrder)
    }
  }, [sortBy, sortOrder, groupBy, groupSortOrder])

  // Rest of the logic is the same as useGameFilters
  // Filter games based on current filter settings and search term
  const filteredGames = (() => {
    let filtered = games

    // Apply search term first using the ultimate search algorithm
    if (searchTerm.trim()) {
      const norm = (s: string) =>
        s
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')

      const term = norm(searchTerm.trim())

      // 1) Prefer strict substring match on title for rankings
      const direct = games.filter((g) => norm(g.name || '').includes(term))
      if (direct.length > 0) {
        filtered = direct
      } else {
        // 2) Fall back to the combined search pipeline
        const ultimateResults = ultimateSearchGames(games, searchTerm.trim(), 1000)
        if (ultimateResults.length > 0) {
          filtered = ultimateResults
        } else {
          const enhancedResults = searchGamesWithExactBoost(
            games,
            searchTerm.trim(),
            1000
          )
          if (enhancedResults.length > 0) {
            filtered = enhancedResults
          } else {
            const fuzzyResults = fuzzySearchGames(games, searchTerm.trim())
            if (fuzzyResults.length > 0) {
              filtered = fuzzyResults
            } else {
              filtered = games.filter((game) =>
                isGameMatch(searchTerm.trim(), game.name, 0.3)
              )
            }
          }
        }
      }
    }

    // Apply additional filters
    return filtered.filter((game) => {
      if (filterType === 'year') {
        return (
          filterValue === 'all' || game.year_published === Number(filterValue)
        )
      }
      if (filterType === 'publisher') {
        return filterValue === 'all' || game.publisher === filterValue
      }
      if (filterType === 'players') {
        const players = Number(filterValue)
        if (filterValue === 'all') return true
        return (
          game.min_players !== null &&
          game.max_players !== null &&
          game.min_players <= players &&
          game.max_players >= players
        )
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
      if (filterType === 'family') {
        if (filterValue === 'all') return true
        const families = (game as any).rank_families || []
        return families.includes(filterValue)
      }
      if (filterType === 'game') {
        return String(game.id) === filterValue
      }
      if (filterType === 'award') {
        const honorsRaw = (game as unknown as { honors?: unknown }).honors
        // Dynamic honors array from upstream enrichment; runtime narrowing applied.
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- TODO(meeplego#types): Replace with typed enrichment shape
        const honors: HonorLike[] = Array.isArray(honorsRaw)
          ? (honorsRaw.filter(
              (h): h is HonorLike => typeof h === 'object' && h !== null
            ) as HonorLike[])
          : []
        return honors.some((h) => {
          const cat = (h.category || h.result_category || '')?.toLowerCase()
          const res = (h.result_raw || h.derived_result || '')?.toLowerCase()
          return cat.includes('winner') || res.includes('winner')
        })
      }
      if (filterType === 'playtime') {
        const playtime = Number(filterValue)
        if (filterValue === 'all') return true
        if (!game.playtime_minutes) return false
        // Match games that can be played in the specified time (allow some tolerance)
        return game.playtime_minutes <= playtime * 1.2 // 20% tolerance
      }
      if (filterType === 'weight') {
        const weight = Number(filterValue)
        if (filterValue === 'all') return true
        if (!(game as any).weight) return false
        // Match games with similar weight (within 0.5 range)
        return Math.abs((game as any).weight - weight) <= 0.5
      }
      return true
    })
  })()

  // When transitioning into Year grouping, prefer Z-A (desc) if no explicit user choice yet
  const prevRankingsGroupByRef = useRef<GroupKey>(groupBy)
  useEffect(() => {
    if (prevRankingsGroupByRef.current !== groupBy) {
      if (
        groupBy === 'year_published' &&
        prevRankingsGroupByRef.current !== 'year_published' &&
        groupSortOrder === 'asc'
      ) {
        setGroupSortOrder('desc')
      }
      prevRankingsGroupByRef.current = groupBy
    }
  }, [groupBy, groupSortOrder])

  // Group and sort logic for games (same as useGameFilters)
  const groupedGames = (() => {
    // Helper function to sort games within a group
    const sortGamesInGroup = (games: GameWithRanking[]) => {
      return [...games].sort((a, b) => {
        if (sortBy === 'ranking') {
          const aRank = a.ranking?.ranking || 0
          const bRank = b.ranking?.ranking || 0
          return sortOrder === 'asc' ? aRank - bRank : bRank - aRank
        }
        if (sortBy === 'award_score') {
          return compareByAwardScore(a, b, sortOrder)
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
        if (sortBy === 'rank') {
          const aRating = (a as any).rank || Infinity
          const bRating = (b as any).rank || Infinity
          return sortOrder === 'asc' ? aRating - bRating : bRating - aRating
        }
        if (sortBy === 'rating') {
          const aRating = (a as any).rating ?? -Infinity
          const bRating = (b as any).rating ?? -Infinity
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
    }

    if (groupBy === 'none') {
      if (disableClientSorting) {
        // Server handles sorting, just return filtered games as-is
        return [{ key: 'All Games', games: filteredGames }]
      }

      const sorted = sortGamesInGroup(filteredGames)
      return [{ key: 'All Games', games: sorted }]
    }

    if (groupBy === 'my_rankings') {
      const groups = new Map<string, GameWithRanking[]>()
      filteredGames.forEach((game) => {
        const ranking = game.ranking?.ranking
        let groupKey: string

        if (ranking === null || ranking === undefined) {
          groupKey = 'Unranked'
        } else if (ranking >= 9) {
          groupKey = 'Outstanding (9-10)'
        } else if (ranking >= 7) {
          groupKey = 'Great (7-8)'
        } else if (ranking >= 5) {
          groupKey = 'Good (5-6)'
        } else if (ranking >= 3) {
          groupKey = 'Fair (3-4)'
        } else {
          groupKey = 'Poor (1-2)'
        }

        if (!groups.has(groupKey)) {
          groups.set(groupKey, [])
        }
        groups.get(groupKey)!.push(game)
      })

      // Define the order for ranking groups
      const rankingOrder = [
        'Outstanding (9-10)',
        'Great (7-8)',
        'Good (5-6)',
        'Fair (3-4)',
        'Poor (1-2)',
        'Unranked',
      ]

      return rankingOrder
        .filter((key) => groups.has(key))
        .map((key) => ({
          key,
          games: sortGamesInGroup(groups.get(key)!),
        }))
    }

    if (groupBy === 'ranking_value') {
      const groups = new Map<string, GameWithRanking[]>()
      filteredGames.forEach((game) => {
        const val = game.ranking?.ranking
        const key =
          typeof val === 'number' && val >= 1 && val <= 10
            ? String(val)
            : 'Unranked'
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(game)
      })
      const order = [
        '10',
        '9',
        '8',
        '7',
        '6',
        '5',
        '4',
        '3',
        '2',
        '1',
        'Unranked',
      ]
      return order
        .filter((k) => groups.has(k))
        .map((k) => ({
          key: k,
          games: [...groups.get(k)!].sort((a, b) =>
            a.name.localeCompare(b.name)
          ),
        }))
    }

    if (groupBy === 'year_published') {
      const groups = new Map<number, GameWithRanking[]>()
      filteredGames.forEach((game) => {
        const year = game.year_published || 0
        if (!groups.has(year)) {
          groups.set(year, [])
        }
        groups.get(year)!.push(game)
      })

      return Array.from(groups.entries())
        .sort(([a], [b]) => (groupSortOrder === 'asc' ? a - b : b - a)) // Respect group sort order
        .map(([year, games]) => ({
          key: year === 0 ? 'Unknown Year' : year.toString(),
          games: sortGamesInGroup(games), // Always sort within groups
        }))
    }

    if (groupBy === 'publisher') {
      const groups = new Map<string, GameWithRanking[]>()
      filteredGames.forEach((game) => {
        const publisher = game.publisher || 'Unknown Publisher'
        if (!groups.has(publisher)) {
          groups.set(publisher, [])
        }
        groups.get(publisher)!.push(game)
      })

      return Array.from(groups.entries())
        .sort(([a], [b]) =>
          groupSortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
        ) // Respect group sort order
        .map(([publisher, games]) => ({
          key: publisher,
          games: sortGamesInGroup(games), // Always sort within groups
        }))
    }

    if (groupBy === 'min_players') {
      const groups = new Map<number, GameWithRanking[]>()
      filteredGames.forEach((game) => {
        const players = game.min_players || 0
        if (!groups.has(players)) {
          groups.set(players, [])
        }
        groups.get(players)!.push(game)
      })

      return Array.from(groups.entries())
        .sort(([a], [b]) => (groupSortOrder === 'asc' ? a - b : b - a)) // Respect group sort order
        .map(([players, games]) => ({
          key: players === 0 ? 'Unknown Players' : `${players}+ Players`,
          games: sortGamesInGroup(games), // Always sort within groups
        }))
    }

    if (groupBy === 'categories') {
      const groups = new Map<string, GameWithRanking[]>()
      filteredGames.forEach((game) => {
        const cats =
          game.categories && game.categories.length > 0
            ? game.categories
            : ['Uncategorized']
        cats.forEach((cat) => {
          const key = cat || 'Uncategorized'
          if (!groups.has(key)) groups.set(key, [])
          groups.get(key)!.push(game)
        })
      })

      return Array.from(groups.entries())
        .sort(([a], [b]) =>
          groupSortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
        ) // Respect group sort order
        .map(([cat, games]) => ({
          key: cat,
          games: sortGamesInGroup(games), // Always sort within groups
        }))
    }

    if (groupBy === 'mechanics') {
      const groups = new Map<string, GameWithRanking[]>()
      filteredGames.forEach((game) => {
        const mechs =
          game.mechanics && game.mechanics.length > 0
            ? game.mechanics
            : ['No Mechanic']
        mechs.forEach((mech) => {
          const key = mech || 'No Mechanic'
          if (!groups.has(key)) groups.set(key, [])
          groups.get(key)!.push(game)
        })
      })

      return Array.from(groups.entries())
        .sort(([a], [b]) =>
          groupSortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
        ) // Respect group sort order
        .map(([mech, games]) => ({
          key: mech,
          games: sortGamesInGroup(games), // Always sort within groups
        }))
    }

    return [{ key: 'All Games', games: filteredGames }]
  })()

  // Extract unique values for filters (same as useGameFilters)
  const uniqueYears = Array.from(
    new Set(
      games
        .map((g) => g.year_published)
        .filter((year): year is number => year !== null)
    )
  ).sort((a, b) => b - a)
  const uniquePublishers = Array.from(
    new Set(
      games.map((g) => g.publisher).filter((pub): pub is string => pub !== null)
    )
  ).sort()
  const uniquePlayerCounts = Array.from(
    new Set(
      games.flatMap((g) => {
        if (!g.min_players || !g.max_players) return [] as number[]
        const counts: number[] = []
        for (let i = g.min_players; i <= g.max_players; i++) {
          counts.push(i)
        }
        return counts
      })
    )
  ).sort((a, b) => a - b)

  const uniqueCategories = Array.from(
    new Set(
      games.flatMap((g) => g.categories || []).filter((c): c is string => !!c)
    )
  ).sort((a, b) => a.localeCompare(b))

  const uniqueMechanics = Array.from(
    new Set(
      games.flatMap((g) => g.mechanics || []).filter((m): m is string => !!m)
    )
  ).sort((a, b) => a.localeCompare(b))

  return {
    // State
    hasMounted,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    groupBy,
    setGroupBy,
    groupSortOrder,
    setGroupSortOrder,
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
