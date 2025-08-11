'use client'

import Link from 'next/link'
import { TrophyIcon, StarIcon, ListBulletIcon } from '@heroicons/react/24/outline'

interface RankingsEmptyStateGamesProps {
  isGuest: boolean
  onSignupClick?: () => void
  onLoginClick?: () => void
}

export default function RankingsEmptyStateGames({ isGuest, onSignupClick, onLoginClick }: RankingsEmptyStateGamesProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-2xl px-6">
        <div className="mb-6 flex justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
            <StarIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
            <ListBulletIcon className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
            <TrophyIcon className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Build Your Game Rankings</h1>
        <p className="text-gray-600 mb-8">Rate games 1–10, track what you've played, and later generate yearly award winners from your personal taste.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm mb-10">
          <div>
            <h4 className="font-semibold mb-1">1. Rate Games</h4>
            <p className="text-gray-500">Give each played game a 1–10 score.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. View Rankings</h4>
            <p className="text-gray-500">See your highest rated games by year.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. Create Awards</h4>
            <p className="text-gray-500">Crown yearly favorites (coming soon).</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/games" className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700">Start Rating Games</Link>
          {isGuest && (
            <div className="flex gap-3 justify-center">
              <button onClick={onSignupClick} className="px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50">Sign Up</button>
              <button onClick={onLoginClick} className="px-4 py-3 rounded-md border border-gray-200 bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100">Log In</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
