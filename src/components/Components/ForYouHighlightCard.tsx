/**
 * ForYouHighlightCard — A calm, personal card for the For You page.
 * Shows a titled list of games with thumbnails and subtitles.
 * When no data is available, shows a gentle "coming soon" message.
 */
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

export type HighlightGameItem = {
  game_id: string
  game_name: string
  game_thumbnail_url: string | null
  subtitle: string
  subtitleNode?: ReactNode
}

type ForYouHighlightCardProps = {
  title: string
  icon: ReactNode
  items: HighlightGameItem[]
  loading?: boolean
  /** Show as a primary (larger) or secondary (compact) card */
  variant?: 'primary' | 'secondary'
  /** Hint shown when the card has no data yet */
  emptyHint?: string
}

function LoadingSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ForYouHighlightCard({
  title,
  icon,
  items,
  loading = false,
  variant = 'primary',
  emptyHint,
}: ForYouHighlightCardProps) {
  const maxVisible = variant === 'primary' ? 5 : 4
  const isEmpty = !loading && items.length === 0

  return (
    <div className={`bg-white rounded-xl border p-5 ${isEmpty ? 'border-gray-100/80 bg-gray-50/40' : 'border-gray-100'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`flex items-center ${isEmpty ? 'opacity-40' : ''}`} aria-hidden="true">
          {icon}
        </span>
        <h3 className={`text-base font-semibold ${isEmpty ? 'text-gray-400' : 'text-gray-800'}`}>{title}</h3>
      </div>

      {/* Loading */}
      {loading && <LoadingSkeleton count={variant === 'primary' ? 3 : 2} />}

      {/* Empty / coming soon */}
      {isEmpty && (
        <div className="py-3 text-center">
          <p className="text-xs text-gray-400">
            {emptyHint || 'Coming soon'}
          </p>
        </div>
      )}

      {/* Items */}
      {!loading && items.length > 0 && (
        <ul className="space-y-2.5">
          {items.slice(0, maxVisible).map((item) => (
            <li key={item.game_id}>
              <Link
                href={`/games/${item.game_id}`}
                className="flex items-center gap-3 group rounded-lg p-1.5 -m-1.5 hover:bg-gray-50 transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.game_thumbnail_url ? (
                    <Image
                      src={item.game_thumbnail_url}
                      alt={item.game_name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                      ?
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                    {item.game_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {item.subtitleNode ?? item.subtitle}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
