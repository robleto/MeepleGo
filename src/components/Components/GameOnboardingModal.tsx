/**
 * GameOnboardingModal - Guided onboarding flow for first game interaction
 * Highlights: Mark as Played → Add to Library/Wishlist → Rate
 * Uses existing GameDetailModal logic but with guided stepper overlay
 */
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  XMarkIcon,
  PlayIcon,
  BookOpenIcon,
  StarIcon,
  CheckIcon,
  ArrowRightIcon,
  HeartIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import Portal from '@/components/Elements/Portal'
import Overlay from '@/components/Elements/Overlay'
import { Button } from '@/components/Elements/Button'
import { RatingChip } from '@/components/Elements/Chip'
import RatingPopup from '@/components/Elements/RatingPopup'
import { supabase } from '@/lib/supabase'
import { addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import {
  addGuestRating,
  toggleGuestList,
  saveOnboardingState,
  getOnboardingState,
} from '@/lib/guestSession'

interface GameOnboardingModalProps {
  game: {
    id: string
    name: string
    year_published?: number | null
    thumbnail_url?: string | null
    image_url?: string | null
    rating?: number | null
  }
  open: boolean
  onClose: () => void
  onComplete: () => void
}

type OnboardingStep = 'played' | 'library' | 'rate' | 'complete'

const STEPS: { id: OnboardingStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'played', label: 'Mark as Played', icon: PlayIcon },
  { id: 'library', label: 'Add to Collection', icon: BookOpenIcon },
  { id: 'rate', label: 'Rate It', icon: StarIcon },
]

export default function GameOnboardingModal({
  game,
  open,
  onClose,
  onComplete,
}: GameOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('played')
  const [playedIt, setPlayedIt] = useState(false)
  const [inLibrary, setInLibrary] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [showRatingPopup, setShowRatingPopup] = useState(false)
  const [ratingAnchor, setRatingAnchor] = useState<{ x: number; y: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }
    checkAuth()
  }, [])

  // Reset state when game changes
  useEffect(() => {
    if (open) {
      setCurrentStep('played')
      setPlayedIt(false)
      setInLibrary(false)
      setInWishlist(false)
      setRating(null)
    }
  }, [game.id, open])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  if (!open) return null

  const handlePlayedToggle = async () => {
    const newValue = !playedIt
    setPlayedIt(newValue)
    setSaving(true)

    try {
      if (isAuthenticated) {
        // Save to database
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
      // Guest session tracking is handled at the end of onboarding
    } finally {
      setSaving(false)
    }

    // Auto-advance to next step after a moment
    if (newValue) {
      setTimeout(() => setCurrentStep('library'), 400)
    }
  }

  const handleLibraryToggle = async () => {
    const newValue = !inLibrary
    setInLibrary(newValue)
    if (newValue) setInWishlist(false) // Mutually exclusive for simplicity

    setSaving(true)
    try {
      if (isAuthenticated) {
        if (newValue) {
          await addGameToDefaultList(game.id, 'library')
          // Remove from wishlist if adding to library
          if (inWishlist) {
            await removeGameFromDefaultList(game.id, 'wishlist')
          }
        } else {
          await removeGameFromDefaultList(game.id, 'library')
        }
      } else {
        // Guest mode
        toggleGuestList(game.id, game.name, 'library')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleWishlistToggle = async () => {
    const newValue = !inWishlist
    setInWishlist(newValue)
    if (newValue) setInLibrary(false) // Mutually exclusive for simplicity

    setSaving(true)
    try {
      if (isAuthenticated) {
        if (newValue) {
          await addGameToDefaultList(game.id, 'wishlist')
          // Remove from library if adding to wishlist
          if (inLibrary) {
            await removeGameFromDefaultList(game.id, 'library')
          }
        } else {
          await removeGameFromDefaultList(game.id, 'wishlist')
        }
      } else {
        // Guest mode
        toggleGuestList(game.id, game.name, 'wishlist')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRatingClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setRatingAnchor({ x: rect.left + rect.width / 2, y: rect.top })
    setShowRatingPopup(true)
  }

  const handleRatingChange = async (newRating: number | null) => {
    setRating(newRating)
    setShowRatingPopup(false)

    if (newRating !== null) {
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
                played_it: true, // If rating, they've played it
              },
              { onConflict: 'user_id,game_id' }
            )
          }
        } else {
          // Guest mode
          addGuestRating(game.id, game.name, newRating)
        }
      } finally {
        setSaving(false)
      }

      // Mark as played if rating
      if (!playedIt) setPlayedIt(true)

      // Auto-advance to complete
      setTimeout(() => setCurrentStep('complete'), 400)
    }
  }

  const handleAdvanceStep = () => {
    if (currentStep === 'played') {
      setCurrentStep('library')
    } else if (currentStep === 'library') {
      setCurrentStep('rate')
    } else if (currentStep === 'rate') {
      setCurrentStep('complete')
    }
  }

  const handleComplete = () => {
    // Update onboarding state
    const state = getOnboardingState()
    if (rating !== null) state.firstRatingMade = true
    if (inLibrary || inWishlist) state.firstGameAdded = true
    saveOnboardingState(state)

    onComplete()
  }

  const stepIndex = STEPS.findIndex(s => s.id === currentStep)
  const isComplete = currentStep === 'complete'

  return (
    <Portal>
      <Overlay
        visible={open}
        variant="blur"
        clickToClose={false}
        zIndex={1000}
        className="p-4"
      >
        <div
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>

          {/* Game header */}
          <div className="bg-gradient-to-br from-sky-50 to-purple-50 p-6 pb-4">
            <div className="flex items-start gap-4">
              {/* Game image */}
              <div className="w-20 h-24 rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-200 bg-gray-100 flex-shrink-0">
                {(game.image_url || game.thumbnail_url) ? (
                  <Image
                    src={game.image_url || game.thumbnail_url || ''}
                    alt={game.name}
                    width={80}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No image
                  </div>
                )}
              </div>

              {/* Game info */}
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1 pr-8">
                  {game.name}
                </h2>
                {game.year_published && (
                  <p className="text-sm text-gray-500">{game.year_published}</p>
                )}
                {game.rating && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">BGG:</span>
                    <span className="text-sm font-medium text-gray-700">
                      {Number(game.rating).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress stepper */}
          {!isComplete && (
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                {STEPS.map((step, i) => {
                  const StepIcon = step.icon
                  const isActive = step.id === currentStep
                  const isDone = stepIndex > i || isComplete
                  const isClickable = i <= stepIndex || isDone

                  return (
                    <div key={step.id} className="flex items-center">
                      <button
                        onClick={() => isClickable && setCurrentStep(step.id)}
                        disabled={!isClickable}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                          isActive
                            ? 'bg-sky-100 text-sky-700'
                            : isDone
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-400'
                        } ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                      >
                        {isDone ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        ) : (
                          <StepIcon className={`w-5 h-5 ${isActive ? 'text-sky-600' : ''}`} />
                        )}
                        <span className={`text-xs font-medium hidden sm:inline ${isActive ? '' : isDone ? '' : 'text-gray-400'}`}>
                          {step.label}
                        </span>
                      </button>
                      {i < STEPS.length - 1 && (
                        <div className={`w-4 sm:w-8 h-0.5 mx-1 ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step content */}
          <div className="p-6">
            {currentStep === 'played' && (
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center transition-all ${
                  playedIt ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {playedIt ? (
                    <CheckCircleIcon className="w-10 h-10 text-green-600" />
                  ) : (
                    <PlayIcon className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Have you played this game?
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Let us know if you've played {game.name} so we can track your gaming history.
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handlePlayedToggle}
                    variant={playedIt ? 'primary' : 'secondary'}
                    size="lg"
                    className="w-full"
                    disabled={saving}
                  >
                    {playedIt ? (
                      <>
                        <CheckIcon className="w-5 h-5" />
                        Yes, I've Played It!
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-5 h-5" />
                        I've Played This
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleAdvanceStep}
                    variant="ghost"
                    size="md"
                    className="w-full"
                  >
                    Skip for now
                    <ArrowRightIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'library' && (
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Add to your collection
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Do you own this game or want to get it someday?
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={handleLibraryToggle}
                    disabled={saving}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      inLibrary
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                      inLibrary ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {inLibrary ? (
                        <CheckCircleIcon className="w-7 h-7 text-green-600" />
                      ) : (
                        <BookOpenIcon className="w-7 h-7 text-gray-500" />
                      )}
                    </div>
                    <div className="font-medium text-gray-900">I Own It</div>
                    <div className="text-xs text-gray-500 mt-1">Add to Library</div>
                  </button>

                  <button
                    onClick={handleWishlistToggle}
                    disabled={saving}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      inWishlist
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                      inWishlist ? 'bg-pink-100' : 'bg-gray-100'
                    }`}>
                      {inWishlist ? (
                        <CheckCircleIcon className="w-7 h-7 text-pink-600" />
                      ) : (
                        <HeartIcon className="w-7 h-7 text-gray-500" />
                      )}
                    </div>
                    <div className="font-medium text-gray-900">I Want It</div>
                    <div className="text-xs text-gray-500 mt-1">Add to Wishlist</div>
                  </button>
                </div>
                <Button
                  onClick={handleAdvanceStep}
                  variant={inLibrary || inWishlist ? 'primary' : 'ghost'}
                  size="lg"
                  className="w-full"
                >
                  {inLibrary || inWishlist ? (
                    <>
                      Continue
                      <ArrowRightIcon className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Skip for now
                      <ArrowRightIcon className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {currentStep === 'rate' && (
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Rate this game
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  How would you rate {game.name}? Your ratings help build your personal rankings.
                </p>
                <div className="mb-6">
                  <button
                    onClick={handleRatingClick}
                    className="mx-auto flex items-center justify-center focus:outline-none"
                  >
                    {rating ? (
                      <RatingChip
                        value={rating}
                        size="xl"
                        variant="default"
                        className="w-24 h-24 text-3xl font-bold"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <StarIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </button>
                  <p className="text-sm text-gray-500 mt-3">
                    {rating ? `You rated it ${rating}/10` : 'Click to rate 1-10'}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {rating ? (
                    <Button
                      onClick={() => setCurrentStep('complete')}
                      variant="primary"
                      size="lg"
                      className="w-full"
                    >
                      <CheckIcon className="w-5 h-5" />
                      Done!
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAdvanceStep}
                      variant="ghost"
                      size="md"
                      className="w-full"
                    >
                      Skip for now
                      <ArrowRightIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {currentStep === 'complete' && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-500 mx-auto mb-4 flex items-center justify-center">
                  <CheckIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Great start!
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {rating
                    ? `You've rated ${game.name} and it's been added to your profile!`
                    : playedIt || inLibrary || inWishlist
                    ? `${game.name} has been added to your profile!`
                    : `You can always come back and rate ${game.name} later.`}
                </p>

                {/* Summary of actions */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                    Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {playedIt ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={playedIt ? 'text-gray-900' : 'text-gray-400'}>
                        Marked as played
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {inLibrary || inWishlist ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={inLibrary || inWishlist ? 'text-gray-900' : 'text-gray-400'}>
                        {inLibrary ? 'Added to Library' : inWishlist ? 'Added to Wishlist' : 'Added to collection'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {rating ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={rating ? 'text-gray-900' : 'text-gray-400'}>
                        {rating ? `Rated ${rating}/10` : 'Rated the game'}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleComplete}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  Continue
                  <ArrowRightIcon className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Rating popup */}
          {showRatingPopup && ratingAnchor && (
            <RatingPopup
              gameId={game.id}
              gameName={game.name}
              currentRating={rating || undefined}
              isOpen={showRatingPopup}
              position={ratingAnchor}
              onClose={() => setShowRatingPopup(false)}
              onRatingChange={handleRatingChange}
            />
          )}
        </div>
      </Overlay>
    </Portal>
  )
}
