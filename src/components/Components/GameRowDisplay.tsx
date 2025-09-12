import React from 'react'

export interface GameRowDisplayProps {
  name: string
  year: number | null
  players: string
  time: string
  rating: number | null
  imageUrl?: string | null
  inLibrary?: boolean
  inWishlist?: boolean
  tagline?: string | null
}

export const GameRowDisplay: React.FC<GameRowDisplayProps> = ({
  name,
  year,
  players,
  time,
  rating,
  imageUrl,
  inLibrary = false,
  inWishlist = false,
  tagline,
}) => {
  const ratingBadge = rating != null ? (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-600 text-white text-sm font-semibold shadow">
      {rating}
    </span>
  ) : null
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow flex items-center gap-4 w-full max-w-3xl">
      <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400 text-[10px]">
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
        <h3 className="text-base font-semibold text-gray-900 truncate">{name}</h3>
        {tagline && <p className="text-xs text-gray-600 truncate mb-1">{tagline}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
          {year && <span>{year}</span>}
          <span>{players}</span>
          <span>{time}</span>
          {inLibrary && <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">Own</span>}
          {inWishlist && <span className="px-1.5 py-0.5 rounded bg-pink-50 text-pink-600">Wishlist</span>}
        </div>
      </div>
      {ratingBadge}
    </div>
  )
}
