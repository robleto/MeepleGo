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
import type {
  MostAwardedGame,
  HighestRankedGame,
  SleeperHitGame,
  HotTakeGame,
  ComebackGame,
} from '@/types'
import awardsData from '@/data/awards.json'
import OnboardingModal from '@/components/Components/OnboardingModal'
import SignupPrompt from '@/components/Components/SignupPrompt'
import { shouldPromptSignup, getOnboardingState } from '@/lib/guestSession'

// Module-level cache for React Strict Mode stability
let cachedFeaturedGames: Game[] | null = null
let cachedIndustryAwards: any[] | null = null
let cachedPublicLists: any[] | null = null

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
  
  // Discovery lists state
  const [discoveryLists, setDiscoveryLists] = useState<{
    mostAwarded: MostAwardedGame[]
    highestRanked: HighestRankedGame[]
    sleeperHits: SleeperHitGame[]
    hotTakes: HotTakeGame[]
    comebackGames: ComebackGame[]
  }>({
    mostAwarded: [],
    highestRanked: [],
    sleeperHits: [],
    hotTakes: [],
    comebackGames: [],
  })
  const [discoveryLoading, setDiscoveryLoading] = useState(false)

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)

  // Check if we should show onboarding or signup prompt
  useEffect(() => {
    const onboardingState = getOnboardingState()
    
    // Only show onboarding for truly new users (not logged in, no welcome state, AND no existing data)
    // Skip for logged-in users or users with stats (indicating they already have data)
    if (!onboardingState.welcomed && !user && !userStats) {
      setShowOnboarding(true)
    }

    // Check if we should prompt for signup (guest with activity)
    if (!user && shouldPromptSignup()) {
      // Delay prompt slightly so it doesn't interrupt browsing
      const timer = setTimeout(() => {
        setShowSignupPrompt(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [user, userStats])

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (cancelled) return
        setUser(session?.user || null)

        // Featured games: API -> mock
        let gotGames = false
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
        if (!cancelled) {
          cachedIndustryAwards = INDUSTRY_AWARDS
          setIndustryAwards(INDUSTRY_AWARDS)
        }

        // Load public lists
        try {
          // Get the public lists
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

          if (!listsError && publicListsData && publicListsData.length > 0) {
            if (!cancelled) {
              cachedPublicLists = publicListsData
              setPublicLists(publicListsData)
            }
          } else {
            // Use mock as absolute fallback
            if (!cancelled) {
              cachedPublicLists = MOCK_PUBLIC_LISTS
              setPublicLists(MOCK_PUBLIC_LISTS)
            }
          }
        } catch {
          if (!cancelled) {
            cachedPublicLists = MOCK_PUBLIC_LISTS
            setPublicLists(MOCK_PUBLIC_LISTS)
          }
        }

        // Load user stats if authenticated
        if (session?.user) {
          try {

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

              if (!cancelled) {
                setUserStats(stats)
              }
            } else {
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
          } catch {
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

        // Load discovery lists for authenticated users
        if (session?.user) {
          setDiscoveryLoading(true)
          try {
            const [
              mostAwardedResult,
              highestRankedResult,
              sleeperHitsResult,
              hotTakesResult,
              comebackGamesResult,
            ] = await Promise.all([
              supabase.rpc('get_most_awarded_this_year', {
                user_uuid: session.user.id,
              }),
              supabase.rpc('get_highest_ranked', {
                user_uuid: session.user.id,
              }),
              supabase.rpc('get_sleeper_hits', {
                user_uuid: session.user.id,
                max_num_ratings: 3000,
              }),
              supabase.rpc('get_hot_takes', {
                user_uuid: session.user.id,
                min_num_ratings: 750,
              }),
              supabase.rpc('get_comeback_games', {
                user_uuid: session.user.id,
              }),
            ])

            if (!cancelled) {
              setDiscoveryLists({
                mostAwarded: (mostAwardedResult.data || []) as MostAwardedGame[],
                highestRanked: (highestRankedResult.data ||
                  []) as HighestRankedGame[],
                sleeperHits: (sleeperHitsResult.data || []) as SleeperHitGame[],
                hotTakes: (hotTakesResult.data || []) as HotTakeGame[],
                comebackGames: (comebackGamesResult.data ||
                  []) as ComebackGame[],
              })
            }
          } catch (error) {
            console.error('Error loading discovery lists:', error)
          } finally {
            if (!cancelled) setDiscoveryLoading(false)
          }
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

  return (
    <>
      <HomepageView
        user={user}
        loading={loading}
        featuredGames={featuredGames}
        userStats={userStats}
        industryAwards={industryAwards}
        publicLists={publicLists}
        discoveryLists={discoveryLists}
        discoveryLoading={discoveryLoading}
      />
      
      {/* Onboarding for new users */}
      <OnboardingModal
        visible={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => setShowOnboarding(false)}
      />

      {/* Signup prompt for active guests */}
      <SignupPrompt
        visible={showSignupPrompt}
        onClose={() => setShowSignupPrompt(false)}
      />
    </>
  )
}
