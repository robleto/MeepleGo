/**
 * ForYouOverview — The "For You" highlights view, designed to be embedded
 * inside the profile overview tab. Shows personal insight cards, a reflective
 * nudge, recent activity, and taste-based micro-discovery.
 *
 * Hides sections that have no data instead of showing empty placeholders.
 */
'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ForYouHighlightCard from '@/components/Components/ForYouHighlightCard'
import type { HighlightGameItem } from '@/components/Components/ForYouHighlightCard'
import { supabase } from '@/lib/supabase'
import {
  SparklesIcon,
  FireIcon,
  TrophyIcon,
  ArrowPathIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlayIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline'
import type {
  MostAwardedGame,
  HighestRankedGame,
  SleeperHitGame,
  HotTakeGame,
  ComebackGame,
} from '@/types'
import {
  HOT_TAKE_MIN_DELTA,
  HOT_TAKE_MIN_NUM_RATINGS,
  SLEEPER_MAX_NUM_RATINGS,
} from '@/utils/discoveryThresholds'

// ---------- Types ----------

type RecentActivityItem = {
  activity_type: 'play' | 'ranking' | 'list_add'
  game_id: string
  game_name: string
  game_thumbnail_url: string | null
  detail: string
  occurred_at: string
}

// ---------- Helpers ----------

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return `${Math.floor(days / 7)}w ago`
}

function activityIcon(type: string): ReactNode {
  if (type === 'play') return <PlayIcon className="w-4 h-4 text-gray-400" />
  if (type === 'ranking') return <StarIcon className="w-4 h-4 text-amber-500" />
  return <BookmarkIcon className="w-4 h-4 text-gray-400" />
}

// ---------- Card data mappers ----------

function mapSleeperHits(games: SleeperHitGame[]): HighlightGameItem[] {
  return games.map((g) => ({
    game_id: g.game_id,
    game_name: g.game_name,
    game_thumbnail_url: g.game_thumbnail_url,
    subtitle: `Rated ${g.user_ranking}/10 · only ${(g.game_num_ratings ?? 0).toLocaleString()} ratings`,
  }))
}

function mapHotTakes(games: HotTakeGame[]): HighlightGameItem[] {
  return games
    .filter((g) => Math.abs(Number(g.abs_delta ?? g.delta ?? 0)) >= HOT_TAKE_MIN_DELTA)
    .map((g) => {
    const sign = g.delta > 0 ? '+' : ''
    const isPositive = g.delta >= 0
    const deltaValue = Math.abs(Number(g.delta)).toFixed(1)
    const deltaTone = isPositive ? 'text-emerald-500' : 'text-red-500'
    const ArrowIcon = isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
    return {
      game_id: g.game_id,
      game_name: g.game_name,
      game_thumbnail_url: g.game_thumbnail_url,
      subtitle: `You: ${g.user_ranking}/10 · Avg: ${Number(g.game_rating).toFixed(1)} · \u0394 ${sign}${Number(g.delta).toFixed(1)}`,
      subtitleNode: (
        <span className="inline-flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 font-medium ${deltaTone}`}>
            <FireIcon className="w-4 h-4" aria-hidden="true" />
            <ArrowIcon className="w-4 h-4" aria-hidden="true" />
            <span>{deltaValue}</span>
          </span>
          <span className="text-gray-400">vs avg</span>
        </span>
      ),
    }
  })
}

function mapMostAwarded(games: MostAwardedGame[]): HighlightGameItem[] {
  return games.map((g) => ({
    game_id: g.game_id,
    game_name: g.game_name,
    game_thumbnail_url: g.game_thumbnail_url,
    subtitle: `${g.total_points} pts · ${g.award_count} award${Number(g.award_count) !== 1 ? 's' : ''}`,
  }))
}

function mapComebackGames(games: ComebackGame[]): HighlightGameItem[] {
  return games.map((g) => ({
    game_id: g.game_id,
    game_name: g.game_name,
    game_thumbnail_url: g.game_thumbnail_url,
    subtitle: `${g.months_played_12mo} of 12 months · ${g.total_plays_12mo} plays`,
  }))
}

function mapHighestRanked(games: HighestRankedGame[]): HighlightGameItem[] {
  return games.map((g) => {
    const plays =
      Number(g.plays_12mo) > 0 ? ` · played ${g.plays_12mo}x this year` : ''
    return {
      game_id: g.game_id,
      game_name: g.game_name,
      game_thumbnail_url: g.game_thumbnail_url,
      subtitle: `${g.user_ranking}/10${plays}`,
    }
  })
}

// ---------- Component ----------

interface ForYouOverviewProps {
  /** The signed-in user's ID (required — parent is responsible for auth check) */
  userId: string
  /** Username for the greeting; falls back to "Welcome back" */
  username?: string | null
}

export default function ForYouOverview({
  userId,
  username,
}: ForYouOverviewProps) {
  // Card data
  const [sleeperHits, setSleeperHits] = useState<HighlightGameItem[]>([])
  const [hotTakes, setHotTakes] = useState<HighlightGameItem[]>([])
  const [mostAwarded, setMostAwarded] = useState<HighlightGameItem[]>([])
  const [comebackGames, setComebackGames] = useState<HighlightGameItem[]>([])
  const [highestRanked, setHighestRanked] = useState<HighlightGameItem[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([])
  const [cardsLoading, setCardsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    // Helper: call an RPC and return data or [] on any error.
    // Supabase .rpc() never rejects — it returns { data, error }.
    async function safeRpc<T>(
      name: string,
      params: Record<string, unknown>
    ): Promise<T[]> {
      try {
        const res = await supabase.rpc(name, params)
        console.log(`[ForYou] RPC "${name}"`, {
          params,
          data: res.data,
          error: res.error,
          status: res.status,
          statusText: res.statusText,
        })
        if (res.error) {
          console.warn(`[ForYou] RPC "${name}" error:`, res.error.message, res.error)
          return []
        }
        return (res.data ?? []) as T[]
      } catch (err) {
        console.warn(`[ForYou] RPC "${name}" threw:`, err)
        return []
      }
    }

    async function load() {
      console.log('[ForYou] Loading highlights for userId:', userId)
      try {
        // Each RPC is independent — one failure won't affect the others.
        const [
          sleeperData,
          hotTakeData,
          awardedData,
          comebackData,
          rankedData,
          activityData,
        ] = await Promise.all([
          safeRpc<SleeperHitGame>('get_sleeper_hits', {
            user_uuid: userId,
            max_num_ratings: SLEEPER_MAX_NUM_RATINGS,
          }),
          safeRpc<HotTakeGame>('get_hot_takes', {
            user_uuid: userId,
            min_num_ratings: HOT_TAKE_MIN_NUM_RATINGS,
          }),
          safeRpc<MostAwardedGame>('get_most_awarded_this_year', {
            user_uuid: userId,
          }),
          safeRpc<ComebackGame>('get_comeback_games', {
            user_uuid: userId,
          }),
          safeRpc<HighestRankedGame>('get_highest_ranked', {
            user_uuid: userId,
          }),
          safeRpc<RecentActivityItem>('get_recent_activity', {
            user_uuid: userId,
            days_back: 14,
          }),
        ])

        if (!cancelled) {
          setSleeperHits(mapSleeperHits(sleeperData))
          setHotTakes(mapHotTakes(hotTakeData))
          setMostAwarded(mapMostAwarded(awardedData))
          setComebackGames(mapComebackGames(comebackData))
          setHighestRanked(mapHighestRanked(rankedData))
          setRecentActivity(activityData)
        }
      } catch (err) {
        console.error('ForYouOverview load error:', err)
      } finally {
        if (!cancelled) setCardsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const greeting = username
    ? `${getGreeting()}, ${username}`
    : 'Welcome back'

  const hasRecentActivity = recentActivity.length > 0

  return (
    <div className="space-y-8">
      {/* ── 1. Personal anchor header ── */}
      <header>
        <h2 className="heading-display text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">
          {greeting}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s how your board-gaming year is shaping up.
        </p>
      </header>

      {/* ── 2. Your Highlights ── */}
      <section className="space-y-5">
        <h3 className="heading-display text-lg font-normal tracking-wide text-gray-700">
          Your Highlights
        </h3>

        {/* Primary row: 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ForYouHighlightCard
            title="Your Sleeper Hits"
            icon={<SparklesIcon className="w-5 h-5 text-indigo-500" />}
            items={sleeperHits}
            loading={cardsLoading}
            variant="primary"
            emptyHint="Rate some under-the-radar games to unlock this"
          />
          <ForYouHighlightCard
            title="Your Hot Takes"
            icon={<FireIcon className="w-5 h-5 text-red-500" />}
            items={hotTakes}
            loading={cardsLoading}
            variant="primary"
            emptyHint="Rate popular games to see where you disagree"
          />
          <ForYouHighlightCard
            title="Most Awarded This Year"
            icon={<TrophyIcon className="w-5 h-5 text-amber-500" />}
            items={mostAwarded}
            loading={cardsLoading}
            variant="primary"
            emptyHint="Create awards to see your top picks here"
          />
        </div>

        {/* Secondary row: 2 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ForYouHighlightCard
            title="Games You Keep Coming Back To"
            icon={<ArrowPathIcon className="w-5 h-5 text-teal-500" />}
            items={comebackGames}
            loading={cardsLoading}
            variant="secondary"
            emptyHint="Log plays over time to see your repeat favorites"
          />
          <ForYouHighlightCard
            title="Highest Ranked by You"
            icon={<StarIcon className="w-5 h-5 text-yellow-500" />}
            items={highestRanked}
            loading={cardsLoading}
            variant="secondary"
            emptyHint="Rate games to see your top-ranked titles"
          />
        </div>
      </section>

      {/* ── 3. Reflective nudge row ── */}
      {!cardsLoading && (
        <section className="rounded-lg bg-gray-50 border border-gray-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-600">
            Anything surprise you this year?
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/rankings"
              className="text-xs font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap"
            >
              Adjust rankings
            </Link>
            <Link
              href="/awards"
              className="text-xs font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap"
            >
              Add an award
            </Link>
            <Link
              href="/plays"
              className="text-xs font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap"
            >
              Log a play
            </Link>
          </div>
        </section>
      )}

      {/* ── 4. Recently recap ── */}
      {hasRecentActivity && (
        <section className="space-y-3">
          <h3 className="heading-display text-base font-normal tracking-wide text-gray-500">
            Recently
          </h3>
          <ul className="space-y-2">
            {recentActivity.slice(0, 5).map((item, idx) => (
              <li key={`${item.game_id}-${item.occurred_at}-${idx}`}>
                <Link
                  href={`/games/${item.game_id}`}
                  className="flex items-center gap-3 rounded-lg p-2 -m-1 hover:bg-gray-50 transition-colors group"
                >
                  <div className="relative w-8 h-8 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.game_thumbnail_url ? (
                      <Image
                        src={item.game_thumbnail_url}
                        alt={item.game_name}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-gray-300 text-[10px]">
                        ?
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors truncate">
                    <span className="mr-1.5">
                      {activityIcon(item.activity_type)}
                    </span>
                    <span className="font-medium">{item.game_name}</span>
                    <span className="text-gray-400">
                      {' '}
                      &middot; {item.detail}
                    </span>
                  </span>
                  <span className="ml-auto text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {formatRelativeDate(item.occurred_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── 5. "Based on your taste" micro-discovery ── */}
      {sleeperHits.length > 0 && (
        <section className="space-y-3">
          <h3 className="heading-display text-base font-normal tracking-wide text-gray-500">
            Based on your taste
          </h3>
          <p className="text-xs text-gray-400">
            Games you&apos;ve rated highly that others may not know about.
          </p>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {sleeperHits.slice(0, 3).map((item) => (
              <Link
                key={item.game_id}
                href={`/games/${item.game_id}`}
                className="flex-shrink-0 w-32 group"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-1.5">
                  {item.game_thumbnail_url ? (
                    <Image
                      src={item.game_thumbnail_url}
                      alt={item.game_name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="128px"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-300 text-xs">
                      No image
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-800 line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {item.game_name}
                </p>
                <p className="text-[11px] text-gray-400 line-clamp-1">
                  {item.subtitle}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
