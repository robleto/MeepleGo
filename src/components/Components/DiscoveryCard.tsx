/**
 * DiscoveryCard - Display component for dynamic personal discovery lists.
 * Shows personalized game recommendations based on user activity.
 * Uses GameCard for consistent card styling across the app.
 * Supports a first-time explainer that appears once per section.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import GameCard from '@/components/Components/GameCard'
import HorizontalCardScroll from '@/components/Elements/HorizontalCardScroll'
import Heading from '@/components/Components/Heading'

const SEEN_SECTIONS_KEY = 'meeplego_seen_sections'

function getSeenSections(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(SEEN_SECTIONS_KEY) || '[]')
  } catch {
    return []
  }
}

function markSectionSeen(sectionKey: string): void {
  if (typeof window === 'undefined') return
  try {
    const seen = getSeenSections()
    if (!seen.includes(sectionKey)) {
      seen.push(sectionKey)
      localStorage.setItem(SEEN_SECTIONS_KEY, JSON.stringify(seen))
    }
  } catch {
    // Storage full or blocked — silently ignore
  }
}

/**
 * Map an RPC discovery result (game_id, game_name, etc.) into the shape
 * GameCard expects (id, name, thumbnail_url, year_published, etc.).
 */
function toGameCardShape(game: any, subtitle: string) {
  return {
    id: game.game_id,
    name: game.game_name,
    thumbnail_url: game.game_thumbnail_url ?? null,
    image_url: game.game_thumbnail_url ?? null,
    year_published: game.game_year_published ?? null,
    rating: game.game_rating ?? null,
    num_ratings: game.game_num_ratings ?? null,
    min_players: null,
    max_players: null,
    playtime_minutes: null,
    bgg_id: 0,
    categories: null,
    mechanics: null,
    publisher: null,
    description: null,
    summary: null,
    rank: null,
    cached_at: null,
    created_at: '',
    updated_at: '',
    tagline: subtitle,
  }
}

type DiscoveryCardProps = {
  title: string
  subtitle: string
  games: any[]
  emptyMessage?: string
  loading?: boolean
  renderSubtitle: (game: any) => string
  href?: string
  explainer?: string | null
  sectionKey?: string
}

export default function DiscoveryCard({
  title,
  subtitle,
  games,
  loading = false,
  renderSubtitle,
  href,
  explainer,
  sectionKey,
}: DiscoveryCardProps) {
  const [showExplainer, setShowExplainer] = useState(false)

  useEffect(() => {
    if (explainer && sectionKey && games.length > 0) {
      const seen = getSeenSections()
      if (!seen.includes(sectionKey)) {
        setShowExplainer(true)
        markSectionSeen(sectionKey)
      }
    }
  }, [explainer, sectionKey, games.length])

  // Don't render anything if not loading and no games
  if (!loading && games.length === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-4">
          <Heading size="md" className="mb-0">
            {title}
          </Heading>
          {href && games.length > 0 && (
            <Link
              href={href}
              className="text-xs font-medium sm:text-sm text-primary-600 hover:text-primary-500 whitespace-nowrap"
            >
              View all →
            </Link>
          )}
        </div>
        <p className="mt-0.5 text-sm sm:text-base text-gray-600 dark:text-gray-300">
          {subtitle}
        </p>
      </div>

      {/* First-time explainer */}
      {showExplainer && explainer && (
        <div className="px-4 py-3 mb-4 border rounded-lg bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">{explainer}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <HorizontalCardScroll itemWidth="w-48" showCount={5}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="mb-2 bg-gray-200 rounded-lg dark:bg-gray-700 aspect-square" />
              <div className="h-4 mb-1 bg-gray-200 rounded dark:bg-gray-700" />
              <div className="w-3/4 h-3 bg-gray-200 rounded dark:bg-gray-700" />
            </div>
          ))}
        </HorizontalCardScroll>
      )}

      {/* Games — rendered with GameCard for consistent styling */}
      {!loading && games.length > 0 && (
        <HorizontalCardScroll itemWidth="w-48" showCount={5}>
          {games.slice(0, 12).map((game) => (
            <GameCard
              key={game.game_id}
              game={toGameCardShape(game, renderSubtitle(game)) as any}
              viewMode="grid"
              variant="detailed"
              imageFit="contain"
              className="flex flex-col h-full"
            />
          ))}
        </HorizontalCardScroll>
      )}
    </section>
  )
}
