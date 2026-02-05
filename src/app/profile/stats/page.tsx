'use client'

import { useEffect, useState } from 'react'
import ProfileLayout from '@/components/Components/ProfileLayout'
import { supabase } from '@/lib/supabase'
import {
  ChartBarIcon,
  TrophyIcon,
  StarIcon,
  CalendarIcon,
  UserGroupIcon,
  FireIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

interface DetailedStats {
  // Collection Stats
  totalGames: number
  gamesOwned: number
  gamesWishlisted: number
  gamesPlayed: number
  gamesRated: number
  gamesUnrated: number
  
  // Rating Stats
  avgRating: number
  highestRating: number
  lowestRating: number
  medianRating: number
  ratingsBy10: number
  ratingsBy9: number
  ratingsBy8: number
  ratingsBy7: number
  ratingsBy6: number
  ratingsBy5: number
  ratingsBy4: number
  ratingsBy3: number
  ratingsBy2: number
  ratingsBy1: number
  
  // Play Stats
  totalPlays: number
  uniqueGamesPlayed: number
  avgPlaysPerGame: number
  mostPlayedGame: { name: string; count: number } | null
  recentPlayStreak: number
  
  // List Stats
  totalLists: number
  publicLists: number
  privateLists: number
  totalListItems: number
  
  // Award Stats
  totalAwards: number
  
  // Time Stats
  accountAge: number
  firstRatingDate: string | null
  lastActivityDate: string | null
  mostActiveMonth: string | null
  
  // Category/Mechanic Preferences
  topCategories: Array<{ name: string; count: number }>
  topMechanics: Array<{ name: string; count: number }>
  
  // Player Count Preferences
  soloGames: number
  twoPlayerGames: number
  partyGames: number
  
  // Complexity
  avgComplexity: number
  lightGames: number
  mediumGames: number
  heavyGames: number
}

export default function StatsPage() {
  const [stats, setStats] = useState<DetailedStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const userId = session.user.id

      // Fetch all data in parallel
      const [
        rankingsData,
        playsData,
        listsData,
        awardsData,
        profileData,
      ] = await Promise.all([
        supabase
          .from('rankings')
          .select('*, game:games(*)')
          .eq('user_id', userId),
        supabase
          .from('play_logs')
          .select('*, game:games(name)')
          .eq('user_id', userId),
        supabase
          .from('game_lists')
          .select('*, items:game_list_items(count)')
          .eq('user_id', userId),
        supabase
          .from('awards')
          .select('count')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('created_at')
          .eq('id', userId)
          .single(),
      ])

      const rankings = rankingsData.data || []
      const plays = playsData.data || []
      const lists = listsData.data || []
      const profile = profileData.data

      // Collection Stats
      const gamesOwned = rankings.filter((r: any) => r.played_it || r.ranking).length
      const gamesWishlisted = lists.find((l: any) => l.name === 'Wishlist')?.items?.[0]?.count || 0
      const gamesPlayed = rankings.filter((r: any) => r.played_it).length
      const gamesRated = rankings.filter((r: any) => r.ranking !== null).length
      const gamesUnrated = rankings.filter((r: any) => r.ranking === null && r.played_it).length

      // Rating Stats
      const ratedGames = rankings.filter((r: any) => r.ranking !== null)
      const ratings = ratedGames.map((r: any) => r.ranking)
      const avgRating = ratings.length > 0 
        ? parseFloat((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(2))
        : 0
      const highestRating = ratings.length > 0 ? Math.max(...ratings) : 0
      const lowestRating = ratings.length > 0 ? Math.min(...ratings) : 0
      const sortedRatings = [...ratings].sort((a, b) => a - b)
      const medianRating = sortedRatings.length > 0
        ? sortedRatings[Math.floor(sortedRatings.length / 2)]
        : 0

      // Rating distribution
      const ratingCounts = {
        10: ratings.filter((r: number) => r === 10).length,
        9: ratings.filter((r: number) => r === 9).length,
        8: ratings.filter((r: number) => r === 8).length,
        7: ratings.filter((r: number) => r === 7).length,
        6: ratings.filter((r: number) => r === 6).length,
        5: ratings.filter((r: number) => r === 5).length,
        4: ratings.filter((r: number) => r === 4).length,
        3: ratings.filter((r: number) => r === 3).length,
        2: ratings.filter((r: number) => r === 2).length,
        1: ratings.filter((r: number) => r === 1).length,
      }

      // Play Stats
      const totalPlays = plays.length
      const uniqueGamesPlayed = new Set(plays.map((p: any) => p.game_id)).size
      const avgPlaysPerGame = uniqueGamesPlayed > 0 
        ? parseFloat((totalPlays / uniqueGamesPlayed).toFixed(2))
        : 0

      // Most played game
      const playCounts: Record<string, { name: string; count: number }> = {}
      plays.forEach((p: any) => {
        const gameId = p.game_id
        if (!playCounts[gameId]) {
          playCounts[gameId] = { name: p.game?.name || 'Unknown', count: 0 }
        }
        playCounts[gameId].count++
      })
      const mostPlayedGame = Object.values(playCounts).sort((a, b) => b.count - a.count)[0] || null

      // List Stats
      const totalLists = lists.filter((l: any) => l.name !== 'Library' && l.name !== 'Wishlist').length
      const publicLists = lists.filter((l: any) => l.is_public).length
      const privateLists = lists.filter((l: any) => !l.is_public).length
      const totalListItems = lists.reduce((sum: number, l: any) => sum + (l.items?.[0]?.count || 0), 0)

      // Category/Mechanic Preferences (from top-rated games 7+)
      const topRatedGames = rankings.filter((r: any) => r.ranking >= 7 && r.game)
      const categoryCount: Record<string, number> = {}
      const mechanicCount: Record<string, number> = {}

      topRatedGames.forEach((r: any) => {
        const game = r.game
        if (game.categories) {
          game.categories.forEach((cat: string) => {
            categoryCount[cat] = (categoryCount[cat] || 0) + 1
          })
        }
        if (game.mechanics) {
          game.mechanics.forEach((mech: string) => {
            mechanicCount[mech] = (mechanicCount[mech] || 0) + 1
          })
        }
      })

      const topCategories = Object.entries(categoryCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))

      const topMechanics = Object.entries(mechanicCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))

      // Player count preferences
      const soloGames = rankings.filter((r: any) => r.game?.min_players === 1).length
      const twoPlayerGames = rankings.filter((r: any) => 
        r.game?.min_players <= 2 && r.game?.max_players >= 2
      ).length
      const partyGames = rankings.filter((r: any) => r.game?.max_players >= 6).length

      // Time stats
      const accountAge = profile?.created_at 
        ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      const firstRating = rankings
        .filter((r: any) => r.created_at)
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]

      const lastActivity = [...rankings, ...plays]
        .filter((item: any) => item.created_at || item.play_date)
        .sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || a.play_date).getTime()
          const dateB = new Date(b.created_at || b.play_date).getTime()
          return dateB - dateA
        })[0]

      setStats({
        totalGames: rankings.length,
        gamesOwned,
        gamesWishlisted,
        gamesPlayed,
        gamesRated,
        gamesUnrated,
        avgRating,
        highestRating,
        lowestRating,
        medianRating,
        ratingsBy10: ratingCounts[10],
        ratingsBy9: ratingCounts[9],
        ratingsBy8: ratingCounts[8],
        ratingsBy7: ratingCounts[7],
        ratingsBy6: ratingCounts[6],
        ratingsBy5: ratingCounts[5],
        ratingsBy4: ratingCounts[4],
        ratingsBy3: ratingCounts[3],
        ratingsBy2: ratingCounts[2],
        ratingsBy1: ratingCounts[1],
        totalPlays,
        uniqueGamesPlayed,
        avgPlaysPerGame,
        mostPlayedGame,
        recentPlayStreak: 0,
        totalLists,
        publicLists,
        privateLists,
        totalListItems,
        totalAwards: awardsData.data?.count || 0,
        accountAge,
        firstRatingDate: firstRating?.created_at || null,
        lastActivityDate: lastActivity?.created_at || lastActivity?.play_date || null,
        mostActiveMonth: null,
        topCategories,
        topMechanics,
        soloGames,
        twoPlayerGames,
        partyGames,
        avgComplexity: 0,
        lightGames: 0,
        mediumGames: 0,
        heavyGames: 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted || loading) {
    return (
      <ProfileLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </ProfileLayout>
    )
  }

  if (!stats) {
    return (
      <ProfileLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">No stats available</p>
        </div>
      </ProfileLayout>
    )
  }

  return (
    <ProfileLayout>
      <div className="max-w-5xl mx-auto space-y-6">{/* Collection Overview */}
        <div className="rounded-2xl border border-gray-200/70 bg-white/80">
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <div className="flex items-center gap-2">
              <StarIcon className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Collection Overview
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Games" value={stats.totalGames} />
              <StatCard label="Owned" value={stats.gamesOwned} />
              <StatCard label="Wishlisted" value={stats.gamesWishlisted} />
              <StatCard label="Played" value={stats.gamesPlayed} />
              <StatCard label="Rated" value={stats.gamesRated} />
              <StatCard label="Unrated" value={stats.gamesUnrated} />
            </div>
          </div>
        </div>

        {/* Rating Statistics */}
        <div className="rounded-2xl border border-gray-200/70 bg-white/80">
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Rating Statistics
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Average Rating" value={stats.avgRating.toFixed(2)} />
              <StatCard label="Highest" value={stats.highestRating} />
              <StatCard label="Lowest" value={stats.lowestRating} />
              <StatCard label="Median" value={stats.medianRating} />
            </div>
            
            {/* Rating Distribution */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Rating Distribution</h3>
              <div className="space-y-2">
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((rating) => {
                  const count = (stats as any)[`ratingsBy${rating}`]
                  const percentage = stats.gamesRated > 0 ? (count / stats.gamesRated) * 100 : 0
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 w-8">{rating}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getRatingBarColor(rating)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-16 text-right">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Play Statistics */}
        <div className="rounded-2xl border border-gray-200/70 bg-white/80">
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <div className="flex items-center gap-2">
              <FireIcon className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Play Statistics
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Plays" value={stats.totalPlays} />
              <StatCard label="Unique Games" value={stats.uniqueGamesPlayed} />
              <StatCard label="Avg Plays/Game" value={stats.avgPlaysPerGame.toFixed(2)} />
              {stats.mostPlayedGame && (
                <div className="col-span-2">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Most Played
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {stats.mostPlayedGame.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stats.mostPlayedGame.count} plays
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* List Statistics */}
        <div className="rounded-2xl border border-gray-200/70 bg-white/80">
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <div className="flex items-center gap-2">
              <TrophyIcon className="h-5 w-5 text-yellow-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Lists & Awards
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Total Lists" value={stats.totalLists} />
              <StatCard label="Public Lists" value={stats.publicLists} />
              <StatCard label="Private Lists" value={stats.privateLists} />
              <StatCard label="List Items" value={stats.totalListItems} />
              <StatCard label="Awards Created" value={stats.totalAwards} />
            </div>
          </div>
        </div>

        {/* Preferences */}
        {(stats.topCategories.length > 0 || stats.topMechanics.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6">
            {stats.topCategories.length > 0 && (
              <div className="rounded-2xl border border-gray-200/70 bg-white/80">
                <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Top Categories
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {stats.topCategories.map((cat, idx) => (
                      <div key={cat.name} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          {idx + 1}. {cat.name}
                        </span>
                        <span className="text-sm font-medium text-primary-600">
                          {cat.count} games
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {stats.topMechanics.length > 0 && (
              <div className="rounded-2xl border border-gray-200/70 bg-white/80">
                <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Top Mechanics
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {stats.topMechanics.map((mech, idx) => (
                      <div key={mech.name} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          {idx + 1}. {mech.name}
                        </span>
                        <span className="text-sm font-medium text-primary-600">
                          {mech.count} games
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Player Count Preferences */}
        <div className="rounded-2xl border border-gray-200/70 bg-white/80">
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Player Count Preferences
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Solo Games" value={stats.soloGames} />
              <StatCard label="2-Player Games" value={stats.twoPlayerGames} />
              <StatCard label="Party Games (6+)" value={stats.partyGames} />
            </div>
          </div>
        </div>

        {/* Account Timeline */}
        <div className="rounded-2xl border border-gray-200/70 bg-white/80">
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Account Timeline
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                  Account Age
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {stats.accountAge} days
                </div>
              </div>
              {stats.firstRatingDate && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    First Rating
                  </div>
                  <div className="text-sm text-gray-900">
                    <span suppressHydrationWarning>
                      {new Date(stats.firstRatingDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
              {stats.lastActivityDate && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Last Activity
                  </div>
                  <div className="text-sm text-gray-900">
                    <span suppressHydrationWarning>
                      {new Date(stats.lastActivityDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </div>
      <div className="text-2xl font-semibold text-gray-900">
        {value}
      </div>
    </div>
  )
}

function getRatingBarColor(rating: number) {
  const colors: Record<number, string> = {
    10: 'bg-sky-500',
    9: 'bg-cyan-500',
    8: 'bg-teal-500',
    7: 'bg-emerald-500',
    6: 'bg-green-500',
    5: 'bg-lime-500',
    4: 'bg-yellow-500',
    3: 'bg-amber-500',
    2: 'bg-orange-500',
    1: 'bg-red-500',
  }
  return colors[rating] || 'bg-gray-400'
}
