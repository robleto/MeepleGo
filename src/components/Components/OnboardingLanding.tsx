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
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  StarIcon,
  BookOpenIcon,
  TrophyIcon,
  ChartBarIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'
import GameSearchSelect, { SuggestionGame } from './GameSearchSelect'
import GameOnboardingModal from './GameOnboardingModal'
import SaveProgressModal from './SaveProgressModal'
import { getOnboardingState, saveOnboardingState } from '@/lib/guestSession'
import { supabase } from '@/lib/supabase'
import ListCard from '@/components/Components/ListCard'
import type { GameListWithItems } from '@/types/supabase'

// Popular board game images for floating cards (verified working URLs)
const FLOATING_GAME_IMAGES = [
  'https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__itemrep/img/siPRXZkLWKVrOrYP7_cNPxTQlC0=/fit-in/246x300/filters:strip_icc()/pic2437871.jpg', // Pandemic
  'https://cf.geekdo-images.com/7SrPNGBKg9IIsP4UQpOi8g__itemrep/img/WXHcSQyTT_bWWMbZm_NMtj2Se4Y=/fit-in/246x300/filters:strip_icc()/pic4325841.jpg', // Wingspan
  'https://cf.geekdo-images.com/x3zxjr-Vw5iU4yDPg70Jgw__itemrep/img/-rSPJGO1YX9lL3y6VgMuoJhfCXg=/fit-in/246x300/filters:strip_icc()/pic3490053.jpg', // Ticket to Ride
  'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__itemrep/img/VblBgSuoZH75b0UEaQdH1Qze_p0=/fit-in/246x300/filters:strip_icc()/pic2419375.jpg', // Codenames
  'https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__itemrep/img/FS35ntPTVjJo0VgC5AmxBbB_kDo=/fit-in/246x300/filters:strip_icc()/pic2649952.jpg', // 7 Wonders Duel
  'https://cf.geekdo-images.com/ImPgGag98W6gpV1KV812aA__itemrep/img/SqDsbOFw2U8iZNjRYFKl7D-b5UY=/fit-in/246x300/filters:strip_icc()/pic1534148.jpg', // Azul
]

// Floating game card component for hero animation
function FloatingCard({
  imageSrc,
  delay = 0,
  size = 'md',
  floatDuration = 6,
  position,
}: {
  imageSrc: string
  delay?: number
  size?: 'sm' | 'md' | 'lg'
  floatDuration?: number
  position: { top?: string; bottom?: string; left?: string; right?: string }
}) {
  const sizeClasses = {
    sm: 'w-14 h-18 sm:w-16 sm:h-20',
    md: 'w-18 h-22 sm:w-20 sm:h-26',
    lg: 'w-22 h-28 sm:w-26 sm:h-34',
  }

  return (
    <div
      className={`absolute ${sizeClasses[size]} rounded-lg overflow-hidden shadow-xl ring-1 ring-black/5`}
      style={{
        ...position,
        opacity: 0.8,
        animation: `floatCard ${floatDuration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt=""
        className="w-full h-full object-cover"
        loading="eager"
      />
    </div>
  )
}

// Minimal feature item for the "What you can do" section (Airbnb-style)
function FeatureItem({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-gray-600" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
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
  const [bggLists, setBggLists] = useState<GameListWithItems[]>([])
  const [bggLoading, setBggLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const nextSectionRef = useRef<HTMLDivElement>(null)

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
    setTimeout(() => {
      const input = searchRef.current?.querySelector('input')
      input?.focus()
    }, 500)
  }

  const scrollToNext = () => {
    nextSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    let active = true
    const fetchBggLists = async () => {
      setBggLoading(true)
      try {
        const listTypes = [
          'bgg_trendingplays',
          'bgg_hotness',
          'bgg_mostplayed',
          'bgg_bestsellers',
        ]
        const { data, error } = await supabase
          .from('game_lists')
          .select(
            `
            *,
            game_list_items(
              *,
              game:games(*)
            )
          `
          )
          .in('list_type', listTypes)

        if (!error && data && active) {
          const order = new Map(listTypes.map((t, i) => [t, i]))
          const sorted = [...data].sort((a, b) => {
            const aIndex = order.get(a.list_type || '') ?? 99
            const bIndex = order.get(b.list_type || '') ?? 99
            return aIndex - bIndex
          })
          setBggLists(sorted as GameListWithItems[])
        }
      } finally {
        if (active) setBggLoading(false)
      }
    }
    fetchBggLists()
    return () => {
      active = false
    }
  }, [])

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
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes floatCard { 0%, 100% { transform: none; } }
          @keyframes fadeSlideUp { from, to { opacity: 1; transform: none; } }
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center justify-center bg-gradient-to-b from-sky-50 via-white to-white pt-8 pb-16">
        {/* Animated background gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-100/60 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl" />
        </div>

        {/* Floating game cards - decorative (outside overflow-hidden) */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          <FloatingCard
            imageSrc={FLOATING_GAME_IMAGES[0]}
            position={{ top: '18%', left: '6%' }}
            size="md"
            delay={0}
            floatDuration={7}
          />
          <FloatingCard
            imageSrc={FLOATING_GAME_IMAGES[1]}
            position={{ top: '22%', right: '8%' }}
            size="lg"
            delay={0.5}
            floatDuration={8}
          />
          <FloatingCard
            imageSrc={FLOATING_GAME_IMAGES[2]}
            position={{ bottom: '28%', left: '10%' }}
            size="sm"
            delay={1}
            floatDuration={6}
          />
          <FloatingCard
            imageSrc={FLOATING_GAME_IMAGES[3]}
            position={{ bottom: '22%', right: '6%' }}
            size="md"
            delay={1.5}
            floatDuration={7.5}
          />
          <FloatingCard
            imageSrc={FLOATING_GAME_IMAGES[4]}
            position={{ top: '50%', right: '14%' }}
            size="sm"
            delay={2}
            floatDuration={9}
          />
          <FloatingCard
            imageSrc={FLOATING_GAME_IMAGES[5]}
            position={{ top: '12%', left: '18%' }}
            size="sm"
            delay={2.5}
            floatDuration={8.5}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          {/* Headline - using display font */}
          <h1
            className="heading-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 tracking-tight leading-[1.08] opacity-0"
            style={{ animation: 'fadeSlideUp 0.5s ease-out 0.1s forwards' }}
          >
            Your Personal
            <span className="block bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
              Board Game Universe
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-base sm:text-lg text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed opacity-0"
            style={{ animation: 'fadeSlideUp 0.5s ease-out 0.2s forwards' }}
          >
            Track your collection, rate your experiences, and discover your next favorite game.
          </p>

          {/* Primary CTA - Find your first game */}
          <div
            ref={searchRef}
            className="max-w-md mx-auto mb-10 opacity-0"
            style={{ animation: 'fadeSlideUp 0.5s ease-out 0.3s forwards' }}
          >
            <GameSearchSelect
              onSelect={handleGameSelect}
              placeholder="Search for a board game..."
              autoFocus
              variant="landing"
              className="relative z-50"
            />
            <p className="mt-3 text-xs text-gray-400">
              Type to search thousands of games
            </p>
          </div>

          {/* Scroll indicator */}
          <button
            type="button"
            onClick={scrollToNext}
            className="inline-flex flex-col items-center gap-1 text-gray-400 hover:text-gray-500 transition opacity-0"
            style={{ animation: 'fadeSlideUp 0.5s ease-out 0.5s forwards' }}
          >
            <span className="text-xs tracking-wide">Explore</span>
            <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </section>

      {/* BGG Lists Section */}
      <section ref={nextSectionRef} className="py-12 px-6 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h2 className="heading-display text-xl sm:text-2xl font-semibold text-gray-900">
              Explore popular collections
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Curated lists from BoardGameGeek
            </p>
          </div>
          <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
            <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
              {(bggLoading ? Array.from({ length: 4 }) : bggLists).map((list, index) => (
                <div key={(list as GameListWithItems)?.id || `bgg-skel-${index}`} className="flex-shrink-0 w-64">
                  {list ? (
                    <ListCard list={list as GameListWithItems} isPublic />
                  ) : (
                    <div className="h-44 rounded-2xl bg-gray-100 animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Airbnb-style minimal */}
      <section className="py-16 px-6 bg-gray-50/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="heading-display text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">
              Everything you need for your hobby
            </h2>
            <p className="text-base text-gray-500 max-w-lg mx-auto">
              MeepleGo helps you get more out of every game night.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <FeatureItem
              icon={MagnifyingGlassIcon}
              title="Discover games"
              description="Search thousands of board games. See ratings, player counts, and details at a glance."
            />
            <FeatureItem
              icon={StarIcon}
              title="Rate and rank"
              description="Give games a 1-10 rating. Build your personal rankings and track how your taste evolves."
            />
            <FeatureItem
              icon={BookOpenIcon}
              title="Track your collection"
              description="Add games to your library and wishlist. Always know what you own and what you want."
            />
            <FeatureItem
              icon={TrophyIcon}
              title="Create awards"
              description="Celebrate your year in gaming with personal awards. Auto-generated or custom categories."
            />
            <FeatureItem
              icon={ListBulletIcon}
              title="Build lists"
              description="Organize games into custom lists. Best 2-player, party favorites, or any theme you like."
            />
            <FeatureItem
              icon={ChartBarIcon}
              title="See your stats"
              description="Log plays and discover patterns. Your gaming journey, beautifully visualized."
            />
          </div>
        </div>
      </section>

      {/* How it Works - Simple steps */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="heading-display text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">
              Get started in seconds
            </h2>
            <p className="text-base text-gray-500">
              No account needed to explore
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 sm:gap-4 justify-center">
            {[
              { step: '1', title: 'Search', description: 'Find any board game' },
              { step: '2', title: 'Interact', description: 'Rate, own, or wishlist it' },
              { step: '3', title: 'Save', description: 'Create an account anytime' },
            ].map((item, i) => (
              <div key={item.step} className="flex-1 text-center max-w-[200px] mx-auto">
                <div className="w-10 h-10 rounded-full bg-gray-900 text-white text-sm font-semibold flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <button
              onClick={scrollToSearch}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-full shadow-sm hover:bg-gray-800 transition"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              Start searching
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
