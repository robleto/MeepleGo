"use client"
import GameCard from '@/components/Components/GameCard'
import { TrophyIcon } from '@heroicons/react/24/outline'
import type { GameWithRanking } from '@/types'

interface WinnerCardProps {
  game: GameWithRanking
  className?: string
}

export default function WinnerCard({ game, className = "" }: WinnerCardProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 font-display">
        <TrophyIcon className="w-5 h-5 text-amber-500" />
        <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100">Winner</h4>
      </div>
      <div className="relative group">
        <GameCard game={game as any} viewMode="grid" hideWinnerBadge variant="compact" />
      </div>
    </div>
  )
}
