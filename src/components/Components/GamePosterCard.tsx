'use client'

import Image from 'next/image'
import { GameWithRanking } from '@/types'
import { formatYear } from '@/utils/helpers'
import { PlayIcon, StarIcon } from '@heroicons/react/24/outline'
import { RatingChip } from '../Elements/Chip'
import { useState } from 'react'
import RatingPicker from './Rankings/RatingPicker'

interface GamePosterCardProps {
  game: GameWithRanking
  onUpdate: (
    gameId: string,
    patch: { ranking?: number | null; played_it?: boolean }
  ) => void
  onClick?: () => void
}

export default function GamePosterCard({
  game,
  onUpdate,
  onClick,
}: GamePosterCardProps) {
  const [isRating, setIsRating] = useState(false)
  const r = game.ranking
  const togglePlayed = () => onUpdate(game.id, { played_it: !r?.played_it })
  const setRanking = (value: number | null) =>
    onUpdate(game.id, { ranking: value })

  // ratingTone replaced by HexRatingBadge

  return (
    <div
      className="group relative rounded-lg bg-white shadow hover:shadow-md transition cursor-pointer overflow-visible"
      onClick={onClick}
    >
      <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
        <Image
          src={game.image_url || '/placeholder-game.svg'}
          alt={game.name}
          fill
          className="object-contain p-2"
        />
        <div className="absolute top-2 left-2 text-[10px] font-medium bg-gray-900/70 text-white px-1.5 py-0.5 rounded">
          {formatYear(game.year_published)}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsRating(true)
          }}
          className="absolute top-2 right-2 hover:brightness-95"
          aria-label={r?.ranking ? `Rating ${r.ranking}` : 'Rate game'}
        >
          {r?.ranking ? <RatingChip value={r.ranking} size="xs" /> : (
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400 ring-1 ring-inset ring-gray-200">
              <StarIcon className="h-4 w-4" />
            </span>
          )}
        </button>
      </div>
      <div className="p-2">
        <h3 className="text-xs font-medium text-gray-900 line-clamp-2 min-h-[32px]">
          {game.name}
        </h3>
        <div className="mt-2 flex flex-wrap gap-1 items-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
              togglePlayed()
            }}
            className={`ml-auto p-1 rounded ${r?.played_it ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}
            title={r?.played_it ? 'Played' : 'Mark as played'}
          >
            <PlayIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isRating && (
        <div className="absolute inset-0 z-50 pointer-events-none">
          <div
            className="absolute inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-auto"
            onClick={() => setIsRating(false)}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <RatingPicker
              current={r?.ranking ?? null}
              onSelect={(val) => setRanking(val)}
              onClear={() => setRanking(null)}
              onClose={() => setIsRating(false)}
              size="md"
              className="px-3 py-3"
            />
          </div>
        </div>
      )}
    </div>
  )
}
