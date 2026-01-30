/**
 * DiscoveryCard - Display component for dynamic personal discovery lists
 * Shows personalized game recommendations based on user activity
 */

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import NetflixScrollSection from '@/components/Elements/NetflixScrollSection'

type DiscoveryCardProps = {
  title: string
  icon: ReactNode
  subtitle: string
  games: any[]
  emptyMessage: string
  loading?: boolean
  renderSubtitle: (game: any) => string
  href?: string
}

export default function DiscoveryCard({
  title,
  icon,
  subtitle,
  games,
  emptyMessage,
  loading = false,
  renderSubtitle,
  href,
}: DiscoveryCardProps) {
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

      {/* Empty State */}
      {!loading && games.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
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
                    No Image
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
