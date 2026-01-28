/**
 * OnboardingLanding - Animated landing page for new users
 * Features:
 * - Graphical hero with subtle animations (parallax, shimmer, floating cards)
 * - Single primary CTA: "Find your first game" search
 * - Onboarding content previously in modals now inline
 * - Funnels users into adding their first game
 */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  StarIcon,
  BookOpenIcon,
  TrophyIcon,
  ChartBarIcon,
  ListBulletIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import GameSearchSelect, { SuggestionGame } from './GameSearchSelect'
import GameOnboardingModal from './GameOnboardingModal'
import SaveProgressModal from './SaveProgressModal'
import { getOnboardingState, saveOnboardingState } from '@/lib/guestSession'
import { supabase } from '@/lib/supabase'
import ListCard from '@/components/Components/ListCard'
import type { GameListWithItems } from '@/types/supabase'

// 12 floating card positions spread across the hero
const FLOATING_CARD_POSITIONS = [
  // Left side - distributed across full height
  { position: { top: '5%', left: '3%' }, baseDelay: 0 },
  { position: { top: '20%', left: '5%' }, baseDelay: 1.5 },
  { position: { top: '35%', left: '2%' }, baseDelay: 0.8 },
  { position: { top: '50%', left: '6%' }, baseDelay: 2.2 },
  { position: { top: '65%', left: '4%' }, baseDelay: 1.0 },
  { position: { top: '80%', left: '3%' }, baseDelay: 2.5 },
  // Right side - distributed across full height
  { position: { top: '10%', right: '4%' }, baseDelay: 0.5 },
  { position: { top: '25%', right: '2%' }, baseDelay: 1.8 },
  { position: { top: '40%', right: '5%' }, baseDelay: 1.2 },
  { position: { top: '55%', right: '3%' }, baseDelay: 0.3 },
  { position: { top: '70%', right: '6%' }, baseDelay: 0.7 },
  { position: { top: '85%', right: '4%' }, baseDelay: 1.4 },
]

interface FloatingCardData {
  id: string
  imageSrc: string
  position: { top?: string; bottom?: string; left?: string; right?: string }
  floatDuration: number
  floatDelay: number
  visible: boolean
  entering: boolean
}

// Floating game card component with natural aspect ratio
function FloatingCard({
  imageSrc,
  visible,
  entering,
  floatDuration,
  floatDelay,
  position,
}: {
  imageSrc: string
  visible: boolean
  entering: boolean
  floatDuration: number
  floatDelay: number
  position: { top?: string; bottom?: string; left?: string; right?: string }
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)

  // Calculate size based on natural aspect ratio
  const getCardStyle = () => {
    const baseWidth = 150 // pixels
    const maxHeight = 210 // pixels

    if (aspectRatio) {
      const height = Math.min(baseWidth / aspectRatio, maxHeight)
      const width = height * aspectRatio
      return {
        width: `${width}px`,
        height: `${height}px`,
      }
    }
    // Default before image loads
    return {
      width: '132px',
      height: '180px',
    }
  }

  // Add negative margin to make cards bleed off edges
  const getBleedStyle = () => {
    if (position.left) {
      return { marginLeft: '-50px' }
    }
    if (position.right) {
      return { marginRight: '-50px' }
    }
    return {}
  }

  return (
    <div
      className={`absolute rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/30 transition-all duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible && imageLoaded
          ? entering
            ? 'opacity-0 scale-90 translate-y-4'
            : 'opacity-90 scale-100 translate-y-0'
          : 'opacity-0 scale-75 translate-y-6'
      }`}
      style={{
        ...position,
        ...getCardStyle(),
        ...getBleedStyle(),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt=""
        className="object-cover w-full h-full"
        loading="eager"
        onLoad={(e) => {
          const img = e.currentTarget
          if (img.naturalWidth && img.naturalHeight) {
            setAspectRatio(img.naturalWidth / img.naturalHeight)
          }
          setImageLoaded(true)
        }}
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
    <div className="flex items-start gap-4">
      <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full">
        <Icon className="w-5 h-5 text-gray-600" />
      </div>
      <div>
        <h3 className="mb-1 text-base font-medium text-gray-900 heading-display">{title}</h3>
        <p className="text-sm leading-relaxed text-gray-500">{description}</p>
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
  const [availableImages, setAvailableImages] = useState<string[]>([])
  const [floatingCards, setFloatingCards] = useState<FloatingCardData[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const nextSectionRef = useRef<HTMLDivElement>(null)
  const cardTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

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

  // Hydrate floating images from database
  useEffect(() => {
    let active = true

    const hydrateFloatingImages = async () => {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('image_url, thumbnail_url, num_ratings')
          .or('image_url.not.is.null,thumbnail_url.not.is.null')
          .order('num_ratings', { ascending: false })
          .limit(60)

        if (!active) return

        if (!error && data && data.length) {
          const urls = data
            .map((row) => row.image_url || row.thumbnail_url)
            .filter((src): src is string => !!src)
          const unique = Array.from(new Set(urls))
          setAvailableImages(unique)
        } else {
          setAvailableImages([])
        }
      } catch {
        if (active) setAvailableImages([])
      }
    }

    hydrateFloatingImages()
    return () => {
      active = false
    }
  }, [])

  // Get a random image that's not currently in use
  const getRandomImage = useCallback((excludeIds: Set<string>) => {
    const available = availableImages.filter(img => !excludeIds.has(img))
    if (available.length === 0) return availableImages[Math.floor(Math.random() * availableImages.length)]
    return available[Math.floor(Math.random() * available.length)]
  }, [availableImages])

  // Schedule a card to fade out and be replaced
  const scheduleCardRotation = useCallback((cardId: string) => {
    // Random duration between 15-25 seconds (slowed down for a calmer feel)
    const duration = 15000 + Math.random() * 10000

    const timer = setTimeout(() => {
      setFloatingCards(prev => {
        const card = prev.find(c => c.id === cardId)
        if (!card) return prev

        // Start fade out
        return prev.map(c =>
          c.id === cardId ? { ...c, visible: false } : c
        )
      })

      // After fade out, swap image and fade back in
      setTimeout(() => {
        setFloatingCards(prev => {
          const currentImages = new Set(prev.map(c => c.imageSrc))
          const newImage = getRandomImage(currentImages)

          return prev.map(c =>
            c.id === cardId
              ? { ...c, imageSrc: newImage, visible: true, entering: true }
              : c
          )
        })

        // Remove entering state after animation
        setTimeout(() => {
          setFloatingCards(prev =>
            prev.map(c => c.id === cardId ? { ...c, entering: false } : c)
          )
          // Schedule next rotation
          scheduleCardRotation(cardId)
        }, 100)
      }, 1500)
    }, duration)

    cardTimersRef.current.set(cardId, timer)
  }, [getRandomImage])

  // Initialize floating cards when images are available
  useEffect(() => {
    if (availableImages.length < FLOATING_CARD_POSITIONS.length) return

    // Clear any existing timers
    cardTimersRef.current.forEach(timer => clearTimeout(timer))
    cardTimersRef.current.clear()

    // Shuffle and pick initial images
    const shuffled = [...availableImages].sort(() => 0.5 - Math.random())

    // Create initial cards with staggered entrance
    const initialCards: FloatingCardData[] = FLOATING_CARD_POSITIONS.map((pos, index) => ({
      id: `card-${index}`,
      imageSrc: shuffled[index],
      position: pos.position,
      floatDuration: 5 + Math.random() * 4, // 5-9 seconds
      floatDelay: pos.baseDelay,
      visible: false,
      entering: true,
    }))

    setFloatingCards(initialCards)

    // Stagger entrance animations
    initialCards.forEach((card, index) => {
      setTimeout(() => {
        setFloatingCards(prev =>
          prev.map(c => c.id === card.id ? { ...c, visible: true } : c)
        )

        // Remove entering state after entrance animation
        setTimeout(() => {
          setFloatingCards(prev =>
            prev.map(c => c.id === card.id ? { ...c, entering: false } : c)
          )
          // Start rotation cycle for this card
          scheduleCardRotation(card.id)
        }, 1600)
      }, index * 200 + card.floatDelay * 1000)
    })

    return () => {
      cardTimersRef.current.forEach(timer => clearTimeout(timer))
      cardTimersRef.current.clear()
    }
  }, [availableImages, scheduleCardRotation])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600" />
      </div>
    )
  }

  return (
    <div className="relative -mt-16">
      {/* Custom keyframes */}
      <style jsx global>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0) rotate(-0.5deg); }
          50% { transform: translateY(-12px) rotate(0.5deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes morphGradient {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          25% {
            transform: translate(10%, 5%) scale(1.1);
            opacity: 0.5;
          }
          50% {
            transform: translate(-5%, 10%) scale(0.95);
            opacity: 0.35;
          }
          75% {
            transform: translate(-10%, -5%) scale(1.05);
            opacity: 0.45;
          }
        }
        @keyframes morphGradient2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          33% {
            transform: translate(-15%, 10%) scale(1.15);
            opacity: 0.4;
          }
          66% {
            transform: translate(10%, -5%) scale(0.9);
            opacity: 0.25;
          }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
        @keyframes bounce-arrow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        @keyframes morphGradient3 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.25;
          }
          33% {
            transform: translate(20%, -10%) scale(1.2) rotate(5deg);
            opacity: 0.35;
          }
          66% {
            transform: translate(-15%, 15%) scale(0.85) rotate(-5deg);
            opacity: 0.2;
          }
        }
        @keyframes colorShift {
          0%, 100% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(30deg); }
        }
        @keyframes float-orb {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-15px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes floatCard { 0%, 100% { transform: none; } }
          @keyframes fadeSlideUp { from, to { opacity: 1; transform: none; } }
          @keyframes morphGradient { 0%, 100% { transform: none; opacity: 0.4; } }
          @keyframes morphGradient2 { 0%, 100% { transform: none; opacity: 0.3; } }
          @keyframes morphGradient3 { 0%, 100% { transform: none; opacity: 0.25; } }
          @keyframes shimmer { 0%, 100% { background-position: 0 0; } }
          @keyframes pulse-slow { 0%, 100% { opacity: 0.2; } }
          @keyframes bounce-arrow { 0%, 100% { transform: none; } }
          @keyframes colorShift { 0%, 100% { filter: none; } }
          @keyframes float-orb { 0%, 100% { transform: none; } }
        }
      `}</style>

      {/* Hero Section - Full viewport */}
      <section className="relative flex flex-col items-center justify-center min-h-screen pb-20 bg-gradient-to-b from-primary-700 via-primary-800 to-slate-950 overflow-hidden">
        {/* Animated morphing gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large morphing blob top-right */}
          <div
            className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-sky-400/40 to-cyan-500/30 rounded-full blur-3xl"
            style={{ animation: 'morphGradient 20s ease-in-out infinite' }}
          />
          {/* Medium morphing blob bottom-left */}
          <div
            className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/30 to-purple-600/20 rounded-full blur-3xl"
            style={{ animation: 'morphGradient2 25s ease-in-out infinite' }}
          />
          {/* Smaller accent blob center-left */}
          <div
            className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-gradient-to-r from-violet-500/20 to-fuchsia-500/15 rounded-full blur-3xl"
            style={{ 
              animation: 'morphGradient 18s ease-in-out infinite',
              animationDirection: 'reverse'
            }}
          />
          {/* Additional color-shifting blob top-center */}
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-gradient-to-br from-teal-400/25 to-emerald-500/20 rounded-full blur-3xl"
            style={{ 
              animation: 'morphGradient3 22s ease-in-out infinite',
            }}
          />
          {/* Small floating orbs for depth */}
          <div
            className="absolute top-[20%] left-[15%] w-24 h-24 bg-gradient-to-br from-sky-300/30 to-blue-400/20 rounded-full blur-2xl"
            style={{ 
              animation: 'float-orb 12s ease-in-out infinite'
            }}
          />
          <div
            className="absolute top-[60%] right-[20%] w-32 h-32 bg-gradient-to-br from-purple-400/25 to-pink-400/20 rounded-full blur-2xl"
            style={{ 
              animation: 'float-orb 15s ease-in-out infinite',
              animationDelay: '3s'
            }}
          />
          <div
            className="absolute top-[40%] right-[10%] w-20 h-20 bg-gradient-to-br from-cyan-300/30 to-teal-400/20 rounded-full blur-xl"
            style={{ 
              animation: 'float-orb 10s ease-in-out infinite',
              animationDelay: '1.5s'
            }}
          />
          {/* Subtle shimmer overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 8s linear infinite',
            }}
          />
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)`,
              backgroundSize: '40px 40px',
              animation: 'pulse-slow 4s ease-in-out infinite',
            }}
          />
        </div>

        {/* Floating game cards - decorative */}
        {floatingCards.length > 0 && (
          <div className="absolute inset-0 hidden pointer-events-none lg:block">
            {floatingCards.map((card) => (
              <FloatingCard
                key={card.id}
                imageSrc={card.imageSrc}
                visible={card.visible}
                entering={card.entering}
                position={card.position}
                floatDuration={card.floatDuration}
                floatDelay={card.floatDelay}
              />
            ))}
          </div>
        )}

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col justify-center flex-1 max-w-3xl px-6 mx-auto text-center">
          {/* Headline - using display font */}
          <h1
            className="heading-display text-4xl sm:text-5xl lg:text-6xl font-medium text-white mb-5 tracking-tight leading-[1.08] opacity-0"
            style={{ 
              animation: 'fadeSlideUp 0.5s ease-out',
              animationDelay: '0.1s',
              animationFillMode: 'forwards'
            }}
          >
            Your Personal
            <span className="block text-transparent bg-gradient-to-r from-white to-sky-200 bg-clip-text">
              Board Game Universe
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="max-w-xl mx-auto mb-8 text-base leading-relaxed opacity-0 sm:text-lg text-sky-100/90"
            style={{ 
              animation: 'fadeSlideUp 0.5s ease-out',
              animationDelay: '0.2s',
              animationFillMode: 'forwards'
            }}
          >
            Track your collection, rate your experiences, and discover your next favorite game.
          </p>

          {/* Primary CTA - Find your first game */}
          <div
            ref={searchRef}
            className="max-w-3xl mx-auto mb-10 opacity-0"
            style={{ 
              animation: 'fadeSlideUp 0.5s ease-out',
              animationDelay: '0.3s',
              animationFillMode: 'forwards'
            }}
          >
            <GameSearchSelect
              onSelect={handleGameSelect}
              placeholder="Search for a board game..."
              autoFocus
              variant="landing"
              className="relative z-50"
            />
            <p className="mt-3 text-xs text-sky-200/80">
              Type to search thousands of games
            </p>
          </div>
        </div>

        {/* Scroll indicator at bottom */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-8 opacity-0"
          style={{ 
            animation: 'fadeSlideUp 0.5s ease-out',
            animationDelay: '0.6s',
            animationFillMode: 'forwards'
          }}
        >
          <button
            type="button"
            onClick={scrollToNext}
            className="flex flex-col items-center gap-2 transition-colors text-white/70 hover:text-white/90 group"
            aria-label="Scroll to explore"
          >
            <span className="text-xs font-medium tracking-wide uppercase text-center">Explore</span>
            <ChevronDownIcon
              className="w-5 h-5"
              style={{ animation: 'bounce-arrow 2s ease-in-out infinite' }}
            />
          </button>
        </div>
      </section>

      {/* Features Section - Airbnb-style minimal */}
      <section className="px-6 py-16 bg-gray-50/50">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-medium text-gray-900 heading-display sm:text-3xl">
              Everything you need for your hobby
            </h2>
            <p className="max-w-lg mx-auto text-base text-gray-500">
              Rank, award, and reflect on the board games that matter most to you.
            </p>
          </div>

          <div className="grid max-w-3xl gap-8 mx-auto sm:grid-cols-2">
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
              description="Celebrate your gaming experience with personal awards. Auto-generated or custom categories."
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
      <section className="px-6 py-16 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-medium text-gray-900 heading-display sm:text-3xl">
              Get started in seconds
            </h2>
            <p className="text-base text-gray-500">
              No account needed to explore
            </p>
          </div>

          <div className="flex flex-col justify-center gap-8 sm:flex-row sm:gap-4">
            {[
              { step: '1', title: 'Search', description: 'Find any board game' },
              { step: '2', title: 'Interact', description: 'Rate, own, or wishlist it' },
              { step: '3', title: 'Save', description: 'Create an account anytime' },
            ].map((item, i) => (
              <div key={item.step} className="flex-1 text-center max-w-[200px] mx-auto">
                <div className="flex items-center justify-center w-10 h-10 mx-auto mb-3 text-sm font-semibold text-white bg-gray-900 rounded-full">
                  {item.step}
                </div>
                <h3 className="mb-1 text-base font-medium text-gray-900 heading-display">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <button
              onClick={scrollToSearch}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition bg-gray-900 rounded-full shadow-sm hover:bg-gray-800"
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
