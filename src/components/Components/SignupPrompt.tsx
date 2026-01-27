/**
 * SignupPrompt - Conversion modal to save guest progress
 * Shows after user has enough activity to warrant creating account
 */
'use client'

import { useRouter } from 'next/navigation'
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline'
import Portal from '@/components/Elements/Portal'
import Overlay from '@/components/Elements/Overlay'
import { Button } from '@/components/Elements/Button'
import { getGuestActivityCount, getOnboardingState, saveOnboardingState } from '@/lib/guestSession'

export interface SignupPromptProps {
  /** Whether to show the prompt */
  visible: boolean
  /** Callback when prompt is closed */
  onClose: () => void
  /** Callback when user dismisses permanently */
  onDismiss?: () => void
}

export default function SignupPrompt({
  visible,
  onClose,
  onDismiss,
}: SignupPromptProps) {
  const router = useRouter()
  const activity = getGuestActivityCount()

  const handleSignup = () => {
    // Mark conversion prompt as shown
    const state = getOnboardingState()
    state.conversionPromptShown = true
    saveOnboardingState(state)

    // Redirect to signup with return URL
    router.push('/signup?return=/profile&migrate=true')
  }

  const handleDismiss = () => {
    const state = getOnboardingState()
    state.conversionPromptShown = true
    state.dismissed = true
    saveOnboardingState(state)

    onDismiss?.()
    onClose()
  }

  const handleContinueAsGuest = () => {
    const state = getOnboardingState()
    state.conversionPromptShown = true
    saveOnboardingState(state)

    onClose()
  }

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
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient header */}
          <div className="bg-gradient-to-br from-sky-500 to-sky-600 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20" />
            </div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                You're on a Roll!
              </h2>
              <p className="text-sky-100 text-sm">
                Save your progress and unlock more features
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {activity.ratings > 0 && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{activity.ratings}</div>
                  <div className="text-xs text-gray-600">Rating{activity.ratings !== 1 ? 's' : ''}</div>
                </div>
              )}
              {activity.library > 0 && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{activity.library}</div>
                  <div className="text-xs text-gray-600">In Library</div>
                </div>
              )}
              {activity.wishlist > 0 && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{activity.wishlist}</div>
                  <div className="text-xs text-gray-600">Wishlist</div>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sky-600 text-xs">✓</span>
                </div>
                <div className="text-sm text-gray-700">
                  <strong className="font-medium">Save your progress</strong> across all devices
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sky-600 text-xs">✓</span>
                </div>
                <div className="text-sm text-gray-700">
                  <strong className="font-medium">Create custom lists</strong> and personal awards
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sky-600 text-xs">✓</span>
                </div>
                <div className="text-sm text-gray-700">
                  <strong className="font-medium">Track your gaming</strong> with play logs and stats
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleSignup}
                variant="primary"
                size="lg"
                className="w-full"
              >
                Create Free Account
              </Button>
              
              <Button
                onClick={handleContinueAsGuest}
                variant="ghost"
                size="md"
                className="w-full"
              >
                Continue Without Account
              </Button>

              <button
                onClick={handleDismiss}
                className="w-full text-xs text-gray-500 hover:text-gray-700 py-2"
              >
                Don't show this again
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </Overlay>
    </Portal>
  )
}
