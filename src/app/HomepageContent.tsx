/**
 * HomepageContent — data container for the logged-in home page.
 *
 * Fetches user stats, computes the user's maturity phase, gates
 * discovery RPCs by phase, and passes everything to HomepageView.
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
import { getUserPhase, type UserPhaseResult } from '@/lib/userPhase'
import { FOUNDATIONAL_GAMES_BGG_IDS } from '@/lib/constants'

// Module-level cache for React Strict Mode stability
let cachedFeaturedGames: Game[] | null = null
let cachedIndustryAwards: any[] | null = null
let cachedPublicLists: any[] | null = null

// Initialize awards immediately
const INDUSTRY_AWARDS = (awardsData as any).categories.map((c: any) => ({
  ...c,
  icon: 'TrophyIcon',
}))

// Fallback games for loading state
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
  const [phaseResult, setPhaseResult] = useState<UserPhaseResult | null>(null)
  const [foundationalGames, setFoundationalGames] = useState<any[]>([])

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

    if (!onboardingState.welcomed && !user && !userStats) {
      setShowOnboarding(true)
    }

    if (!user && shouldPromptSignup()) {
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

        // Featured games: API -> fallback
        let gotGames = false
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
        } catch {
          // fall through to default
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
            .not(
              'list_type',
              'in',
              '(bgg_bestsellers,bgg_hotness,bgg_trendingplays,bgg_mostplayed)'
            )
            .order('updated_at', { ascending: false })
            .limit(6)

          if (
            !listsError &&
            publicListsData &&
            publicListsData.length > 0
          ) {
            if (!cancelled) {
              cachedPublicLists = publicListsData
              setPublicLists(publicListsData)
            }
          }
        } catch {
          // No fallback — section simply won't render
        }

        // ── Authenticated user: stats + phase + discovery ──
        if (session?.user) {
          try {
            // Fetch stats, play-logs count, and profile in parallel
            const [
              rankingsResult,
              libraryResult,
              userListsResult,
              userAwardsResult,
              playLogsCountResult,
              profileResult,
            ] = await Promise.all([
              supabase
                .from('rankings')
                .select('ranking, played_it, created_at')
                .eq('user_id', session.user.id),
              supabase
                .from('game_list_items')
                .select('game_id, game_lists!inner(name)')
                .eq('game_lists.user_id', session.user.id)
                .eq('game_lists.name', 'Library'),
              supabase
                .from('game_lists')
                .select('id')
                .eq('user_id', session.user.id),
              supabase
                .from('awards')
                .select('id')
                .eq('user_id', session.user.id),
              supabase
                .from('play_logs')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', session.user.id),
              supabase
                .from('profiles')
                .select('created_at')
                .eq('id', session.user.id)
                .single(),
            ])

            const rankings = rankingsResult.data
            const libraryItems = libraryResult.data
            const userLists = userListsResult.data
            const userAwards = userAwardsResult.data
            const playLogsCount = playLogsCountResult.count || 0

            // Compute account age
            const accountCreated = profileResult.data?.created_at
              ? new Date(profileResult.data.created_at)
              : new Date()
            const accountAgeDays = Math.floor(
              (Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24)
            )

            // Compute user phase
            const rankedGamesCount = rankings?.length || 0
            const awardsCount = userAwards?.length || 0
            const phase = getUserPhase({
              accountAgeDays,
              rankedGamesCount,
              playLogsCount,
              awardsCount,
            })

            // DEBUG ONLY: remove before release
            if (process.env.NEXT_PUBLIC_SHOW_PHASE_DEBUG === 'true') {
              console.log('MeepleGo phaseResult', {
                rankedGamesCount,
                playLogsCount,
                awardsCount,
                accountAgeDays,
                phaseResult: phase,
              })
            }

            if (!cancelled) {
              setPhaseResult(phase)
            }

            // Foundational Games (Phase 1 with 1–2 rankings only)
            if (phase.canShowFoundationalGames) {
              try {
                const { data: foundationalData } = await supabase
                  .from('games')
                  .select('id, name, thumbnail_url, bgg_id')
                  .in('bgg_id', FOUNDATIONAL_GAMES_BGG_IDS)
                if (!cancelled && foundationalData && foundationalData.length > 0) {
                  setFoundationalGames(
                    foundationalData.map((g) => ({
                      game_id: g.id,
                      game_name: g.name,
                      game_thumbnail_url: g.thumbnail_url,
                    }))
                  )
                }
              } catch {
                // If fetch fails, section simply does not render
              }
            }

            // Compute user stats
            if (!rankingsResult.error && rankings) {
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
                recentTags: [],
                listsCreated,
                awardsCreated,
              }

              if (!cancelled) {
                setUserStats(stats)
              }
            } else {
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

            // ── Discovery RPCs (gated by phase) ──
            setDiscoveryLoading(true)
            try {
              const noData = Promise.resolve({ data: [], error: null })

              const [
                mostAwardedResult,
                highestRankedResult,
                sleeperHitsResult,
                hotTakesResult,
                comebackGamesResult,
              ] = await Promise.all([
                phase.canShowMostAwarded
                  ? supabase.rpc('get_most_awarded_this_year', {
                      user_uuid: session.user.id,
                    })
                  : noData,
                phase.canShowHighestRanked
                  ? supabase.rpc('get_highest_ranked', {
                      user_uuid: session.user.id,
                    })
                  : noData,
                phase.canShowSleeperHits
                  ? supabase.rpc('get_sleeper_hits', {
                      user_uuid: session.user.id,
                      max_num_ratings: 3000,
                    })
                  : noData,
                phase.canShowHotTakes
                  ? supabase.rpc('get_hot_takes', {
                      user_uuid: session.user.id,
                      min_num_ratings: 750,
                    })
                  : noData,
                phase.canShowComebackGames
                  ? supabase.rpc('get_comeback_games', {
                      user_uuid: session.user.id,
                    })
                  : noData,
              ])

              if (!cancelled) {
                setDiscoveryLists({
                  mostAwarded: (mostAwardedResult.data ||
                    []) as MostAwardedGame[],
                  highestRanked: (highestRankedResult.data ||
                    []) as HighestRankedGame[],
                  sleeperHits: (sleeperHitsResult.data ||
                    []) as SleeperHitGame[],
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
              setPhaseResult(
                getUserPhase({
                  accountAgeDays: 0,
                  rankedGamesCount: 0,
                  playLogsCount: 0,
                  awardsCount: 0,
                })
              )
            }
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
        phaseResult={phaseResult}
        foundationalGames={foundationalGames}
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
