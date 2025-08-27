"use client"
import GameCard from '@/components/GameCard'
import Heading from '@/components/Heading'
import RatingChip from '@/components/RatingChip'
import { TrophyIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import type { GameWithRanking } from '@/types'

interface PersonalAwardCategorySectionProps {
  id: string
  label: string
  description?: string
  games: GameWithRanking[]
}

export default function PersonalAwardCategorySection({ id, label, description, games }: PersonalAwardCategorySectionProps) {
  if (!games.length) return null
  const winner = games[0]
  const nominees = games.slice(1).sort((a:any,b:any)=>a.name.localeCompare(b.name))

  // ratingTone removed in favor of shared HexRatingBadge
  return (
    <section id={`personal-${id}`} className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Heading as="h3" size="sm" className="mb-1 flex items-center gap-2">
            <span>{label}</span>
            <span className="text-[10px] font-normal text-gray-400">Top {games.length}</span>
          </Heading>
          {description && <p className="text-[11px] text-gray-500 leading-snug max-w-sm">{description}</p>}
        </div>
      </div>
      <div className="grid md:grid-cols-12 gap-6 items-start">
        {/* Winner */}
        <div className="md:col-span-4">
          <div className="flex items-center gap-2 mb-3 font-display">
            <TrophyIcon className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Winner</h4>
          </div>
          <div className="relative group">
            <GameCard game={winner as any} viewMode="grid" hideWinnerBadge variant="compact" />
          </div>
        </div>
        {/* Nominees */}
        <div className="md:col-span-8">
          <div className="flex items-center gap-2 mb-3 font-display">
            <UserGroupIcon className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Nominees</h4>
            <span className="text-xs text-gray-400">({nominees.length})</span>
          </div>
          {nominees.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {nominees.map((g:any) => (
                <div key={g.id} className="relative group">
                  <GameCard game={g as any} viewMode="grid" variant="compact" hideWinnerBadge />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">No nominees yet</div>
          )}
        </div>
      </div>
    </section>
  )
}
