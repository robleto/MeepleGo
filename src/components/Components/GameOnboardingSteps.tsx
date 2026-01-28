/**
 * GameOnboardingSteps - Inline 3-step onboarding flow for game interaction
 * Can be embedded in GameDetailModal or game detail page
 * Steps: 1) Have you played? 2) Add to collection 3) Rate it
 */
'use client'

import { useState, useEffect } from 'react'
import {
  PlayIcon,
  BookOpenIcon,
  StarIcon,
  CheckIcon,
  ArrowRightIcon,
  HeartIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/Elements/Button'
import { supabase } from '@/lib/supabase'
import { addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import {
  addGuestRating,
  toggleGuestList,
} from '@/lib/guestSession'

interface GameOnboardingStepsProps {
  game: {
    id: string
    name: string
  }
  onComplete?: () => void
  /** Initial values if already set */
  initialPlayedIt?: boolean
  initialInLibrary?: boolean
  initialInWishlist?: boolean
  initialRating?: number | null
  /** Whether to auto-collapse after completion */
  autoCollapse?: boolean
}

type OnboardingStep = 'played' | 'library' | 'rate' | 'complete'

const STEPS: { id: OnboardingStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'played', label: 'Mark as Played', icon: PlayIcon },
  { id: 'library', label: 'Add to Collection', icon: BookOpenIcon },
  { id: 'rate', label: 'Rate It', icon: StarIcon },
]

export default function GameOnboardingSteps({
  game,
  onComplete,
  initialPlayedIt = false,
  initialInLibrary = false,
  initialInWishlist = false,
  initialRating = null,
  autoCollapse = false,
}: GameOnboardingStepsProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('played')
  const [playedIt, setPlayedIt] = useState(initialPlayedIt)
  const [inLibrary, setInLibrary] = useState(initialInLibrary)
  const [inWishlist, setInWishlist] = useState(initialInWishlist)
  const [rating, setRating] = useState<number | null>(initialRating)
  const [saving, setSaving] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }
    checkAuth()
  }, [])

  // Determine if step is complete
  const isComplete = currentStep === 'complete'
  const stepIndex = STEPS.findIndex((s) => s.id === currentStep)

  const handleAdvanceStep = () => {
    const idx = STEPS.findIndex((s) => s.id === currentStep)
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1].id)
    } else {
      setCurrentStep('complete')
      if (autoCollapse) {
        setTimeout(() => setIsCollapsed(true), 1500)
      }
      onComplete?.()
    }
  }

  const handlePlayedToggle = async () => {
    const newValue = !playedIt
    setPlayedIt(newValue)
    setSaving(true)

    try {
      if (isAuthenticated) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase.from('rankings').upsert(
            {
              user_id: session.user.id,
              game_id: game.id,
              played_it: newValue,
            },
            { onConflict: 'user_id,game_id' }
          )
        }
      }
    } finally {
      setSaving(false)
    }

    if (newValue) {
      setTimeout(() => handleAdvanceStep(), 400)
    }
  }

  const handleLibraryToggle = async () => {
    const newValue = !inLibrary
    setInLibrary(newValue)
    if (newValue) setInWishlist(false)

    setSaving(true)
    try {
      if (isAuthenticated) {
        if (newValue) {
          await addGameToDefaultList(game.id, 'library')
          if (inWishlist) {
            await removeGameFromDefaultList(game.id, 'wishlist')
          }
        } else {
          await removeGameFromDefaultList(game.id, 'library')
        }
      } else {
        toggleGuestList(game.id, game.name, 'library')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleWishlistToggle = async () => {
    const newValue = !inWishlist
    setInWishlist(newValue)
    if (newValue) setInLibrary(false)

    setSaving(true)
    try {
      if (isAuthenticated) {
        if (newValue) {
          await addGameToDefaultList(game.id, 'wishlist')
          if (inLibrary) {
            await removeGameFromDefaultList(game.id, 'library')
          }
        } else {
          await removeGameFromDefaultList(game.id, 'wishlist')
        }
      } else {
        toggleGuestList(game.id, game.name, 'wishlist')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRatingChange = async (newRating: number) => {
    setRating(newRating)

    setSaving(true)
    try {
        if (isAuthenticated) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            await supabase.from('rankings').upsert(
              {
                user_id: session.user.id,
                game_id: game.id,
                ranking: newRating,
              },
              { onConflict: 'user_id,game_id' }
            )
          }
      } else {
        addGuestRating(game.id, game.name, newRating)
      }
    } finally {
      setSaving(false)
    }

    setTimeout(() => handleAdvanceStep(), 400)
  }

  if (isCollapsed) {
    return null
  }

  return (
    <div className="border-2 border-sky-200 rounded-lg overflow-hidden bg-sky-50/50 shadow-sm">
      {/* Step content */}
      <div className="p-4">
        {currentStep === 'played' && (
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
              playedIt ? 'bg-green-100' : 'bg-white border border-gray-200'
            }`}>
              {playedIt ? (
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              ) : (
                <PlayIcon className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                Have you played this game?
              </h3>
              <p className="text-xs text-gray-500">
                Track your gaming history
              </p>
            </div>
            <Button
              onClick={handlePlayedToggle}
              variant={playedIt ? 'primary' : 'secondary'}
              size="sm"
              disabled={saving}
            >
              {playedIt ? (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Played
                </>
              ) : (
                <>
                  <PlayIcon className="w-4 h-4" />
                  I Played This
                </>
              )}
            </Button>
          </div>
        )}

        {currentStep === 'library' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Add to your collection
            </h3>
            <div className="flex gap-3">
              <button
                onClick={handleLibraryToggle}
                disabled={saving}
                className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  inLibrary
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                  inLibrary ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {inLibrary ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  ) : (
                    <BookOpenIcon className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">I Own It</div>
                  <div className="text-xs text-gray-500">Library</div>
                </div>
              </button>

              <button
                onClick={handleWishlistToggle}
                disabled={saving}
                className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  inWishlist
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                  inWishlist ? 'bg-pink-100' : 'bg-gray-100'
                }`}>
                  {inWishlist ? (
                    <CheckCircleIcon className="w-6 h-6 text-pink-600" />
                  ) : (
                    <HeartIcon className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">I Want It</div>
                  <div className="text-xs text-gray-500">Wishlist</div>
                </div>
              </button>
            </div>
            {(inLibrary || inWishlist) && (
              <div className="mt-3 text-center">
                <button
                  onClick={handleAdvanceStep}
                  className="text-sm text-sky-600 hover:text-sky-700 font-medium"
                >
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'rate' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Rate this game
            </h3>
            <div className="flex gap-2 items-center justify-between">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isSelected = rating === num
                const colorClass = 
                  num === 1 ? 'bg-red-500 hover:bg-red-600' :
                  num === 2 ? 'bg-orange-500 hover:bg-orange-600' :
                  num === 3 ? 'bg-amber-500 hover:bg-amber-600' :
                  num === 4 ? 'bg-yellow-500 hover:bg-yellow-600' :
                  num === 5 ? 'bg-lime-500 hover:bg-lime-600' :
                  num === 6 ? 'bg-green-500 hover:bg-green-600' :
                  num === 7 ? 'bg-emerald-500 hover:bg-emerald-600' :
                  num === 8 ? 'bg-teal-500 hover:bg-teal-600' :
                  num === 9 ? 'bg-cyan-500 hover:bg-cyan-600' :
                  'bg-sky-500 hover:bg-sky-600'
                
                return (
                  <button
                    key={num}
                    onClick={() => handleRatingChange(num)}
                    disabled={saving}
                    className={`flex-1 h-12 rounded-lg font-semibold text-white transition-all ${
                      isSelected 
                        ? `${colorClass} scale-110 shadow-lg ring-2 ring-offset-2 ring-offset-sky-50 ${
                            num === 1 ? 'ring-red-500' :
                            num === 2 ? 'ring-orange-500' :
                            num === 3 ? 'ring-amber-500' :
                            num === 4 ? 'ring-yellow-500' :
                            num === 5 ? 'ring-lime-500' :
                            num === 6 ? 'ring-green-500' :
                            num === 7 ? 'ring-emerald-500' :
                            num === 8 ? 'ring-teal-500' :
                            num === 9 ? 'ring-cyan-500' :
                            'ring-sky-500'
                          }`
                        : rating 
                          ? 'bg-gray-300 hover:bg-gray-400 opacity-40'
                          : colorClass
                    }`}
                  >
                    {num}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {rating ? `You rated it ${rating}/10` : 'Select a rating from 1 (worst) to 10 (best)'}
            </p>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Great start!
              </h3>
              <p className="text-xs text-gray-500">
                You've added {game.name} to your profile
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
