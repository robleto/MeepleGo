'use client'
import Heading from '@/components/Components/Heading'
import WinnerCard from './WinnerCard'
import NomineeGrid from './NomineeGrid'
import type { GameWithRanking } from '@/types'

interface AwardShowcaseProps {
  id: string
  title: string
  description?: string
  games: GameWithRanking[]
  className?: string
}

export default function AwardShowcase({
  id,
  title,
  description,
  games,
  className = '',
}: AwardShowcaseProps) {
  if (!games.length) return null

  const winner = games[0]
  const nominees = games.slice(1)

  return (
    <section
      id={`award-${id}`}
      className={`bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Heading as="h3" size="md" className="mb-2 flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
              Top {games.length}
            </span>
          </Heading>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Winner and Nominees */}
      <div className="space-y-6">
        {/* Mobile/Tablet: Stacked Layout */}
        <div className="block lg:hidden">
          {/* Winner Section */}
          <div className="flex justify-center md:justify-start mb-6">
            <div className="w-full max-w-xs">
              <WinnerCard game={winner} />
            </div>
          </div>

          {/* Nominees Section - Horizontal Scroll */}
          {nominees.length > 0 && (
            <div>
              <NomineeGrid nominees={nominees} layout="scroll" />
            </div>
          )}
        </div>

        {/* Desktop: Side-by-side with Compact Grid */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-12 gap-8 items-start">
            {/* Winner - Takes 4 columns */}
            <div className="col-span-4">
              <WinnerCard game={winner} />
            </div>

            {/* Nominees - Takes 8 columns with dense grid */}
            <div className="col-span-8">
              {nominees.length > 0 && (
                <NomineeGrid nominees={nominees} layout="grid" />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
