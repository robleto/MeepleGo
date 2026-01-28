/**
 * DiscoveryCard - Display component for dynamic personal discovery lists
 * Shows personalized game recommendations based on user activity
 */

import Image from 'next/image'
import Link from 'next/link'

type DiscoveryCardProps = {
  title: string
  icon: string
  games: any[]
  emptyMessage: string
  loading?: boolean
  renderSubtitle: (game: any) => string
  href?: string
}

export default function DiscoveryCard({
  title,
  icon,
  games,
  emptyMessage,
  loading = false,
  renderSubtitle,
  href,
}: DiscoveryCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label={title}>
            {icon}
          </span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
        {href && games.length > 0 && (
          <Link
            href={href}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View All →
          </Link>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 aspect-square rounded-lg mb-2" />
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-1" />
              <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && games.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      )}

      {/* Games Grid */}
      {!loading && games.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {games.slice(0, 10).map((game) => (
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
              <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {game.game_name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                {renderSubtitle(game)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
