/**
 * OnboardingModal - Welcome flow for new users
 * Shows 3-step introduction to MeepleGo's core features
 */
'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, MagnifyingGlassIcon, StarIcon, TrophyIcon } from '@heroicons/react/24/outline'
import Portal from '@/components/Elements/Portal'
import Overlay from '@/components/Elements/Overlay'
import { Button } from '@/components/Elements/Button'
import { Logo } from '@/components/Foundations/Logo'
import { getOnboardingState, saveOnboardingState } from '@/lib/guestSession'

export interface OnboardingModalProps {
  /** Whether to show the modal */
  visible?: boolean
  /** Callback when modal is closed */
  onClose?: () => void
  /** Callback when user completes onboarding */
  onComplete?: () => void
}

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to MeepleGo!',
    description: 'Your personal board game companion. Track, rate, and discover amazing games.',
    icon: Logo,
    iconClass: '',
    showSkip: true,
  },
  {
    id: 'discover',
    title: 'Start Exploring',
    description: 'Search for any board game and see details, ratings, and awards. No account needed to browse!',
    icon: MagnifyingGlassIcon,
    iconClass: 'w-16 h-16 text-sky-600',
    showSkip: true,
  },
  {
    id: 'rate',
    title: 'Rate Your Games',
    description: 'Give games a 1-10 rating to build your personal rankings. We\'ll save your progress when you\'re ready.',
    icon: StarIcon,
    iconClass: 'w-16 h-16 text-yellow-500',
    showSkip: true,
  },
  {
    id: 'track',
    title: 'Track Your Collection',
    description: 'Add games to your library and wishlist. Create custom lists and personal awards.',
    icon: TrophyIcon,
    iconClass: 'w-16 h-16 text-orange-500',
    showSkip: false,
  },
]

export default function OnboardingModal({
  visible: controlledVisible,
  onClose,
  onComplete,
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [internalVisible, setInternalVisible] = useState(false)

  // Use controlled visibility if provided, otherwise use internal state
  const visible = controlledVisible ?? internalVisible

  // Auto-show on mount if user hasn't been welcomed
  useEffect(() => {
    if (controlledVisible === undefined) {
      const state = getOnboardingState()
      if (!state.welcomed) {
        setInternalVisible(true)
      }
    }
  }, [controlledVisible])

  const handleClose = () => {
    // Mark as welcomed
    const state = getOnboardingState()
    state.welcomed = true
    saveOnboardingState(state)

    setInternalVisible(false)
    onClose?.()
  }

  const handleComplete = () => {
    const state = getOnboardingState()
    state.welcomed = true
    saveOnboardingState(state)

    setInternalVisible(false)
    onComplete?.()
  }

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const step = ONBOARDING_STEPS[currentStep]
  const IconComponent = step.icon

  return (
    <Portal>
      <Overlay
        visible={visible}
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
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>

          {/* Content */}
          <div className="p-8 sm:p-12 text-center">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              {step.id === 'welcome' ? (
                <Logo size="lg" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
                  <IconComponent className={step.iconClass} />
                </div>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed max-w-md mx-auto">
              {step.description}
            </p>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-8">
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-sky-600'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              {currentStep > 0 && (
                <Button
                  onClick={handlePrevious}
                  variant="ghost"
                  size="lg"
                >
                  Back
                </Button>
              )}
              
              {step.showSkip && (
                <Button
                  onClick={handleSkip}
                  variant="ghost"
                  size="lg"
                >
                  Skip Tour
                </Button>
              )}

              <Button
                onClick={handleNext}
                variant="primary"
                size="lg"
              >
                {currentStep === ONBOARDING_STEPS.length - 1 ? "Let's Go!" : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </Overlay>
    </Portal>
  )
}
