"use client"
import GameCard from '@/components/shared/GameCard'
import { UserGroupIcon } from '@heroicons/react/24/outline'
import type { GameWithRanking } from '@/types'

interface NomineeGridProps {
  nominees: GameWithRanking[]
  layout?: 'scroll' | 'grid'
  className?: string
}

export default function NomineeGrid({ nominees, layout = 'scroll', className = "" }: NomineeGridProps) {
  const sortedNominees = nominees.sort((a, b) => a.name.localeCompare(b.name))
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 font-display">
        <UserGroupIcon className="w-5 h-5 text-gray-500" />
        <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100">Nominees</h4>
        <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">({nominees.length})</span>
      </div>
      
      {nominees.length > 0 ? (
        layout === 'scroll' ? (
          // Horizontal Scrolling Layout (Mobile/Tablet)
          <div className="relative">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              {sortedNominees.map((game) => (
                <div key={game.id} className="flex-shrink-0 w-32">
                  <GameCard game={game as any} viewMode="grid" variant="compact" hideWinnerBadge />
                </div>
              ))}
            </div>
            {nominees.length > 5 && (
              <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none" />
            )}
          </div>
        ) : (
          // Compact Grid Layout (Desktop) - Denser 4-across start
          <div className="grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1.5">
            {sortedNominees.map((game) => (
              <div key={game.id} className="relative group">
                <GameCard game={game as any} viewMode="grid" variant="compact" hideWinnerBadge />
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-sm text-gray-500 italic">No nominees yet</div>
      )}
    </div>
  )
}
