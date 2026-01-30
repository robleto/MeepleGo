/**
 * DiscoveryCard - Display component for dynamic personal discovery lists.
 * Shows personalized game recommendations based on user activity.
 * Supports a first-time explainer that appears once per section.
 */

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import NetflixScrollSection from '@/components/Elements/NetflixScrollSection'

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

type DiscoveryCardProps = {
  title: string
  icon: ReactNode
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
  icon,
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
          <div className="flex items-center gap-2">
            <span className="flex items-center text-gray-500">{icon}</span>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          {href && games.length > 0 && (
            <Link
              href={href}
              className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
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
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">{explainer}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <NetflixScrollSection itemWidth="w-40" showCount={6}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 aspect-square rounded-lg mb-2" />
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-1" />
              <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-3/4" />
            </div>
          ))}
        </NetflixScrollSection>
      )}

      {/* Games Grid */}
      {!loading && games.length > 0 && (
        <NetflixScrollSection itemWidth="w-40" showCount={6}>
          {games.slice(0, 12).map((game) => (
            <Link
              key={game.game_id}
              href={`/games/${game.game_id}`}
              className="group"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 mb-2">
                {game.game_thumbnail_url ? (
                  <Image
                    src={game.game_thumbnail_url}
                    alt={game.game_name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                {game.game_name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                {renderSubtitle(game)}
              </p>
            </Link>
          ))}
        </NetflixScrollSection>
      )}
    </section>
  )
}
