/**
 * SaveProgressModal - Prompts user to create account or log in to save progress
 * Shows after completing game onboarding when not authenticated
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  XMarkIcon,
  SparklesIcon,
  CheckIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline'
import Portal from '@/components/Elements/Portal'
import Overlay from '@/components/Elements/Overlay'
import { Button } from '@/components/Elements/Button'
import { getGuestActivityCount, saveOnboardingState, getOnboardingState } from '@/lib/guestSession'

export interface SaveProgressModalProps {
  visible: boolean
  onClose: () => void
  onAuthSuccess?: () => void
}

export default function SaveProgressModal({
  visible,
  onClose,
  onAuthSuccess,
}: SaveProgressModalProps) {
  const router = useRouter()
  const activity = getGuestActivityCount()

  const handleCreateAccount = () => {
    // Mark that we showed the conversion prompt
    const state = getOnboardingState()
    state.conversionPromptShown = true
    saveOnboardingState(state)

    // Navigate to signup with return URL to continue flow
    router.push('/signup?return=/profile&migrate=true')
  }

  const handleLogin = () => {
    // Mark that we showed the conversion prompt
    const state = getOnboardingState()
    state.conversionPromptShown = true
    saveOnboardingState(state)

    // Navigate to login with return URL
    router.push('/login?return=/profile&migrate=true')
  }

  const handleContinueAsGuest = () => {
    // Mark that we showed the conversion prompt but user declined
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
          <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-purple-600 p-8 text-center text-white relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 -translate-y-20" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-24 translate-y-24" />
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Save Your Progress
              </h2>
              <p className="text-sky-100 text-sm">
                Create an account to keep your ratings and collections safe
              </p>
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

          {/* Content */}
          <div className="p-6">
            {/* Activity stats if any */}
            {activity.total > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {activity.ratings > 0 && (
                  <div className="text-center p-3 bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl">
                    <div className="text-2xl font-bold text-sky-700">{activity.ratings}</div>
                    <div className="text-xs text-sky-600">Rating{activity.ratings !== 1 ? 's' : ''}</div>
                  </div>
                )}
                {activity.library > 0 && (
                  <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <div className="text-2xl font-bold text-green-700">{activity.library}</div>
                    <div className="text-xs text-green-600">In Library</div>
                  </div>
                )}
                {activity.wishlist > 0 && (
                  <div className="text-center p-3 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
                    <div className="text-2xl font-bold text-pink-700">{activity.wishlist}</div>
                    <div className="text-xs text-pink-600">Wishlist</div>
                  </div>
                )}
              </div>
            )}

            {/* Benefits */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                  <DevicePhoneMobileIcon className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Sync across devices</div>
                  <div className="text-xs text-gray-500">Access your collection anywhere</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <ChartBarIcon className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Track your stats</div>
                  <div className="text-xs text-gray-500">See your gaming trends over time</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <TrophyIcon className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Create personal awards</div>
                  <div className="text-xs text-gray-500">Celebrate your gaming year</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleCreateAccount}
                variant="primary"
                size="lg"
                className="w-full"
              >
                Create Free Account
              </Button>

              <Button
                onClick={handleLogin}
                variant="secondary"
                size="md"
                className="w-full"
              >
                I Already Have an Account
              </Button>

              <button
                onClick={handleContinueAsGuest}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
              >
                Continue without saving
              </button>
            </div>

            {/* Note */}
            <p className="mt-4 text-center text-xs text-gray-400">
              Your progress will be saved when you sign up
            </p>
          </div>
        </div>
      </Overlay>
    </Portal>
  )
}
