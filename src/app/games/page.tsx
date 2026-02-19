'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/Components/PageLayout'
import Heading from '@/components/Components/Heading'
import GameCard from '@/components/Components/GameCard'
import SearchandFilters from '@/components/Components/SearchandFilters'
import FilterModal from '@/components/Components/FilterModal'
import { GameWithRanking } from '@/types'
import { useGameFilters, useViewMode } from '@/utils/gameFilters'
import { searchGamesFallback } from '@/utils/databaseSearch'
import {
  computeAwardScoreMap,
  computeAwardScoreMapByGameId,
  normalizeAwardGameName,
  type AwardScoreRow,
} from '@/utils/awardScore'
import { Squares2X2Icon } from '@heroicons/react/24/outline'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { getMembershipSets } from '@/lib/lists'
import { GameCardSkeleton } from '@/components/Components/LoadingSkeletons'

function normalizeAwardToTenPointScale(rawAwardScore: number) {
  // Diminishing-returns curve so huge award totals do not fully dominate.
  return 10 * (1 - Math.exp(-(rawAwardScore || 0) / 14))
}

function computeRankingsSignal(
  averageRanking: number | null,
  ratingCount: number
): number | null {
  if (!averageRanking || ratingCount <= 0) return null
  // Bayesian shrinkage towards neutral quality to avoid tiny-sample spikes.
  const priorMean = 7
  const priorWeight = 6
  return (
    (averageRanking * ratingCount + priorMean * priorWeight) /
    (ratingCount + priorWeight)
  )
}

function computeBlendedDiscoveryScore(params: {
  awardScore: number
  averageRanking: number | null
  ratingCount: number
}) {
  const { awardScore, averageRanking, ratingCount } = params
  const awardSignal = normalizeAwardToTenPointScale(awardScore)
  const rankingSignal = computeRankingsSignal(averageRanking, ratingCount)

  if (rankingSignal === null) {
    // If we have no community signal yet, default to awards only.
    return awardSignal
  }

  // Trust community consensus more as vote count grows.
  const confidence = Math.min(1, ratingCount / 10)
  const rankingsWeight = 0.65 + 0.2 * confidence // 0.65 -> 0.85
  const awardsWeight = 1 - rankingsWeight
  return rankingSignal * rankingsWeight + awardSignal * awardsWeight
}

function GamesPageContent() {
  const [games, setGames] = useState<GameWithRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [viewMode, setViewMode] = useViewMode('grid')
  const [cardVariant, setCardVariant] = useState<
    'detailed' | 'balanced' | 'compact'
  >('balanced')

  const ITEMS_PER_LOAD = 500

  // Read search query from URL (e.g., top-nav search submits ?search=foo)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Keep in-page search reactive to URL 'search' if present (typed in nav), otherwise local typing controls it
  useEffect(() => {
    const q = (searchParams.get('search') || '').trim()
    setSearchTerm(q)
  }, [searchParams])

  const {
    hasMounted,
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
    filteredGames,
    groupedGames,
    uniqueYears,
    uniquePublishers,
    uniquePlayerCounts,
    uniqueCategories,
    uniqueMechanics,
  } = useGameFilters(games, {
    disableClientSorting: true, // Server handles sorting
    forceClientSortKeys: ['award_score'],
    defaultViewMode: 'grid',
    defaultSortBy: 'award_score',
    defaultSortOrder: 'desc',
    storageKeyPrefix: 'games',
  })

  const awardScoreCacheRef = useRef<Map<string, number>>(new Map())

  const hydrateAwardScores = async (gamesToScore: GameWithRanking[]) => {
    if (sortBy !== 'award_score') return gamesToScore

    const missingGames = gamesToScore.filter((game) => {
      const idKey = game.id
      const nameKey = normalizeAwardGameName(game.name)
      return (
        !awardScoreCacheRef.current.has(idKey) &&
        !awardScoreCacheRef.current.has(nameKey)
      )
    })
    if (missingGames.length === 0) return gamesToScore

    const names = missingGames
      .map((g) => g.name)
      .filter((n): n is string => typeof n === 'string' && n.trim().length > 0)
    const ids = missingGames.map((g) => g.id).filter(Boolean)
    const normalizedNames = names.map(normalizeAwardGameName)
    const missingNames = normalizedNames.filter((name) => Boolean(name))

    if (missingGames.length > 0) {
      const rows: AwardScoreRow[] = []
      const chunkSize = 100
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize)
        if (chunk.length === 0) continue
        const { data, error } = await supabase
          .from('awards_cache')
          .select(
            'award_set,year,is_winner,is_nominee,position,game_name,game_id'
          )
          .in('game_id', chunk)
        if (error) {
          console.warn('awards_cache fetch error', error.message)
          continue
        }
        rows.push(...((data as AwardScoreRow[]) || []))
      }

      const scoresById = computeAwardScoreMapByGameId(
        rows,
        new Date().getFullYear()
      )

      if (scoresById.size === 0 && missingNames.length > 0) {
        for (let i = 0; i < missingNames.length; i += chunkSize) {
          const chunkNormalized = missingNames.slice(i, i + chunkSize)
          const chunkOriginal = names.filter((n) =>
            chunkNormalized.includes(normalizeAwardGameName(n))
          )
          if (chunkOriginal.length === 0) continue
          const { data, error } = await supabase
            .from('awards_cache')
            .select('award_set,year,is_winner,is_nominee,position,game_name')
            .in('game_name', chunkOriginal)
          if (error) {
            console.warn('awards_cache fetch error', error.message)
            continue
          }
          rows.push(...((data as AwardScoreRow[]) || []))
        }
        const scoresByName = computeAwardScoreMap(
          rows,
          new Date().getFullYear()
        )
        missingGames.forEach((game) => {
          const nameKey = normalizeAwardGameName(game.name)
          const score = scoresByName.get(nameKey) ?? 0
          awardScoreCacheRef.current.set(game.id, score)
          if (nameKey) awardScoreCacheRef.current.set(nameKey, score)
        })
      } else {
        scoresById.forEach((value, id) => {
          awardScoreCacheRef.current.set(id, value)
        })
      }

      // Pull internal rankings signal and blend with award signal.
      const rankingRows: Array<{ game_id: string; ranking: number }> = []
      const rankingChunkSize = 100
      for (let i = 0; i < ids.length; i += rankingChunkSize) {
        const chunk = ids.slice(i, i + rankingChunkSize)
        if (chunk.length === 0) continue
        const { data, error } = await supabase
          .from('rankings')
          .select('game_id,ranking')
          .in('game_id', chunk)
          .gte('ranking', 1)
          .lte('ranking', 10)
        if (error) {
          console.warn('rankings fetch error', error.message)
          continue
        }
        rankingRows.push(
          ...(((data as Array<{ game_id: string; ranking: number }> | null) ||
            []) as Array<{ game_id: string; ranking: number }>)
        )
      }

      const rankingAggById = new Map<string, { sum: number; count: number }>()
      rankingRows.forEach((row) => {
        const key = row.game_id
        const prev = rankingAggById.get(key) || { sum: 0, count: 0 }
        rankingAggById.set(key, {
          sum: prev.sum + Number(row.ranking || 0),
          count: prev.count + 1,
        })
      })

      missingGames.forEach((game) => {
        const nameKey = normalizeAwardGameName(game.name)
        const rawAwardScore =
          awardScoreCacheRef.current.get(game.id) ??
          awardScoreCacheRef.current.get(nameKey) ??
          0
        const rankingAgg = rankingAggById.get(game.id)
        const averageRanking =
          rankingAgg && rankingAgg.count > 0
            ? rankingAgg.sum / rankingAgg.count
            : null
        const blendedScore = computeBlendedDiscoveryScore({
          awardScore: rawAwardScore,
          averageRanking,
          ratingCount: rankingAgg?.count || 0,
        })

        awardScoreCacheRef.current.set(game.id, blendedScore)
        if (nameKey) awardScoreCacheRef.current.set(nameKey, blendedScore)
      })
    }

    return gamesToScore.map((game) => ({
      ...game,
      award_score:
        awardScoreCacheRef.current.get(game.id) ??
        awardScoreCacheRef.current.get(normalizeAwardGameName(game.name)) ??
        0,
    }))
  }

  // Read filter parameters from URL and set filter state
  useEffect(() => {
    if (!hasMounted) return

    const categoryParam = searchParams.get('category')
    const mechanicParam = searchParams.get('mechanic')
    const yearParam = searchParams.get('year')
    const playersParam = searchParams.get('players')
    const playtimeParam = searchParams.get('playtime')
    const weightParam = searchParams.get('weight')

    if (categoryParam) {
      setFilterType('category')
      setFilterValue(categoryParam)
    } else if (mechanicParam) {
      setFilterType('mechanic')
      setFilterValue(mechanicParam)
    } else if (yearParam) {
      setFilterType('year')
      setFilterValue(yearParam)
    } else if (playersParam) {
      setFilterType('players')
      setFilterValue(playersParam)
    } else if (playtimeParam) {
      setFilterType('playtime')
      setFilterValue(playtimeParam)
    } else if (weightParam) {
      setFilterType('weight')
      setFilterValue(weightParam)
    } else {
      // No recognized filter params, reset to default
      setFilterType('none')
      setFilterValue('all')
    }
  }, [searchParams, hasMounted, setFilterType, setFilterValue])

  // Reset games when search, sort, or URL-selected game changes
  useEffect(() => {
    setGames([])
    setHasMore(true)
  }, [
    searchTerm,
    sortBy,
    sortOrder,
    groupBy,
    groupSortOrder,
    filterType,
    filterValue,
    searchParams?.get('gameId') || null,
  ])

  // Helper function to build Supabase ordering
  const buildOrderClause = (sortField: string, order: string) => {
    switch (sortField) {
      case 'name':
        return { column: 'name', ascending: order === 'asc' }
      case 'year_published':
        return { column: 'year_published', ascending: order === 'asc' }
      case 'rating':
        return { column: 'rating', ascending: order === 'asc' }
      case 'ranking':
        // For user rankings, we'll need a different approach since it's in a different table
        return { column: 'name', ascending: order === 'asc' } // Fallback to name for now
      case 'award_score':
        return { column: 'name', ascending: order === 'asc' } // Client-side award scoring
      case 'playtime_minutes':
        return { column: 'playtime_minutes', ascending: order === 'asc' }
      case 'min_players':
        return { column: 'min_players', ascending: order === 'asc' }
      case 'max_players':
        return { column: 'max_players', ascending: order === 'asc' }
      default:
        return { column: 'name', ascending: true }
    }
  }

  // When grouping by year, force server ordering to year desc, then name asc to keep 2025 at top
  const buildServerOrders = (
    sortField: string,
    order: string,
    groupField: string
  ) => {
    if (groupField === 'year_published') {
      return [
        {
          column: 'year_published',
          ascending: false as const,
          nullsFirst: false as const,
        },
        { column: 'name', ascending: true as const },
      ]
    }
    const single = buildOrderClause(sortField, order)

    // For rating sorting, we need to handle nulls properly
    if (sortField === 'rating') {
      return [
        {
          column: single.column,
          ascending: single.ascending as boolean,
          nullsFirst: false as const, // Push NULL rankings to the end
        },
      ]
    }

    return [{ column: single.column, ascending: single.ascending as boolean }]
  }

  // Helper to apply server-side filters based on current filterType/value and URL params
  const applyServerFilters = (
    q: ReturnType<typeof supabase.from> extends any ? any : never
  ) => {
    let query = q

    // If a specific gameId is provided via top-nav dropdown selection, scope to that game
    const gameIdParam = searchParams.get('gameId')
    if (gameIdParam) {
      query = query.eq('id', gameIdParam)
    }

    if (filterType === 'year' && filterValue !== 'all') {
      query = query.eq('year_published', Number(filterValue))
    }
    if (filterType === 'publisher' && filterValue !== 'all') {
      query = query.eq('publisher', filterValue)
    }
    if (filterType === 'players' && filterValue !== 'all') {
      const players = Number(filterValue)
      if (!Number.isNaN(players)) {
        query = query.lte('min_players', players).gte('max_players', players)
      }
    }
    if (filterType === 'playtime' && filterValue !== 'all') {
      const playtime = Number(filterValue)
      if (!Number.isNaN(playtime)) {
        // Use a small tolerance since exact matching may be too restrictive
        // Most games are rounded to 15-minute intervals (60, 75, 90, 105, 120)
        const tolerance = 5 // Small 5-minute tolerance for rounding differences
        query = query
          .gte('playtime_minutes', playtime - tolerance)
          .lte('playtime_minutes', playtime + tolerance)
      }
    }
    if (filterType === 'category' && filterValue !== 'all') {
      query = query.contains('categories', [filterValue])
    }
    if (filterType === 'mechanic' && filterValue !== 'all') {
      query = query.contains('mechanics', [filterValue])
    }
    if (filterType === 'award') {
      // Filter to games that have at least one honor entry (winner refinement done client-side)
      query = query.not('honors', 'eq', '[]')
    }
    return query
  }

  // Load more games function
  const loadMoreGames = async () => {
    try {
      setLoadingMore(true)
      setError(null)

      // Get current user for rankings
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const userId = session?.user?.id

      // If we have a search term, use enhanced database search
      if (searchTerm.trim()) {
        const { games: searchResults, error: searchError } =
          await searchGamesFallback(
            searchTerm.trim(),
            userId,
            ITEMS_PER_LOAD,
            games.length
          )

        if (searchError) {
          setError(searchError)
          return
        }

        const scored = await hydrateAwardScores(searchResults)
        setGames((prev) => [...prev, ...scored])
        setHasMore(searchResults.length === ITEMS_PER_LOAD)
        return
      }

      // Regular load more for non-search cases
      // Build query with search
      let query = supabase.from('games').select(`
          *,
          rankings(*)
        `)

      // Filter rankings by current user if logged in
      if (userId) {
        query = query.eq('rankings.user_id', userId)
      }

      // Apply advanced filters server-side
      query = applyServerFilters(query)

      // Add ordering based on current sort criteria (with grouping awareness)
      // Ensure we use the correct defaults if hook hasn't initialized yet
      const effectiveSortBy = sortBy || 'name'
      const effectiveSortOrder = sortOrder || 'asc'
      const effectiveGroupBy = groupBy || 'none'

      const orders = buildServerOrders(
        effectiveSortBy,
        effectiveSortOrder,
        effectiveGroupBy
      )
      orders.forEach((o) => {
        if ('nullsFirst' in o && typeof o.nullsFirst === 'boolean') {
          query = query.order(o.column as any, {
            ascending: o.ascending,
            nullsFirst: o.nullsFirst,
          })
        } else {
          query = query.order(o.column as any, { ascending: o.ascending })
        }
      })

      // Add pagination based on current games length
      const startIndex = games.length
      const endIndex = startIndex + ITEMS_PER_LOAD - 1
      query = query.range(startIndex, endIndex)

      const { data: gamesData, error: gamesError } = await query

      if (gamesError) {
        throw gamesError
      }

      // Transform the data to match our GameWithRanking type
      const gamesWithRankings: GameWithRanking[] =
        gamesData?.map((game) => ({
          ...game,
          ranking: game.rankings?.[0] || null,
        })) || []

      const scored = await hydrateAwardScores(gamesWithRankings)

      // Append new games to existing ones
      setGames((prev) => [...prev, ...scored])
      setHasMore(gamesData?.length === ITEMS_PER_LOAD)
    } catch (err) {
      console.error('Error loading more games:', err)
      setError('Failed to load more games. Please try again.')
    } finally {
      setLoadingMore(false)
    }
  }

  // Initial load
  useEffect(() => {
    async function initialLoad() {
      try {
        setLoading(true)
        setError(null)

        // Get current user for rankings
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const userId = session?.user?.id

        // If we have a search term, use enhanced database search
        if (searchTerm.trim()) {
          const { games: searchResults, error: searchError } =
            await searchGamesFallback(
              searchTerm.trim(),
              userId,
              ITEMS_PER_LOAD,
              0
            )

          if (searchError) {
            setError(searchError)
            return
          }

          const scored = await hydrateAwardScores(searchResults)
          setGames(scored)
          setHasMore(searchResults.length === ITEMS_PER_LOAD)
          return
        }

        // Regular query for non-search cases
        const fetchGamesPage = async (start: number, end: number) => {
          let query = supabase
            .from('games')
            .select(`*, rankings(*)`)
            .range(start, end)
          if (userId) query = query.eq('rankings.user_id', userId)
          query = applyServerFilters(query)
          const orders = buildServerOrders(
            sortBy || 'name',
            sortOrder || 'asc',
            groupBy || 'none'
          )
          orders.forEach((o) => {
            if ('nullsFirst' in o && typeof o.nullsFirst === 'boolean') {
              query = query.order(o.column as any, {
                ascending: o.ascending,
                nullsFirst: o.nullsFirst,
              })
            } else {
              query = query.order(o.column as any, { ascending: o.ascending })
            }
          })
          return query
        }

        // For smart ranking sort, load all filtered games up-front so sorting
        // is truly global rather than limited to the first page.
        const shouldLoadAllForSmartSort = (sortBy || 'name') === 'award_score'
        let gamesData: any[] = []
        if (shouldLoadAllForSmartSort) {
          let start = 0
          const maxPages = 24 // safety cap: 24 * 500 = 12k games
          for (let page = 0; page < maxPages; page += 1) {
            const end = start + ITEMS_PER_LOAD - 1
            const { data, error } = await fetchGamesPage(start, end)
            if (error) throw error
            const batch = data || []
            gamesData = [...gamesData, ...batch]
            if (batch.length < ITEMS_PER_LOAD) break
            start += ITEMS_PER_LOAD
          }
        } else {
          const { data, error } = await fetchGamesPage(0, ITEMS_PER_LOAD - 1)
          if (error) throw error
          gamesData = data || []
        }

        // Diagnostics
        // Transform to internal type
        const gamesWithRankings: GameWithRanking[] = gamesData.map((game) => ({
          ...game,
          ranking: game.rankings?.[0] || null,
        }))

        // If grouping by year, ensure we include all games from the top year (e.g., 2025) before truncating
        let combined = gamesWithRankings
        let moreAvailable =
          !shouldLoadAllForSmartSort &&
          gamesWithRankings?.length === ITEMS_PER_LOAD
        if (groupBy === 'year_published' && combined.length > 0) {
          const topYear = combined[0]?.year_published || null
          let lastYear = combined[combined.length - 1]?.year_published || null
          let nextStart = ITEMS_PER_LOAD

          // Helper to fetch additional pages with the exact same query ordering
          const fetchNextBatch = async (start: number, end: number) => {
            let q = supabase.from('games').select(`
                *,
                rankings(*)
              `)
            // Filter rankings by current user if logged in
            if (userId) {
              q = q.eq('rankings.user_id', userId)
            }
            if (searchTerm.trim()) {
              const term = searchTerm.trim()
              q = q.or(
                `name.ilike.%${term}%,publisher.ilike.%${term}%,summary.ilike.%${term}%`
              )
            }
            // Apply the same filters
            q = applyServerFilters(q)
            const extraOrders = buildServerOrders(sortBy, sortOrder, groupBy)
            extraOrders.forEach((o) => {
              if ('nullsFirst' in o && typeof o.nullsFirst === 'boolean') {
                q = q.order(o.column as any, {
                  ascending: o.ascending,
                  nullsFirst: o.nullsFirst,
                })
              } else {
                q = q.order(o.column as any, { ascending: o.ascending })
              }
            })
            q = q.range(start, end)
            return q
          }

          // Keep fetching while we are still within the same top year window
          while (moreAvailable && lastYear === topYear) {
            const { data: nextData, error: nextErr } = await fetchNextBatch(
              nextStart,
              nextStart + ITEMS_PER_LOAD - 1
            )
            if (nextErr) {
              console.error('Error fetching continuation page:', nextErr)
              break
            }
            const nextMapped: GameWithRanking[] =
              nextData?.map((game) => ({
                ...game,
                ranking: game.rankings?.[0] || null,
              })) || []

            combined = [...combined, ...nextMapped]
            moreAvailable = nextData?.length === ITEMS_PER_LOAD
            lastYear = combined[combined.length - 1]?.year_published || null
            nextStart += ITEMS_PER_LOAD

            // Safety: don't fetch excessively in one go
            if (nextStart > ITEMS_PER_LOAD * 6) {
              // cap ~3000 items in one initial load
              break
            }
          }
        }

        const scored = await hydrateAwardScores(combined)
        setGames(scored)
        setHasMore(moreAvailable)
      } catch (err) {
        console.error('Error fetching games:', err)
        setError('Failed to load games. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    initialLoad()
  }, [
    searchTerm,
    sortBy,
    sortOrder,
    groupBy,
    groupSortOrder,
    filterType,
    filterValue,
  ])

  const [membershipSets, setMembershipSets] = useState<{
    library: Set<string>
    wishlist: Set<string>
  } | null>(null)
  const [membershipMap, setMembershipMap] = useState<
    Record<string, { library: boolean; wishlist: boolean }>
  >({})

  // Fetch membership once after initial games load (and when games list changes substantially)
  useEffect(() => {
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return
      const sets = await getMembershipSets()
      if (sets) {
        setMembershipSets(sets)
        // initialize membershipMap from sets
        const map: Record<string, { library: boolean; wishlist: boolean }> = {}
        games.forEach((g) => {
          map[g.id] = {
            library: sets.library.has(g.id),
            wishlist: sets.wishlist.has(g.id),
          }
        })
        setMembershipMap(map)
      }
    })()
  }, [games.length])

  const handleMembershipChange = (
    gameId: string,
    change: { library?: boolean; wishlist?: boolean }
  ) => {
    setMembershipMap((prev) => ({
      ...prev,
      [gameId]: {
        library:
          change.library !== undefined
            ? change.library
            : prev[gameId]?.library || false,
        wishlist:
          change.wishlist !== undefined
            ? change.wishlist
            : prev[gameId]?.wishlist || false,
      },
    }))
  }

  const formatTaxonomyLabel = (value: string) =>
    value
      .replace(/games$/i, '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim()

  // Helper to get filter title based on current URL params
  const getFilterTitle = () => {
    const categoryParam = searchParams.get('category')
    const mechanicParam = searchParams.get('mechanic')
    const familyParam = searchParams.get('family')
    const yearParam = searchParams.get('year')
    const playersParam = searchParams.get('players')
    const playtimeParam = searchParams.get('playtime')
    const weightParam = searchParams.get('weight')

    if (categoryParam) {
      return `Category: ${formatTaxonomyLabel(categoryParam)}`
    }
    if (mechanicParam) {
      return `Mechanic: ${formatTaxonomyLabel(mechanicParam)}`
    }
    if (familyParam) {
      return `Family: ${formatTaxonomyLabel(familyParam)}`
    }
    if (yearParam) {
      return `Games from ${yearParam}`
    }
    if (playersParam) {
      const count = Number(playersParam)
      return `Games for ${count} player${count === 1 ? '' : 's'}`
    }
    if (playtimeParam) {
      const minutes = Number(playtimeParam)
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      let timeStr = ''
      if (hours > 0) {
        if (remainingMinutes > 0) {
          // e.g., "1 hour 30 minutes"
          timeStr = `${hours} hour${hours === 1 ? '' : 's'} ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`
        } else {
          // e.g., "2 hours"
          timeStr = `${hours} hour${hours === 1 ? '' : 's'}`
        }
      } else {
        // e.g., "30 minutes"
        timeStr = `${minutes} minute${minutes === 1 ? '' : 's'}`
      }
      return `Games that take ${timeStr}`
    }
    if (weightParam) {
      const weight = Number(weightParam)
      const weightLabels = {
        1: 'Light',
        2: 'Medium-Light',
        3: 'Medium',
        4: 'Medium-Heavy',
        5: 'Heavy',
      }
      const label = weightLabels[weight as keyof typeof weightLabels] || weight
      return `${label} complexity games`
    }
    return null
  }

  const filterTitle = getFilterTitle()

  // Local slugify mirroring server mg_slugify (must stay in sync)
  const slugify = (input: string) =>
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  // Calculate active filter count (matches FilterModal logic)
  const getActiveFilterCount = () => {
    let count = 0

    // Sort filter (if not default)
    if (sortBy !== 'rating' || sortOrder !== 'desc') {
      count++
    }

    // Group filter (if not default)
    if (groupBy !== 'none') {
      count++
    }

    // View mode (if not default)
    if (viewMode !== 'grid') {
      count++
    }

    // Card density (if not default)
    if (cardVariant !== 'balanced') {
      count++
    }

    // Content filters (if active)
    if (filterType !== 'none' && filterValue !== 'all') {
      count++
    }

    return count
  }

  const activeFilterCount = getActiveFilterCount()

  const activeFilterChip = (() => {
    if (filterType === 'none' || filterValue === 'all') return null
    if (filterType === 'year') return `Year: ${filterValue}`
    if (filterType === 'players') return `Players: ${filterValue}`
    if (filterType === 'playtime') return `Playtime: ${filterValue}m`
    if (filterType === 'weight') return `Weight: ${filterValue}`
    if (filterType === 'category') return `Category: ${formatTaxonomyLabel(filterValue)}`
    if (filterType === 'mechanic') return `Mechanic: ${formatTaxonomyLabel(filterValue)}`
    if (filterType === 'family') return `Family: ${formatTaxonomyLabel(filterValue)}`
    if (filterType === 'publisher') return `Publisher: ${filterValue}`
    if (filterType === 'award') return `Awards`
    return `${filterType}: ${filterValue}`
  })()

  const clearActiveFilter = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('year')
    params.delete('players')
    params.delete('playtime')
    params.delete('weight')
    params.delete('category')
    params.delete('mechanic')
    params.delete('publisher')
    params.delete('award')
    params.delete('type')
    params.delete('family')
    router.replace(`${pathname}?${params.toString()}`)
  }

  const taxonomyLinkForGroup = (groupKey: string) => {
    if (groupBy === 'categories') {
      if (groupKey === 'Uncategorized') return null
      return `/categories/${slugify(groupKey)}`
    }
    if (groupBy === 'mechanics') {
      if (groupKey === 'No Mechanic') return null
      return `/mechanics/${slugify(groupKey)}`
    }
    if (groupBy === 'publisher') {
      if (groupKey === 'Unknown Publisher') return null
      return `/publishers/${slugify(groupKey)}`
    }
    return null
  }

  if (!hasMounted) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      subHeader={
        <>
          {/* Search + Filters */}
          <SearchandFilters
            // search integration: update URL param so nav search consistent
            value={searchTerm}
            onChange={(val) => {
              const params = new URLSearchParams(searchParams.toString())
              if (val) params.set('search', val)
              else params.delete('search')
              router.replace(`${pathname}?${params.toString()}`)
            }}
            onSearch={(val) => {
              const params = new URLSearchParams(searchParams.toString())
              if (val) params.set('search', val)
              else params.delete('search')
              router.replace(`${pathname}?${params.toString()}`)
            }}
            filtersCount={activeFilterCount}
            onOpenFilters={() => setShowFilters(true)}
          />

          {activeFilterChip && (
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {activeFilterChip}
                <button
                  onClick={clearActiveFilter}
                  className="w-4 h-4 inline-flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  aria-label="Clear filter"
                  title="Clear filter"
                >
                  ×
                </button>
              </span>
            </div>
          )}
        </>
      }
    >
      <div className="space-y-6">
        {/* Filter Title - shown when filtering via URL params */}
        {filterTitle && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <Heading
              as="h2"
              size="lg"
              className="text-gray-900 dark:text-gray-100"
            >
              {filterTitle}
            </Heading>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {games.length} {games.length === 1 ? 'game' : 'games'} found
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-4' 
            : 'space-y-4'
          }>
            {Array.from({ length: 12 }).map((_, i) => (
              <GameCardSkeleton key={i} variant={viewMode} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="text-red-800 dark:text-red-200">{error}</div>
          </div>
        )}

        {/* Games Display - Use grouped/filtered games */}
        {!loading && !error && (
          <div className="mb-10 space-y-8">
            {groupedGames.map((group) => (
              <div key={group.key}>
                {/* Group header - only show if we have multiple groups */}
                {groupedGames.length > 1 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {group.key}
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {group.games.length}{' '}
                      {group.games.length === 1 ? 'game' : 'games'}
                    </div>
                  </div>
                )}

                {/* Games for this group */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-4">
                    {group.games.map((game) => (
                      <GameCard
                        key={game.id}
                        game={{
                          ...game,
                          list_membership: membershipMap[game.id] || {
                            library: membershipSets
                              ? membershipSets.library.has(game.id)
                              : false,
                            wishlist: membershipSets
                              ? membershipSets.wishlist.has(game.id)
                              : false,
                          },
                        }}
                        viewMode={viewMode}
                        variant={cardVariant}
                        onMembershipChange={handleMembershipChange}
                        imageFit="contain"
                        metadata={{
                          showPlayerCount: false,
                          showPlaytime: false,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    {group.games.map((game, idx) => (
                      <GameCard
                        key={game.id}
                        game={{
                          ...game,
                          list_membership: membershipMap[game.id] || {
                            library: membershipSets
                              ? membershipSets.library.has(game.id)
                              : false,
                            wishlist: membershipSets
                              ? membershipSets.wishlist.has(game.id)
                              : false,
                          },
                        }}
                        viewMode="list"
                        variant={cardVariant}
                        listRank={idx + 1}
                        onMembershipChange={handleMembershipChange}
                        metadata={{
                          showPlayerCount: false,
                          showPlaytime: false,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load More Button - only show if we have server-side pagination */}
        {!loading &&
          !error &&
          hasMore &&
          groupedGames.some((group) => group.games.length > 0) && (
            <div className="flex justify-center py-8">
              <button
                onClick={loadMoreGames}
                disabled={loadingMore}
                className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Load More Games</span>
                )}
              </button>
            </div>
          )}

        {/* Empty State - no games loaded at all */}
        {!loading && !error && games.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Squares2X2Icon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No games found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm
                ? 'No games match your search criteria.'
                : 'Get started by adding your first game to the collection.'}
            </p>
            {!searchTerm && (
              <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
                Add Game
              </button>
            )}
          </div>
        )}

        {/* No Results for Filter - games exist but none match current filters */}
        {!loading &&
          !error &&
          games.length > 0 &&
          groupedGames.every((group) => group.games.length === 0) && (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <Squares2X2Icon className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No games match your filters
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search criteria or clearing some filters.
              </p>
            </div>
          )}
      </div>

      {/* FilterModal */}
      <FilterModal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        groupSortOrder={groupSortOrder}
        setGroupSortOrder={setGroupSortOrder}
        viewMode={viewMode}
        setViewMode={setViewMode}
        cardVariant={cardVariant}
        setCardVariant={setCardVariant}
        filterType={filterType}
        setFilterType={(t) => setFilterType(t as any)}
        filterValue={filterValue}
        setFilterValue={setFilterValue}
        uniqueYears={uniqueYears}
        uniquePublishers={uniquePublishers}
        uniquePlayerCounts={uniquePlayerCounts}
        uniqueCategories={uniqueCategories}
        uniqueMechanics={uniqueMechanics}
        defaultSortBy="rating"
        defaultSortOrder="asc"
        defaultGroupBy="none"
        defaultGroupSortOrder="asc"
        defaultViewMode="grid"
        defaultCardVariant="balanced"
      />
    </PageLayout>
  )
}

export default function GamesPage() {
  return (
    <Suspense
      fallback={
        <PageLayout>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        </PageLayout>
      }
    >
      <GamesPageContent />
    </Suspense>
  )
}
