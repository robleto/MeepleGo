import React from 'react'

export interface GameCardDisplayProps {
  name: string
  year: number | null
  players: string
  time: string
  rating: number | null
  viewMode: 'grid' | 'list'
  imageUrl?: string | null
  inLibrary?: boolean
  inWishlist?: boolean
  tagline?: string | null
}

// Pure presentational (no next/image, no dynamic, no supabase)
export const GameCardDisplay: React.FC<GameCardDisplayProps> = ({
  name,
  year,
  players,
  time,
  rating,
  viewMode,
  imageUrl,
  inLibrary = false,
  inWishlist = false,
  tagline,
}) => {
  const ratingBadge =
    rating != null ? (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-600 text-white text-sm font-semibold shadow">
        {rating}
      </span>
    ) : null

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow flex items-center gap-4 w-full max-w-3xl p-4">
        <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement!.textContent = 'No Image'
              }}
            />
          ) : (
            'No Image'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {name}
          </h3>
          {tagline && (
            <p className="text-xs text-gray-600 truncate mb-1">{tagline}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
            {year && <span>{year}</span>}
            <span>{players}</span>
            <span>{time}</span>
            {inLibrary && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">
                Own
              </span>
            )}
            {inWishlist && (
              <span className="px-1.5 py-0.5 rounded bg-pink-50 text-pink-600">
                Wishlist
              </span>
            )}
          </div>
        </div>
        {ratingBadge}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow group relative w-56">
      <div className="aspect-square relative w-full rounded-t-lg overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.parentElement!.textContent = 'No Image'
            }}
          />
        ) : (
          'No Image'
        )}
        {ratingBadge && (
          <div className="absolute bottom-2 right-2">{ratingBadge}</div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {inLibrary && (
            <div className="w-7 h-7 bg-emerald-600 text-white flex items-center justify-center rounded-md text-[11px] font-medium shadow">
              O
            </div>
          )}
          {inWishlist && (
            <div className="w-7 h-7 bg-pink-500 text-white flex items-center justify-center rounded-md text-[11px] font-medium shadow">
              W
            </div>
          )}
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm truncate mb-1">
          {name}
        </h3>
        {tagline && (
          <p className="text-[11px] text-gray-600 leading-snug line-clamp-2 mb-2">
            {tagline}
          </p>
        )}
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          {year && <span>{year}</span>}
          <span>{players}</span>
          <span>{time}</span>
        </div>
      </div>
    </div>
  )
}
