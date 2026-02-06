'use client'

import GameImage from '@/components/Elements/GameImage'
import { TrophyIcon } from '@heroicons/react/24/solid'
import { cn } from '@/utils/helpers'
import type { AwardCategoryGame } from './AwardCategoryPanel'

interface AwardWinnerSpotlightProps {
  winner: AwardCategoryGame
  className?: string
}

export default function AwardWinnerSpotlight({
  winner,
  className,
}: AwardWinnerSpotlightProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {/* Winner badge */}
      <div className="mb-3 flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-900 shadow-sm">
          <TrophyIcon className="h-3.5 w-3.5" />
          Winner
        </span>
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-xl border border-amber-200/60 bg-white shadow-md ring-1 ring-amber-100/40">
        {/* Image container — taller aspect for box-art emphasis */}
        <div className="relative aspect-[3/4] w-full bg-gray-50">
          <GameImage
            src={winner.image_url || winner.thumbnail_url || null}
            alt={winner.name}
            name={winner.name}
            fit="contain"
            variant="square"
            className="h-full w-full"
          />
          {/* Subtle golden bottom gradient overlay for text legibility */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Info */}
        <div className="px-4 py-3">
          <h4 className="font-display text-base font-semibold leading-snug text-gray-900">
            {winner.name}
          </h4>
          {winner.year_published ? (
            <p className="mt-0.5 text-sm text-gray-500">
              {winner.year_published}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
