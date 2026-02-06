'use client'

import { TrophyIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils/helpers'
import AwardWinnerSpotlight from './AwardWinnerSpotlight'
import AwardNomineeGrid from './AwardNomineeGrid'
import type { AwardCategoryGame } from './AwardCategoryPanel'
import type { ReactNode } from 'react'

export interface AwardsPanelReadOnlyProps {
  title: string
  description?: string
  yearLabel?: string | number
  winner: AwardCategoryGame
  nominees?: AwardCategoryGame[]
  className?: string
  /** Slot for action buttons (e.g. Edit) in the header */
  headerExtra?: ReactNode
}

/**
 * Premium read-only display for a single award category.
 *
 * Designed to be swappable with a future <AwardsPanelEdit /> component
 * that shares the same outer props interface.
 */
export default function AwardsPanelReadOnly({
  title,
  description,
  yearLabel,
  winner,
  nominees = [],
  className,
  headerExtra,
}: AwardsPanelReadOnlyProps) {
  const hasNominees = nominees.length > 0

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6 lg:p-8',
        className
      )}
    >
      {/* ── Header ───────────────────────────────────────── */}
      <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <TrophyIcon className="h-5 w-5 flex-shrink-0 text-amber-500" />
          {yearLabel ? (
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              {yearLabel}
            </span>
          ) : null}
          <h3 className="font-display text-lg font-semibold leading-tight text-gray-900 sm:text-xl">
            {title}
          </h3>
        </div>
        {headerExtra ? (
          <div className="flex-shrink-0">{headerExtra}</div>
        ) : null}
      </div>

      {/* ── Body: Winner + Nominees ───────────────────────── */}
      {hasNominees ? (
        /* Side-by-side on desktop, stacked on mobile */
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Winner — fixed width on desktop */}
          <AwardWinnerSpotlight
            winner={winner}
            className="lg:w-56 lg:flex-shrink-0 xl:w-64"
          />

          {/* Nominees — fills remaining space */}
          <AwardNomineeGrid nominees={nominees} className="flex-1" />
        </div>
      ) : (
        /* Winner only — centered for a clean look */
        <div className="mx-auto max-w-xs">
          <AwardWinnerSpotlight winner={winner} />
        </div>
      )}
    </div>
  )
}
