/**
 * HorizontalCardSection - Generic display component for horizontal scrolling card sections.
 * Can display either game cards (for discovery lists) or custom card content (for awards, lists, etc.).
 * Includes section header, optional explainer banner, loading states, and horizontal scrolling.
 * Supports a first-time explainer that appears once per section.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import GameCard from '@/components/Components/GameCard'
import type { GameCardMetadata } from '@/components/Components/GameCardTypes'
import HorizontalCardScroll from '@/components/Elements/HorizontalCardScroll'
import Heading from '@/components/Components/Heading'
import { getSleepinessClassification } from '@/utils/sleepinessClassification'

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
    id: game.game_id || game.id,
    name: game.game_name || game.name,
    thumbnail_url: game.game_thumbnail_url || game.thumbnail_url || null,
    image_url: game.game_image_url || game.game_thumbnail_url || game.image_url || game.thumbnail_url || null,
    year_published: game.game_year_published || game.year_published || null,
    rating: game.game_rating || game.rating || null,
    num_ratings: game.game_num_ratings || game.num_ratings || null,
    min_players: game.game_min_players || game.min_players || null,
    max_players: game.game_max_players || game.max_players || null,
    playtime_minutes: game.game_playtime_minutes || game.playtime_minutes || null,
    categories: null,
    mechanics: null,
    publisher: null,
    description: null,
    summary: null,
    cached_at: null,
    created_at: '',
    updated_at: '',
    tagline: subtitle,
    ranking: game.ranking ?? null,
    played_it: game.played_it ?? false,
    list_membership: game.list_membership ?? { library: false, wishlist: false },
    delta: game.delta ?? null, // Pass through delta for hot takes
  }
}

type HorizontalCardSectionProps = {
  title: string
  subtitle?: string
  href?: string
  explainer?: string | null
  sectionKey?: string
  loading?: boolean
  itemWidth?: string
  showCount?: number
  loadingItemCount?: number
  hideIfEmpty?: boolean
} & (
  | {
      // Mode 1: Render game cards from discovery data
      mode: 'games'
      games: any[]
      renderSubtitle?: (game: any) => string
      metadata?: Omit<GameCardMetadata, 'customSubtext'> // customSubtext comes from renderSubtitle
      metadataMapper?: (game: any) => Partial<GameCardMetadata> // Per-game metadata overrides
      children?: never
    }
  | {
      // Mode 2: Render custom children
      mode: 'custom'
      children: ReactNode
      games?: never
      renderSubtitle?: never
      metadata?: never
    }
)

export default function HorizontalCardSection(props: HorizontalCardSectionProps) {
  const {
    title,
    subtitle,
    href,
    explainer,
    sectionKey,
    loading = false,
    itemWidth = 'w-40',
    showCount = 5.5,
    loadingItemCount = 8,
    hideIfEmpty = true,
  } = props
  const [showExplainer, setShowExplainer] = useState(false)

  // Determine if we have content to show
  const hasContent =
    props.mode === 'games' ? props.games.length > 0 : Boolean(props.children)

  useEffect(() => {
    if (explainer && sectionKey && hasContent) {
      const seen = getSeenSections()
      if (!seen.includes(sectionKey)) {
        setShowExplainer(true)
        markSectionSeen(sectionKey)
      }
    }
  }, [explainer, sectionKey, hasContent])

  // Don't render anything if not loading and no content (when hideIfEmpty is true)
  if (!loading && !hasContent && hideIfEmpty) {
    return null
  }

  return (
    <section className="space-y-1.5">
      {/* Header - Airbnb style with inline arrow */}
      <div className="flex items-center gap-2">
        <h2 className="text-[22px] font-semibold text-gray-900">
          {title}
        </h2>
        {href && hasContent && (
          <Link
            href={href}
            className="text-[22px] font-semibold text-gray-900 hover:text-gray-700 transition-colors"
            aria-label={`View all ${title}`}
          >
            →
          </Link>
        )}
      </div>

      {/* Optional subtitle (hidden by default to match Airbnb) */}
      {subtitle && (
        <p className="-mt-1 text-sm text-gray-600">
          {subtitle}
        </p>
      )}

      {/* First-time explainer */}
      {showExplainer && explainer && (
        <div className="px-4 py-3 border rounded-lg bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">{explainer}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <HorizontalCardScroll itemWidth={itemWidth} showCount={showCount}>
          {[...Array(loadingItemCount)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="mb-2 bg-gray-200 rounded-lg dark:bg-gray-700 aspect-square" />
              <div className="h-4 mb-1 bg-gray-200 rounded dark:bg-gray-700" />
              <div className="w-3/4 h-3 bg-gray-200 rounded dark:bg-gray-700" />
            </div>
          ))}
        </HorizontalCardScroll>
      )}

      {/* Content */}
      {!loading && hasContent && (
        <HorizontalCardScroll itemWidth={itemWidth} showCount={showCount}>
          {props.mode === 'games'
            ? props.games.slice(0, 12).map((game) => {
                const customSubtext = props.renderSubtitle ? props.renderSubtitle(game) : ''
                const perGameMetadata = props.metadataMapper ? props.metadataMapper(game) : {}
                const cardMetadata: GameCardMetadata = {
                  showYear: false,
                  ...props.metadata,
                  ...perGameMetadata,
                  // Auto-populate from game data if not explicitly set
                  delta: props.metadata?.delta !== undefined ? props.metadata.delta : (game.delta ?? null),
                  averageRating: props.metadata?.averageRating !== undefined ? props.metadata.averageRating : (game.average_user_rating || game.avgRating || null),
                  customSubtext: customSubtext || null,
                  // Auto-populate sleepiness classification for Sleeper Hits if game_num_ratings exists
                  sleepinessClassification: props.metadata?.sleepinessClassification !== undefined 
                    ? props.metadata.sleepinessClassification 
                    : (game.game_num_ratings != null ? getSleepinessClassification(game.game_num_ratings) : null),
                }
                return (
                  <GameCard
                    key={game.game_id}
                    game={toGameCardShape(game, customSubtext) as any}
                    viewMode="grid"
                    variant="detailed"
                    imageFit="contain"
                    className="flex flex-col h-full"
                    metadata={cardMetadata}
                  />
                )
              })
            : props.children}
        </HorizontalCardScroll>
      )}
    </section>
  )
}
