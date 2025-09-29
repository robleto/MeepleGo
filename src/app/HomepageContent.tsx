/**
 * This file now acts as a thin data wrapper kept in app/ for backward compatibility.
 * The presentational component lives in components/Components/HomepageView.tsx for Storybook usage.
 */
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import HomepageView, {
  type UserStats,
} from '@/components/Components/HomepageView'
import type { Game } from '@/types/supabase'
import awardsData from '@/data/awards.json'

// Module-level cache for React Strict Mode stability
let cachedFeaturedGames: Game[] | null = null
let cachedIndustryAwards: any[] | null = null
let cachedPublicLists: any[] | null = null
let cachedBggMostPlayed: Game[] | null = null
let cachedBggHotness: Game[] | null = null
let cachedBggBestsellers: Game[] | null = null

// Initialize awards immediately
const INDUSTRY_AWARDS = (awardsData as any).categories.map((c: any) => ({
  ...c,
  icon: 'TrophyIcon',
}))

// Mock public lists as fallback
const MOCK_PUBLIC_LISTS = [
  {
    id: 'mock-1',
    name: 'Best Strategy Games',
    description: 'Top strategy games for serious gamers',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    list_type: 'user_custom',
  },
  {
    id: 'mock-2',
    name: 'Family Game Night',
    description: 'Perfect games for the whole family',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    list_type: 'user_custom',
  },
  {
    id: 'mock-3',
    name: 'Party Games',
    description: 'Fun games for large groups',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    list_type: 'user_custom',
  },
]

// Mock games as immediate fallback so trending never disappears
const TRENDING_GAMES: Game[] = Array.from({ length: 20 }, (_, i) => ({
  id: `trending-${i}`,
  bgg_id: 0,
  name: `Trending Game ${i + 1}`,
  year_published: 2024,
  image_url: '/placeholder-game.svg',
  thumbnail_url: '/placeholder-game.svg',
  categories: null,
  mechanics: null,
  min_players: 1,
  max_players: 4,
  playtime_minutes: 60,
  publisher: null,
  description: null,
  summary: null,
  rank: null,
  rating: null,
  num_ratings: null,
  cached_at: null,
  created_at: '',
  updated_at: '',
}))

const _PLACEHOLDER_GAMES: Game[] = Array.from({ length: 6 }, (_, i) => ({
  id: `placeholder-${i}` as any,
  bgg_id: 0,
  name: 'Loading…',
  year_published: null,
  image_url: '/placeholder-game.svg',
  thumbnail_url: '/placeholder-game.svg',
  categories: null,
  mechanics: null,
  designers: null,
  artists: null,
  min_players: null,
  max_players: null,
  playtime_minutes: null,
  age: null,
  weight: null,
  publisher: null,
  description: null,
  summary: null,
  rank: null,
  rating: null,
  num_ratings: null,
  cached_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}))

export default function HomepageContent() {
  const [user, setUser] = useState<any>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [featuredGames, setFeaturedGames] = useState<Game[]>(
    cachedFeaturedGames || TRENDING_GAMES
  )
  const [loading, setLoading] = useState(true)
  const [industryAwards, setIndustryAwards] = useState<any[]>(
    cachedIndustryAwards || INDUSTRY_AWARDS
  )
  const [publicLists, setPublicLists] = useState<any[]>(cachedPublicLists || [])
  const [bggMostPlayed, setBggMostPlayed] = useState<Game[]>(
    cachedBggMostPlayed || []
  )
  const [bggHotness, setBggHotness] = useState<Game[]>(cachedBggHotness || [])
  const [bggBestsellers, setBggBestsellers] = useState<Game[]>(
    cachedBggBestsellers || []
  )
  const [bggListIds, setBggListIds] = useState<{
    trendingplays?: string
    hotness?: string
    mostplayed?: string
    bestsellers?: string
  }>({})

  useEffect(() => {
    let cancelled = false

    // Helper function to fetch BGG list games
    async function fetchBggList(listType: string): Promise<Game[]> {
      try {
        const { data: list, error: listErr } = await supabase
          .from('game_lists')
          .select('id')
          .eq('list_type', listType)
          .limit(1)

        if (!listErr && list && list.length === 1) {
          const listId = list[0].id

          // Store the list ID for linking
          if (listType === 'bgg_mostplayed') {
            setBggListIds((prev) => ({ ...prev, mostplayed: listId }))
          } else if (listType === 'bgg_hotness') {
            setBggListIds((prev) => ({ ...prev, hotness: listId }))
          } else if (listType === 'bgg_bestsellers') {
            setBggListIds((prev) => ({ ...prev, bestsellers: listId }))
          } else if (listType === 'bgg_trendingplays') {
            setBggListIds((prev) => ({ ...prev, trendingplays: listId }))
          }

          const { data: listItems, error: itemsErr } = await supabase
            .from('game_list_items')
            .select(
              `
              games (
                id,
                name,
                year_published,
                image_url,
                thumbnail_url,
                rating,
                categories,
                min_players,
                max_players,
                playtime_minutes
              )
            `
            )
            .eq('list_id', listId)
            .order('ranking', { ascending: true })
            .limit(20)

          if (!itemsErr && listItems && listItems.length) {
            return listItems.map((item) => item.games).filter(Boolean) as any[]
          }
        }
      } catch (err) {
        console.error(`Error fetching ${listType}:`, err)
      }
      return []
    }

    async function loadData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (cancelled) return
        setUser(session?.user || null)

        // Trending games simple load: trendingplays -> API -> mock
        let gotGames = false
        try {
          const { data: trendingPlays, error: trendingErr } = await supabase
            .from('game_lists')
            .select('id')
            .eq('list_type', 'bgg_trendingplays')
            .limit(1)
          if (!trendingErr && trendingPlays && trendingPlays.length === 1) {
            const trendingId = trendingPlays[0].id
            setBggListIds((prev) => ({ ...prev, trendingplays: trendingId }))

            const { data: listItems, error: itemsErr } = await supabase
              .from('game_list_items')
              .select(
                `
                games (
                  id,
                  name,
                  year_published,
                  image_url,
                  thumbnail_url,
                  rating,
                  categories,
                  min_players,
                  max_players,
                  playtime_minutes
                )
              `
              )
              .eq('list_id', trendingId)
              .order('ranking', { ascending: true })
              .limit(20)
            if (!itemsErr && listItems && listItems.length) {
              const games = listItems
                .map((i) => (i as any).games)
                .filter(Boolean) as unknown as Game[]
              if (!cancelled) {
                cachedFeaturedGames = games
                setFeaturedGames(games)
              }
              gotGames = true
            }
          }
        } catch (error) {
          // Ignore fetch errors, fall back to alternative data sources
        }
        if (!gotGames) {
          try {
            const res = await fetch('/api/games?limit=20&sort=rank&orderBy=asc')
            if (res.ok) {
              const data = await res.json()
              if (data.games?.length) {
                if (!cancelled) {
                  cachedFeaturedGames = data.games
                  setFeaturedGames(data.games)
                }
                gotGames = true
              }
            }
          } catch (error) {
            // Ignore fetch errors, fall back to default games
          }
        }
        if (!gotGames && !cancelled) {
          cachedFeaturedGames = TRENDING_GAMES
          setFeaturedGames(TRENDING_GAMES)
        }

        // Ensure awards are loaded
        console.log('Loading industry awards from JSON data')
        if (!cancelled) {
          cachedIndustryAwards = INDUSTRY_AWARDS
          setIndustryAwards(INDUSTRY_AWARDS)
        }

        // Load public lists (debug version)
        try {
          console.log('Loading public lists...')

          // Get the public lists - we know they exist!
          const { data: publicListsData, error: listsError } = await supabase
            .from('game_lists')
            .select(
              `
              id,
              name,
              description,
              created_at,
              updated_at,
              list_type,
              is_public,
              game_list_items (
                id,
                game:games (
                  id,
                  name,
                  image_url,
                  thumbnail_url
                )
              )
            `
            )
            .eq('is_public', true)
            .order('updated_at', { ascending: false })
            .limit(6)

          console.log('Public lists query result:', {
            publicListsData,
            listsError,
          })

          if (!listsError && publicListsData && publicListsData.length > 0) {
            console.log('SUCCESS: Found public lists:', publicListsData)
            if (!cancelled) {
              cachedPublicLists = publicListsData
              setPublicLists(publicListsData)
            }
          } else {
            console.log(
              'ERROR: No public lists found despite database having them'
            )
            console.log('Error:', listsError)
            // Use mock as absolute fallback
            if (!cancelled) {
              cachedPublicLists = MOCK_PUBLIC_LISTS
              setPublicLists(MOCK_PUBLIC_LISTS)
            }
          }
        } catch (error) {
          console.error('Error loading public lists:', error)
          if (!cancelled) {
            cachedPublicLists = MOCK_PUBLIC_LISTS
            setPublicLists(MOCK_PUBLIC_LISTS)
          }
        }

        // Load user stats if authenticated
        if (session?.user) {
          try {
            console.log('Loading user stats for user:', session.user.id)

            // Get user's rankings for stats
            const { data: rankings, error: rankingsError } = await supabase
              .from('rankings')
              .select('ranking, played_it, created_at')
              .eq('user_id', session.user.id)

            // Get user's game ownership (library membership)
            const { data: libraryItems, error: libraryError } = await supabase
              .from('game_list_items')
              .select('game_id, game_lists!inner(name)')
              .eq('game_lists.user_id', session.user.id)
              .eq('game_lists.name', 'Library')

            // Get user's total lists count (including default Library and Wishlist)
            const { data: userLists, error: listsError } = await supabase
              .from('game_lists')
              .select('id')
              .eq('user_id', session.user.id)

            // Get user's awards count - try awards table first
            const { data: userAwards, error: awardsError } = await supabase
              .from('awards')
              .select('id')
              .eq('user_id', session.user.id)

            if (!rankingsError && rankings) {
              const totalPlays = rankings.filter((r) => r.played_it).length
              const uniqueGames = rankings.length
              const gamesOwned = libraryItems?.length || 0
              const listsCreated = userLists?.length || 0
              const awardsCreated = userAwards?.length || 0

              // Debug logging
              console.log('User stats debug:', {
                rankings: rankings.length,
                libraryItems: libraryItems?.length || 0,
                libraryError,
                userLists: userLists?.length || 0,
                listsError,
                userAwards: userAwards?.length || 0,
                awardsError,
              })

              const ratingsWithValues = rankings.filter(
                (r) => r.ranking !== null && r.ranking > 0
              )
              const avgRating =
                ratingsWithValues.length > 0
                  ? ratingsWithValues.reduce(
                      (sum, r) => sum + (r.ranking || 0),
                      0
                    ) / ratingsWithValues.length
                  : null

              // Group by date for timeline
              const ratingsTimeline = rankings
                .filter((r) => r.ranking !== null && r.created_at)
                .reduce(
                  (acc, r) => {
                    const date = new Date(r.created_at!)
                      .toISOString()
                      .split('T')[0]
                    if (!acc[date]) {
                      acc[date] = { date, ratings: [], count: 0 }
                    }
                    acc[date].ratings.push(r.ranking!)
                    acc[date].count++
                    return acc
                  },
                  {} as Record<
                    string,
                    { date: string; ratings: number[]; count: number }
                  >
                )

              const timelineArray = Object.values(ratingsTimeline).map(
                (day) => ({
                  date: day.date,
                  avgRating:
                    day.ratings.reduce((sum, r) => sum + r, 0) /
                    day.ratings.length,
                  count: day.count,
                })
              )

              const stats: UserStats = {
                totalPlays,
                uniqueGames,
                gamesOwned,
                avgRating,
                ratingsTimeline: timelineArray,
                recentTags: [], // Could add tags logic later
                listsCreated,
                awardsCreated,
              }

              console.log('User stats loaded:', stats)
              if (!cancelled) {
                setUserStats(stats)
              }
            } else {
              console.log('No rankings found or error:', rankingsError)
              // Set empty stats for authenticated users with no data
              if (!cancelled) {
                setUserStats({
                  totalPlays: 0,
                  uniqueGames: 0,
                  gamesOwned: 0,
                  avgRating: null,
                  ratingsTimeline: [],
                  recentTags: [],
                  listsCreated: 0,
                  awardsCreated: 0,
                })
              }
            }
          } catch (error) {
            console.error('Error loading user stats:', error)
            if (!cancelled) {
              setUserStats({
                totalPlays: 0,
                uniqueGames: 0,
                gamesOwned: 0,
                avgRating: null,
                ratingsTimeline: [],
                recentTags: [],
                listsCreated: 0,
                awardsCreated: 0,
              })
            }
          }
        }

        // Load BGG lists
        try {
          console.log('Loading BGG lists...')

          const [mostPlayedGames, hotnessGames, bestsellersGames] =
            await Promise.all([
              fetchBggList('bgg_mostplayed'),
              fetchBggList('bgg_hotness'),
              fetchBggList('bgg_bestsellers'),
            ])

          if (!cancelled) {
            cachedBggMostPlayed = mostPlayedGames
            setBggMostPlayed(mostPlayedGames)

            cachedBggHotness = hotnessGames
            setBggHotness(hotnessGames)

            cachedBggBestsellers = bestsellersGames
            setBggBestsellers(bestsellersGames)

            console.log('BGG lists loaded:', {
              mostPlayedGames: mostPlayedGames.length,
              hotnessGames: hotnessGames.length,
              bestsellersGames: bestsellersGames.length,
            })
          }
        } catch (error) {
          console.error('Error loading BGG lists:', error)
        }
      } catch (e) {
        if (!cancelled) console.error('Error loading homepage data:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => {
      cancelled = true
    }
  }, [])

  // Debug logging
  console.log('Homepage data:', {
    featuredGames: featuredGames.length,
    industryAwards: industryAwards.length,
    publicLists: publicLists.length,
    loading,
  })

  return (
    <HomepageView
      user={user}
      loading={loading}
      featuredGames={featuredGames}
      userStats={userStats}
      industryAwards={industryAwards}
      publicLists={publicLists}
      bggMostPlayed={bggMostPlayed}
      bggHotness={bggHotness}
      bggBestsellers={bggBestsellers}
      bggListIds={bggListIds}
    />
  )
}
