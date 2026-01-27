/**
 * OnboardingLanding - Animated landing page for new users
 * Features:
 * - Graphical hero with subtle animations (parallax, shimmer, floating cards)
 * - Single primary CTA: "Find your first game" search
 * - Onboarding content previously in modals now inline
 * - Funnels users into adding their first game
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  StarIcon,
  BookOpenIcon,
  TrophyIcon,
  SparklesIcon,
  ChartBarIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'
import GameSearchSelect, { SuggestionGame } from './GameSearchSelect'
import GameOnboardingModal from './GameOnboardingModal'
import SaveProgressModal from './SaveProgressModal'
import { Logo } from '@/components/Foundations/Logo'
import { getOnboardingState, saveOnboardingState, hasGuestData } from '@/lib/guestSession'
import { supabase } from '@/lib/supabase'

// Floating game card component for hero animation
function FloatingCard({
  imageSrc,
  delay = 0,
  size = 'md',
  position,
}: {
  imageSrc: string
  delay?: number
  size?: 'sm' | 'md' | 'lg'
  position: { top?: string; bottom?: string; left?: string; right?: string }
}) {
  const sizeClasses = {
    sm: 'w-16 h-20 sm:w-20 sm:h-24',
    md: 'w-20 h-24 sm:w-24 sm:h-32',
    lg: 'w-24 h-32 sm:w-32 sm:h-40',
  }

  return (
    <div
      className={`absolute ${sizeClasses[size]} rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/20 opacity-0`}
      style={{
        ...position,
        animation: `floatCard 6s ease-in-out infinite, fadeInCard 0.8s ease-out ${delay}s forwards`,
      }}
    >
      <Image
        src={imageSrc}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 640px) 80px, 128px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  )
}

// Feature card for the "What you can do" section
function FeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  delay?: number
}) {
  return (
    <div
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 opacity-0"
      style={{
        animation: `fadeSlideUp 0.6s ease-out ${delay}s forwards`,
      }}
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center mb-4 shadow-lg">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

export interface OnboardingLandingProps {
  /** Called when user completes the onboarding flow */
  onComplete?: () => void
}

export default function OnboardingLanding({ onComplete }: OnboardingLandingProps) {
  const router = useRouter()
  const [selectedGame, setSelectedGame] = useState<SuggestionGame | null>(null)
  const [showGameModal, setShowGameModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    // Mark that user has seen the landing page
    const state = getOnboardingState()
    if (!state.welcomed) {
      state.welcomed = true
      saveOnboardingState(state)
    }
  }, [])

  const handleGameSelect = (game: SuggestionGame) => {
    setSelectedGame(game)
    setShowGameModal(true)
  }

  const handleGameModalComplete = async () => {
    setShowGameModal(false)

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      // User is logged in, go straight to profile
      router.push('/profile')
      onComplete?.()
    } else {
      // User is not logged in, show save progress modal
      setShowSaveModal(true)
    }
  }

  const handleSaveModalClose = () => {
    setShowSaveModal(false)
    // User chose to continue without saving, still complete
    onComplete?.()
  }

  const handleAuthSuccess = () => {
    setShowSaveModal(false)
    router.push('/profile')
    onComplete?.()
  }

  const scrollToSearch = () => {
    searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Focus the search input after scroll
    setTimeout(() => {
      const input = searchRef.current?.querySelector('input')
      input?.focus()
    }, 500)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Custom keyframes */}
      <style jsx global>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes fadeInCard {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 0.9; transform: scale(1) translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(56, 189, 248, 0.3); }
          50% { box-shadow: 0 0 40px rgba(56, 189, 248, 0.5); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes floatCard { 0%, 100% { transform: none; } }
          @keyframes fadeInCard { from, to { opacity: 0.9; transform: none; } }
          @keyframes fadeSlideUp { from, to { opacity: 1; transform: none; } }
          @keyframes shimmer { 0%, 100% { background-position: center; } }
          @keyframes pulse-glow { 0%, 100% { box-shadow: none; } }
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-sky-50 via-white to-gray-50">
        {/* Animated background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-200/50 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" style={{ animation: 'pulse 4s ease-in-out infinite 1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-sky-100/40 to-purple-100/40 rounded-full blur-3xl" />
        </div>

        {/* Floating game cards - decorative */}
        <div className="absolute inset-0 pointer-events-none hidden md:block">
          <FloatingCard
            imageSrc="https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__thumb/img/veqFeP4d_3zNhOrWfQjE8G0GPXU=/fit-in/200x150/filters:strip_icc()/pic2437871.jpg"
            position={{ top: '15%', left: '8%' }}
            size="md"
            delay={0.2}
          />
          <FloatingCard
            imageSrc="https://cf.geekdo-images.com/7SrPNGBKg9IIsP4UQpOi8g__thumb/img/GKueTbkCk2Ramf6ai8mDj-BP6cI=/fit-in/200x150/filters:strip_icc()/pic4325841.jpg"
            position={{ top: '25%', right: '10%' }}
            size="lg"
            delay={0.4}
          />
          <FloatingCard
            imageSrc="https://cf.geekdo-images.com/x3zxjr-Vw5iU4yDPg70Jgw__thumb/img/-WqaprhlX1PxbLU2rJNiYw67xzQ=/fit-in/200x150/filters:strip_icc()/pic3490053.jpg"
            position={{ bottom: '20%', left: '12%' }}
            size="sm"
            delay={0.6}
          />
          <FloatingCard
            imageSrc="https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__thumb/img/bL4T_dn2FFQL0qknSeA0VFuSxyM=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg"
            position={{ bottom: '25%', right: '8%' }}
            size="md"
            delay={0.8}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Logo */}
          <div
            className="mb-8 flex justify-center opacity-0"
            style={{ animation: 'fadeSlideUp 0.6s ease-out 0s forwards' }}
          >
            <Logo size="xl" />
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight opacity-0"
            style={{ animation: 'fadeSlideUp 0.6s ease-out 0.1s forwards' }}
          >
            Your Personal
            <span className="block bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
              Board Game Universe
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed opacity-0"
            style={{ animation: 'fadeSlideUp 0.6s ease-out 0.2s forwards' }}
          >
            Track your collection, rate your experiences, and discover your next favorite game.
            Start by finding a game you love.
          </p>

          {/* Primary CTA - Find your first game */}
          <div
            ref={searchRef}
            className="max-w-xl mx-auto mb-12 opacity-0"
            style={{ animation: 'fadeSlideUp 0.6s ease-out 0.3s forwards' }}
          >
            <div
              className="relative rounded-2xl p-1"
              style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}
            >
              <GameSearchSelect
                onSelect={handleGameSelect}
                placeholder="Find your first game..."
                variant="hero"
                autoFocus
              />
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Search for any board game to get started
            </p>
          </div>

          {/* Scroll indicator */}
          <div
            className="flex flex-col items-center gap-2 text-gray-400 opacity-0"
            style={{ animation: 'fadeSlideUp 0.6s ease-out 0.5s forwards' }}
          >
            <span className="text-xs uppercase tracking-wider">Learn more</span>
            <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section - Content from onboarding modal */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 opacity-0"
              style={{ animation: 'fadeSlideUp 0.6s ease-out 0.1s forwards' }}
            >
              Everything you need to
              <span className="block text-sky-600">enjoy your hobby</span>
            </h2>
            <p
              className="text-lg text-gray-600 max-w-2xl mx-auto opacity-0"
              style={{ animation: 'fadeSlideUp 0.6s ease-out 0.2s forwards' }}
            >
              MeepleGo helps you get more out of every game night. No account needed to start exploring.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={MagnifyingGlassIcon}
              title="Discover Games"
              description="Search thousands of board games. See ratings, awards, and details. Find your next favorite game."
              delay={0.1}
            />
            <FeatureCard
              icon={StarIcon}
              title="Rate & Rank"
              description="Give games a 1-10 rating after playing. Build your personal rankings and see your taste evolve."
              delay={0.2}
            />
            <FeatureCard
              icon={BookOpenIcon}
              title="Track Your Collection"
              description="Add games to your library and wishlist. Know what you own and what you want."
              delay={0.3}
            />
            <FeatureCard
              icon={TrophyIcon}
              title="Create Awards"
              description="Celebrate your year in gaming with personal awards. Auto-generated or design your own."
              delay={0.4}
            />
            <FeatureCard
              icon={ListBulletIcon}
              title="Build Lists"
              description="Organize games into custom lists. Best 2-player games, party favorites, or any theme you like."
              delay={0.5}
            />
            <FeatureCard
              icon={ChartBarIcon}
              title="Track Your Stats"
              description="Log your plays and see patterns. Your gaming journey, visualized."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Get started in seconds
            </h2>
            <p className="text-lg text-gray-600">
              No account required. Just search, rate, and track.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Find a game',
                description: 'Search for any board game you\'ve played or want to play.',
              },
              {
                step: '2',
                title: 'Mark & rate it',
                description: 'Add it to your library, wishlist, or give it a rating.',
              },
              {
                step: '3',
                title: 'Save your progress',
                description: 'Create an account anytime to save across devices.',
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="text-center opacity-0"
                style={{ animation: `fadeSlideUp 0.6s ease-out ${0.1 + i * 0.15}s forwards` }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <button
              onClick={scrollToSearch}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-sky-600 text-white text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              Find Your First Game
            </button>
          </div>
        </div>
      </section>

      {/* Game Onboarding Modal */}
      {selectedGame && (
        <GameOnboardingModal
          game={selectedGame}
          open={showGameModal}
          onClose={() => setShowGameModal(false)}
          onComplete={handleGameModalComplete}
        />
      )}

      {/* Save Progress Modal */}
      <SaveProgressModal
        visible={showSaveModal}
        onClose={handleSaveModalClose}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}
