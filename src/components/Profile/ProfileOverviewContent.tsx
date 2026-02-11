'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import GameCard from '@/components/Components/GameCard'
import Heading from '@/components/Components/Heading'
import { ChartBarIcon, TagIcon } from '@heroicons/react/24/outline'
import ActivityFeed from '@/components/Profile/ActivityFeed'

interface Game {
  id: string
  name: string
  year_published: number | null
  image_url: string | null
  thumbnail_url: string | null
  categories?: string[] | null
  mechanics?: string[] | null
  min_players?: number | null
  max_players?: number | null
}

interface RankedGame extends Game {
  ranking: number
  played_it: boolean
  updated_at?: string
}

interface WishlistGame extends Game {
  added_at: string
}

interface RecommendedGame extends Game {
  score: number
  reason: string
}

interface SuggestedInterest {
  name: string
  count: number
  percentage: number
}

interface RecentGame extends Game {
  action_type: 'rated' | 'library' | 'wishlist' | 'played'
  action_date: string
  ranking?: number | null
}

export default function ProfileOverviewContent({
  forcedUserId,
  username,
}: {
  forcedUserId?: string
  username?: string
} = {}) {
  const [loading, setLoading] = useState(true)
  const [recentGames, setRecentGames] = useState<RecentGame[]>([])
  const [topGames, setTopGames] = useState<RankedGame[]>([])
  const [wishlistGames, setWishlistGames] = useState<WishlistGame[]>([])
  const [recommendedGames, setRecommendedGames] = useState<RecommendedGame[]>([])
  const [suggestedCategories, setSuggestedCategories] = useState<SuggestedInterest[]>([])
  const [suggestedMechanics, setSuggestedMechanics] = useState<SuggestedInterest[]>([])
  const [ratingDistribution, setRatingDistribution] = useState<{ rating: number; count: number }[]>([])
  const [listMembershipMap, setListMembershipMap] = useState<
    Record<string, { library: boolean; wishlist: boolean }>
  >({})
  const [isOwnProfile, setIsOwnProfile] = useState(true)

  useEffect(() => {
    loadOverviewData()
  }, [forcedUserId])

  const loadOverviewData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const targetUserId = forcedUserId || session?.user?.id
      if (!targetUserId) return

      setIsOwnProfile(!forcedUserId || session?.user?.id === forcedUserId)

      const membershipMap = await loadListMembershipMap(targetUserId)

      await Promise.all([
        loadRecentGames(targetUserId, membershipMap),
        loadTopGames(targetUserId, membershipMap),
        loadWishlist(targetUserId, membershipMap),
        loadSuggestedInterests(targetUserId),
        loadRatingDistribution(targetUserId),
      ])

      // Load recommendations after we have user interests
      if (!forcedUserId || session?.user?.id === forcedUserId) {
        await loadRecommendations(targetUserId, membershipMap)
      }
    } catch (error) {
      console.error('Error loading overview data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentGames = async (
    userId: string,
    membershipMap: Record<string, { library: boolean; wishlist: boolean }>
  ) => {
    try {
      // Fetch recent rankings (ratings and played marks)
      const { data: recentRankings } = await supabase
        .from('rankings')
        .select('game_id, ranking, played_it, updated_at, game:games(*)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(20)

      // Fetch recent library additions
      const { data: recentLibrary } = await supabase
        .from('game_list_items')
        .select('game_id, created_at, game:games(*), game_list:game_lists!inner(name)')
        .eq('game_list.user_id', userId)
        .eq('game_list.name', 'Library')
        .order('created_at', { ascending: false })
        .limit(20)

      // Fetch recent wishlist additions
      const { data: recentWishlist } = await supabase
        .from('game_list_items')
        .select('game_id, created_at, game:games(*), game_list:game_lists!inner(name)')
        .eq('game_list.user_id', userId)
        .eq('game_list.name', 'Wishlist')
        .order('created_at', { ascending: false })
        .limit(20)

      // Combine and dedupe by game_id, keeping most recent action
      const gameMap = new Map<string, RecentGame>()

      // Add rankings (rated or played)
      recentRankings?.forEach((r: any) => {
        if (!r.game) return
        const gameId = r.game_id
        const existing = gameMap.get(gameId)
        const actionDate = r.updated_at

        if (!existing || new Date(actionDate) > new Date(existing.action_date)) {
          gameMap.set(gameId, {
            ...r.game,
            action_type: r.ranking ? 'rated' : 'played',
            action_date: actionDate,
            ranking: r.ranking,
            list_membership: membershipMap[gameId] || { library: false, wishlist: false },
          })
        }
      })

      // Add library items
      recentLibrary?.forEach((item: any) => {
        if (!item.game) return
        const gameId = item.game_id
        const existing = gameMap.get(gameId)
        const actionDate = item.created_at

        if (!existing || new Date(actionDate) > new Date(existing.action_date)) {
          gameMap.set(gameId, {
            ...item.game,
            action_type: 'library',
            action_date: actionDate,
            list_membership: membershipMap[gameId] || { library: false, wishlist: false },
          })
        }
      })

      // Add wishlist items
      recentWishlist?.forEach((item: any) => {
        if (!item.game) return
        const gameId = item.game_id
        const existing = gameMap.get(gameId)
        const actionDate = item.created_at

        if (!existing || new Date(actionDate) > new Date(existing.action_date)) {
          gameMap.set(gameId, {
            ...item.game,
            action_type: 'wishlist',
            action_date: actionDate,
            list_membership: membershipMap[gameId] || { library: false, wishlist: false },
          })
        }
      })

      // Sort by action_date descending and take top 10
      const sorted = Array.from(gameMap.values())
        .sort((a, b) => new Date(b.action_date).getTime() - new Date(a.action_date).getTime())
        .slice(0, 10)

      setRecentGames(sorted)
    } catch (error) {
      console.error('Error loading recent games:', error)
      setRecentGames([])
    }
  }

  const loadListMembershipMap = async (userId: string) => {
    const { data: lists } = await supabase
      .from('game_lists')
      .select('id,name')
      .eq('user_id', userId)
      .in('name', ['Library', 'Wishlist'])

    const libraryList = lists?.find((l) => l.name === 'Library')
    const wishlistList = lists?.find((l) => l.name === 'Wishlist')
    const listIds = [libraryList?.id, wishlistList?.id].filter(Boolean) as string[]

    if (listIds.length === 0) {
      setListMembershipMap({})
      return {}
    }

    const { data: items } = await supabase
      .from('game_list_items')
      .select('game_id, list_id')
      .in('list_id', listIds)

    const map: Record<string, { library: boolean; wishlist: boolean }> = {}
    ;(items || []).forEach((item: any) => {
      if (!map[item.game_id]) {
        map[item.game_id] = { library: false, wishlist: false }
      }
      if (item.list_id === libraryList?.id) map[item.game_id].library = true
      if (item.list_id === wishlistList?.id) map[item.game_id].wishlist = true
    })

    setListMembershipMap(map)
    return map
  }

  const loadTopGames = async (
    userId: string,
    membershipMap: Record<string, { library: boolean; wishlist: boolean }>
  ) => {
    const { data } = await supabase
      .from('rankings')
      .select('ranking, played_it, game:games(*)')
      .eq('user_id', userId)
      .not('ranking', 'is', null)
      .order('ranking', { ascending: false })
      .limit(20)

    if (data) {
      const games = data.map((r: any) => ({
        ...r.game,
        ranking: r.ranking,
        played_it: r.played_it,
        list_membership: membershipMap[r.game?.id] || { library: false, wishlist: false },
      }))
      setTopGames(games)
    }
  }

  const loadWishlist = async (
    userId: string,
    membershipMap: Record<string, { library: boolean; wishlist: boolean }>
  ) => {
    const { data } = await supabase
      .from('game_list_items')
      .select('created_at, game:games(*), game_list:game_lists!inner(name)')
      .eq('game_list.user_id', userId)
      .eq('game_list.name', 'Wishlist')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      const games = data.map((item: any) => ({
        ...item.game,
        added_at: item.created_at,
        list_membership: membershipMap[item.game?.id] || { library: false, wishlist: false },
      }))
      setWishlistGames(games)
    }
  }

  const loadRecommendations = async (
    userId: string,
    membershipMap: Record<string, { library: boolean; wishlist: boolean }>
  ) => {
    try {
      // Get user's owned games
      const { data: ownedGames } = await supabase
        .from('game_list_items')
        .select('game_id, game_list:game_lists!inner(name)')
        .eq('game_list.user_id', userId)
        .eq('game_list.name', 'Library')

      const ownedGameIds = new Set(ownedGames?.map((g: any) => g.game_id) || [])

      // Get user's favorite categories/mechanics
      const favCategories = suggestedCategories.slice(0, 3).map((c) => c.name)
      const favMechanics = suggestedMechanics.slice(0, 3).map((m) => m.name)

      // Get popular games that user doesn't own
      const { data: hotGames } = await supabase
        .from('games')
        .select('*')
        .not('id', 'in', `(${Array.from(ownedGameIds).join(',') || 'none'})`)
        .order('num_ratings', { ascending: false, nullsFirst: false })
        .limit(100)

      if (!hotGames) return

      // Score games based on matching categories/mechanics
      const scored = hotGames
        .map((game) => {
          let score = 0
          let reasons: string[] = []

          // High popularity bonus
          if (game.num_ratings && game.num_ratings >= 1000) {
            score += 50
            reasons.push('Highly Rated')
          }

          // Category matching
          if (game.categories) {
            const matches = game.categories.filter((cat: string) =>
              favCategories.includes(cat)
            ).length
            score += matches * 20
            if (matches > 0) reasons.push('Matches your favorite categories')
          }

          // Mechanic matching
          if (game.mechanics) {
            const matches = game.mechanics.filter((mech: string) =>
              favMechanics.includes(mech)
            ).length
            score += matches * 20
            if (matches > 0) reasons.push('Matches your favorite mechanics')
          }

          return {
            ...game,
            score,
            reason: reasons[0] || 'Popular Game',
            list_membership: membershipMap[game.id] || { library: false, wishlist: false },
          }
        })
        .filter((g) => g.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)

      setRecommendedGames(scored)
    } catch (error) {
      console.error('Error loading recommendations:', error)
    }
  }

  const loadSuggestedInterests = async (userId: string) => {
    const { data: topRated } = await supabase
      .from('rankings')
      .select('game:games(categories, mechanics)')
      .eq('user_id', userId)
      .gte('ranking', 8)

    if (!topRated || topRated.length === 0) return

    const categoryCount: Record<string, number> = {}
    const mechanicCount: Record<string, number> = {}
    let totalGames = topRated.length

    topRated.forEach((r: any) => {
      const game = r.game
      if (game?.categories) {
        game.categories.forEach((cat: string) => {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1
        })
      }
      if (game?.mechanics) {
        game.mechanics.forEach((mech: string) => {
          mechanicCount[mech] = (mechanicCount[mech] || 0) + 1
        })
      }
    })

    const categories = Object.entries(categoryCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalGames) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const mechanics = Object.entries(mechanicCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalGames) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    setSuggestedCategories(categories)
    setSuggestedMechanics(mechanics)
  }

  const loadRatingDistribution = async (userId: string) => {
    const { data } = await supabase
      .from('rankings')
      .select('ranking')
      .eq('user_id', userId)
      .not('ranking', 'is', null)

    if (!data) return

    const distribution: Record<number, number> = {}
    for (let i = 1; i <= 10; i++) {
      distribution[i] = 0
    }

    data.forEach((r: any) => {
      const rating = Math.round(r.ranking)
      if (rating >= 1 && rating <= 10) {
        distribution[rating]++
      }
    })

    setRatingDistribution(
      Object.entries(distribution).map(([rating, count]) => ({
        rating: parseInt(rating),
        count,
      }))
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const maxCount = Math.max(...ratingDistribution.map((d) => d.count), 1)

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'rated': return 'Rated'
      case 'library': return 'Added to Library'
      case 'wishlist': return 'Added to Wishlist'
      case 'played': return 'Marked as Played'
      default: return 'Updated'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'rated': return 'bg-amber-100 text-amber-700'
      case 'library': return 'bg-green-100 text-green-700'
      case 'wishlist': return 'bg-pink-100 text-pink-700'
      case 'played': return 'bg-sky-100 text-sky-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-10">
      {/* Recently Added/Updated Games - Horizontal Carousel */}
      {recentGames.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Heading as="h2" size="md" className="text-gray-900">
              {username ? `${username}'s` : 'Your'} Recent Activity
            </Heading>
            <Link
              href={username ? `/${username}/activity` : '/profile/activity'}
              className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
            >
              View all →
            </Link>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Games {username ? 'they\'ve' : 'you\'ve'} recently interacted with
          </p>
          <div className="-mx-4 sm:-mx-6 lg:-mx-8">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 sm:px-6 lg:px-8">
              {recentGames.map((game) => (
                <div key={game.id} className="flex-shrink-0 w-40">
                  <div className="h-[320px]">
                    <GameCard
                      game={game as any}
                      imageFit="contain"
                      viewMode="grid"
                      className="h-full"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getActionColor(game.action_type)}`}>
                      {getActionLabel(game.action_type)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Ranked Games - Netflix Style */}
      {topGames.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Heading as="h2" size="md" className="text-gray-900">
              {username ? `${username}'s` : 'Your'} Top Rated Games
            </Heading>
            <Link
              href={username ? `/${username}/rankings` : '/profile/rankings'}
              className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
            >
              View all →
            </Link>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Auto-generated from {username ? 'their' : 'your'} highest-rated games
          </p>
          <div className="-mx-4 sm:-mx-6 lg:-mx-8">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 sm:px-6 lg:px-8">
              {topGames.map((game) => (
                <div key={game.id} className="flex-shrink-0 w-40 h-[320px]">
                  <GameCard
                    game={game as any}
                    imageFit="contain"
                    viewMode="grid"
                    className="h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Wishlist - Netflix Style */}
      {wishlistGames.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Heading as="h2" size="md" className="text-gray-900">
              {username ? `${username}'s` : 'Your'} Wishlist
            </Heading>
            <Link
              href={username ? `/${username}/wishlist` : '/profile/wishlist'}
              className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
            >
              View all →
            </Link>
          </div>
          <div className="-mx-4 sm:-mx-6 lg:-mx-8">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 sm:px-6 lg:px-8">
              {wishlistGames.map((game) => (
                <div key={game.id} className="flex-shrink-0 w-40 h-[320px]">
                  <GameCard
                    game={game as any}
                    imageFit="contain"
                    viewMode="grid"
                    className="h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recommended For You - Netflix Style (own profile only) */}
      {isOwnProfile && recommendedGames.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Heading as="h2" size="md" className="text-gray-900">
              Recommended For You
            </Heading>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Based on your favorite categories, mechanics, and popular games
          </p>
          <div className="-mx-4 sm:-mx-6 lg:-mx-8">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 sm:px-6 lg:px-8">
              {recommendedGames.map((game) => (
                <div key={game.id} className="flex-shrink-0 w-40">
                  <div className="h-[320px]">
                    <GameCard
                      game={game as any}
                      imageFit="contain"
                      viewMode="grid"
                      className="h-full"
                    />
                  </div>
                  <p className="text-xs text-emerald-600 mt-1 font-medium min-h-[1.25rem] line-clamp-1">
                    {game.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        {ratingDistribution.length > 0 && (
          <div className="rounded-2xl border border-gray-200/70 bg-white/80 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ChartBarIcon className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Rating Distribution
              </h2>
            </div>
            <div className="space-y-2">
              {ratingDistribution.map((item) => (
                <div key={item.rating} className="flex items-center gap-3">
                  <div className="w-8 text-sm font-medium text-gray-700">
                    {item.rating}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 flex items-center justify-end pr-2`}
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    >
                      {item.count > 0 && (
                        <span className="text-xs font-semibold text-white">
                          {item.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Interests */}
        {(suggestedCategories.length > 0 || suggestedMechanics.length > 0) && (
          <div className="rounded-2xl border border-gray-200/70 bg-white/80 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TagIcon className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Favorite Themes & Mechanics
              </h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Based on {username ? 'their' : 'your'} top-rated games (8+)
            </p>

            {suggestedCategories.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {suggestedCategories.map((cat) => (
                    <div
                      key={cat.name}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium"
                    >
                      {cat.name}
                      <span className="text-primary-600 font-semibold">
                        {cat.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {suggestedMechanics.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Mechanics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {suggestedMechanics.map((mech) => (
                    <div
                      key={mech.name}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium"
                    >
                      {mech.name}
                      <span className="text-purple-600 font-semibold">
                        {mech.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ActivityFeed
        forcedUserId={forcedUserId}
        username={username}
        limit={8}
        showHeader
        showViewAll
      />
    </div>
  )
}
