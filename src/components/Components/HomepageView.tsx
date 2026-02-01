'use client'
import Link from 'next/link'
import GameCard from '@/components/Components/GameCard'
import Heading from '@/components/Components/Heading'
import { AwardCard } from '@/components/Components/AwardCard'
import ListCard from '@/components/Components/ListCard'
import StatCard from '@/components/Elements/StatCard'
import NetflixScrollSection from '@/components/Elements/NetflixScrollSection'
import ZeroState from '@/components/Components/ZeroState'
import DiscoveryCard from './DiscoveryCard'
import {
  TrophyIcon,
  CubeIcon,
  ListBulletIcon,
  StarIcon,
  PlayIcon,
  BookmarkIcon,
  UserIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import type { Game } from '@/types/supabase'
import type {
  MostAwardedGame,
  HighestRankedGame,
  SleeperHitGame,
  HotTakeGame,
  ComebackGame,
} from '@/types'
import type { UserPhaseResult } from '@/lib/userPhase'

export interface UserStats {
  totalPlays: number
  uniqueGames: number
  gamesOwned: number
  avgRating: number | null
  ratingsTimeline: Array<{ date: string; avgRating: number; count: number }>
  recentTags: Array<{ tag: string; count: number }>
  listsCreated: number
  awardsCreated: number
}

export interface HomepageViewProps {
  user: { id: string } | null
  loading: boolean
  featuredGames: Game[]
  userStats: UserStats | null
  industryAwards?: Array<{
    id: string
    name: string
    year: number
    winner_game_name?: string | null
    winner_game_id?: string | null
  }>
  publicLists?: Array<{
    id: string
    name: string
    description?: string | null
    games_count?: number
    updated_at?: string
  }>
  discoveryLists?: {
    mostAwarded: MostAwardedGame[]
    highestRanked: HighestRankedGame[]
    sleeperHits: SleeperHitGame[]
    hotTakes: HotTakeGame[]
    comebackGames: ComebackGame[]
  }
  discoveryLoading?: boolean
  phaseResult?: UserPhaseResult | null
  foundationalGames?: any[]
}

// ── Quick Action definitions ──

interface QuickAction {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  color: string
}

const PHASE_1_ACTIONS: QuickAction[] = [
  {
    label: 'Rate a Game',
    href: '/rankings',
    icon: StarIcon,
    description: 'Score your favorites',
    color: 'bg-yellow-500',
  },
  {
    label: 'Browse Games',
    href: '/games',
    icon: MagnifyingGlassIcon,
    description: 'Explore the catalog',
    color: 'bg-green-500',
  },
  {
    label: 'Log a Play',
    href: '/plays/new',
    icon: PlayIcon,
    description: 'Record a session',
    color: 'bg-blue-500',
  },
  {
    label: 'Build a List',
    href: '/lists',
    icon: ListBulletIcon,
    description: 'Curate a collection',
    color: 'bg-purple-500',
  },
]

const PHASE_2_ACTIONS: QuickAction[] = [
  {
    label: 'Log a Play',
    href: '/plays/new',
    icon: PlayIcon,
    description: 'Record a session',
    color: 'bg-blue-500',
  },
  {
    label: 'Rate a Game',
    href: '/rankings',
    icon: StarIcon,
    description: 'Score your favorites',
    color: 'bg-yellow-500',
  },
  {
    label: 'Create a List',
    href: '/lists',
    icon: ListBulletIcon,
    description: 'Curate a collection',
    color: 'bg-purple-500',
  },
  {
    label: 'View Profile',
    href: '/profile',
    icon: UserIcon,
    description: 'See your stats',
    color: 'bg-gray-600',
  },
]

// ── Section explainer copy ──

const EXPLAINERS: Record<string, string> = {
  'highest-ranked': 'Your personal top picks, based on the ratings you\'ve given.',
  'hot-takes': 'These are games where your rating differs most from the community average.',
  'sleeper-hits': 'These are games you rated highly that most people haven\'t discovered yet.',
  'comeback-games': 'We tracked which games show up in your play logs month after month. These are your reliable favorites.',
  'most-awarded': 'These games have collected the most honors across your personal awards.',
}

// ── Component ──

export function HomepageView({
  user,
  loading,
  featuredGames,
  userStats,
  industryAwards = [],
  publicLists = [],
  discoveryLists = {
    mostAwarded: [],
    highestRanked: [],
    sleeperHits: [],
    hotTakes: [],
    comebackGames: [],
  },
  discoveryLoading = false,
  phaseResult,
  foundationalGames = [],
}: HomepageViewProps) {
  // ── Guest experience (unchanged — OnboardingLanding handles the main logged-out view) ──
  if (!user) {
    return (
      <div className="space-y-12" id="games-section">
        <section className="space-y-2">
          <ZeroState
            title="Track your board game life"
            description="Organize your collection, rate what you play, and celebrate your favorites. Join to unlock your personal stats."
            action={{ label: 'Sign up to get started', href: '/signup' }}
          />
        </section>

        {/* Trending Games */}
        <section className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-4">
              <Heading as="h2" size="md" className="text-gray-900">
                Trending Games
              </Heading>
              <Link
                href="/games"
                className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
              >
                View all →
              </Link>
            </div>
            <p className="mt-0.5 text-sm sm:text-base text-gray-600">
              Discover what's popular in the board game community
            </p>
          </div>
          {loading ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-48 h-64 bg-gray-200 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : (
            <div className="-mx-4 sm:-mx-6 lg:-mx-8">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 sm:px-6 lg:px-8">
                {featuredGames.map((game) => (
                  <div key={game.id} className="flex-shrink-0 w-48">
                    <GameCard
                      game={game as any}
                      viewMode="grid"
                      variant="balanced"
                      imageFit="contain"
                      className="h-full flex flex-col"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Industry Awards */}
        {industryAwards.length > 0 && (
          <section className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-4">
                <Heading as="h2" size="md" className="text-gray-900">
                  Industry Awards
                </Heading>
                <Link
                  href="/awards"
                  className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
                >
                  Explore all →
                </Link>
              </div>
              <p className="mt-0.5 text-sm sm:text-base text-gray-600">
                Prestigious board game honors and recognition
              </p>
            </div>
            <NetflixScrollSection itemWidth="w-72" showCount={4}>
              {industryAwards.map((award: any) => (
                <AwardCard
                  key={award.id}
                  href={`/awards#${award.id}`}
                  title={award.name}
                  description={
                    award.description || 'Prestigious board game recognition'
                  }
                  yearSpan={undefined}
                  winners={undefined as any}
                  nominees={undefined as any}
                  circleBorderClass={award.borderColor || 'border-amber-200'}
                  circleBgClass={award.backgroundColor || 'bg-amber-50'}
                  iconColorClass={award.iconColor || 'text-amber-600'}
                  showStats={false}
                  cta="View Details"
                />
              ))}
            </NetflixScrollSection>
          </section>
        )}

        {/* Public Lists */}
        {publicLists.length > 0 && (
          <section className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-4">
                <Heading as="h2" size="md" className="text-gray-900">
                  Community Lists
                </Heading>
                <Link
                  href="/lists"
                  className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
                >
                  Browse lists →
                </Link>
              </div>
              <p className="mt-0.5 text-sm sm:text-base text-gray-600">
                Collections curated by fellow players
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicLists.slice(0, 3).map((list) => (
                <ListCard key={list.id} list={list as any} isPublic={true} />
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  // ── Authenticated experience with progressive unlocking ──

  const phase = phaseResult?.phase ?? 1
  const quickActions = phase >= 2 ? PHASE_2_ACTIONS : PHASE_1_ACTIONS

  // Determine welcome heading
  let welcomeHeading = 'Welcome to MeepleGo'
  if (phase >= 2) {
    welcomeHeading = 'Today for You'
  } else if (phaseResult && phaseResult.accountAgeDays > 3) {
    welcomeHeading = 'Good to see you'
  }

  // Collect stat cards that have non-zero values
  const statCards: Array<{
    iconBg: string
    Icon: React.ComponentType<{ className?: string }>
    iconColor: string
    value: string | number
    label: string
  }> = []

  if (userStats) {
    if (userStats.uniqueGames > 0)
      statCards.push({
        iconBg: 'bg-green-500',
        Icon: CubeIcon,
        iconColor: 'text-white',
        value: userStats.uniqueGames,
        label: 'Games Ranked',
      })
    if (userStats.totalPlays > 0)
      statCards.push({
        iconBg: 'bg-blue-500',
        Icon: PlayIcon,
        iconColor: 'text-white',
        value: userStats.totalPlays,
        label: 'Games Played',
      })
    if (userStats.avgRating !== null)
      statCards.push({
        iconBg: 'bg-yellow-500',
        Icon: StarIcon,
        iconColor: 'text-white',
        value: userStats.avgRating.toFixed(1),
        label: 'Avg Rating',
      })
    if (userStats.gamesOwned > 0)
      statCards.push({
        iconBg: 'bg-indigo-500',
        Icon: BookmarkIcon,
        iconColor: 'text-white',
        value: userStats.gamesOwned,
        label: 'Games Owned',
      })
    if (userStats.listsCreated > 0)
      statCards.push({
        iconBg: 'bg-purple-500',
        Icon: ListBulletIcon,
        iconColor: 'text-white',
        value: userStats.listsCreated,
        label: 'Lists Created',
      })
    if (userStats.awardsCreated > 0)
      statCards.push({
        iconBg: 'bg-amber-500',
        Icon: TrophyIcon,
        iconColor: 'text-white',
        value: userStats.awardsCreated,
        label: 'Awards Created',
      })
  }

  return (
    <div className="space-y-12" id="games-section">
      {/* DEBUG ONLY: remove before release */}
      {process.env.NEXT_PUBLIC_SHOW_PHASE_DEBUG === 'true' && phaseResult && (
        <details style={{ opacity: 0.7, fontSize: 12, marginBottom: 12 }}>
          <summary>Debug: phaseResult</summary>
          <pre>{JSON.stringify(phaseResult, null, 2)}</pre>
        </details>
      )}

      {/* Welcome Heading */}
      <div className="flex items-center justify-between">
        <Heading as="h1" size="lg">
          {welcomeHeading}
        </Heading>
        <Link
          href="/profile"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View Profile →
        </Link>
      </div>

      {/* Quick Actions */}
      {phaseResult?.canShowQuickActions && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all"
            >
              <div
                className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center flex-shrink-0`}
              >
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {action.label}
                </div>
                <div className="text-xs text-gray-500">
                  {action.description}
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* Foundational Games (Phase 1, 1–2 rankings only) */}
      {phaseResult?.canShowFoundationalGames && foundationalGames.length > 0 && (
        <DiscoveryCard
          title="Foundational Games"
          icon="🎲"
          subtitle="Widely known games that helped shape modern board gaming"
          games={foundationalGames}
          renderSubtitle={() => ''}
        />
      )}

      {/* Gaming at a Glance (Phase 2+) */}
      {phaseResult?.canShowGlanceStats && statCards.length > 0 && (
        <section className="space-y-4">
          <div>
            <Heading as="h2" size="md" className="text-gray-900">
              Your Gaming at a Glance
            </Heading>
            <p className="mt-0.5 text-sm sm:text-base text-gray-600">
              A snapshot of your board game life
            </p>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 animate-pulse rounded-2xl h-[120px]"
                />
              ))}
            </div>
          ) : (
            <div className={`grid grid-cols-2 gap-4 ${statCards.length <= 4 ? `md:grid-cols-${statCards.length}` : 'md:grid-cols-5'}`}>
              {statCards.map((card) => (
                <StatCard
                  key={card.label}
                  iconBg={card.iconBg}
                  Icon={card.Icon}
                  iconColor={card.iconColor}
                  value={card.value}
                  label={card.label}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Personal Discovery Sections ── */}

      {/* Your Awards (Phase 3 only — all-time by default) */}
      {phaseResult?.canShowMostAwarded &&
        discoveryLists.mostAwarded.length > 0 && (
          <DiscoveryCard
            title="Your Awards"
            icon="🏆"
            games={discoveryLists.mostAwarded}
            loading={discoveryLoading}
            explainer={EXPLAINERS['most-awarded']}
            sectionKey="most-awarded"
            renderSubtitle={(game: MostAwardedGame) =>
              `${game.total_points} pts · ${game.award_count} award${game.award_count !== 1 ? 's' : ''}`
            }
          />
        )}

      {/* Highest Ranked by You (Phase 1+) */}
      {phaseResult?.canShowHighestRanked &&
        discoveryLists.highestRanked.length > 0 && (
          <DiscoveryCard
            title="Your Top-Rated Games"
            icon="⭐"
            games={discoveryLists.highestRanked}
            loading={discoveryLoading}
            explainer={EXPLAINERS['highest-ranked']}
            sectionKey="highest-ranked"
            renderSubtitle={(game: HighestRankedGame) => {
              const plays =
                game.plays_12mo > 0
                  ? ` · played ${game.plays_12mo}x this year`
                  : ''
              return `${game.user_ranking}/10${plays}`
            }}
          />
        )}

      {/* Your Hot Takes (Phase 1+) */}
      {phaseResult?.canShowHotTakes &&
        discoveryLists.hotTakes.length > 0 && (
          <DiscoveryCard
            title="Your Hot Takes"
            icon="🔥"
            games={discoveryLists.hotTakes}
            loading={discoveryLoading}
            explainer={EXPLAINERS['hot-takes']}
            sectionKey="hot-takes"
            renderSubtitle={(game: HotTakeGame) => {
              const sign = game.delta > 0 ? '+' : ''
              return `You: ${game.user_ranking}/10 · BGG: ${game.bgg_rating.toFixed(1)} · ${sign}${game.delta.toFixed(1)}`
            }}
          />
        )}

      {/* Sleeper Hits (Phase 2+) */}
      {phaseResult?.canShowSleeperHits &&
        discoveryLists.sleeperHits.length > 0 && (
          <DiscoveryCard
            title="Your Hidden Gems"
            icon="💎"
            games={discoveryLists.sleeperHits}
            loading={discoveryLoading}
            explainer={EXPLAINERS['sleeper-hits']}
            sectionKey="sleeper-hits"
            renderSubtitle={(game: SleeperHitGame) =>
              `Rated ${game.user_ranking}/10 · only ${game.game_num_ratings?.toLocaleString()} ratings`
            }
          />
        )}

      {/* Comeback Games (Phase 2+) */}
      {phaseResult?.canShowComebackGames &&
        discoveryLists.comebackGames.length > 0 && (
          <DiscoveryCard
            title="Games You Keep Coming Back To"
            icon="🔄"
            games={discoveryLists.comebackGames}
            loading={discoveryLoading}
            explainer={EXPLAINERS['comeback-games']}
            sectionKey="comeback-games"
            renderSubtitle={(game: ComebackGame) =>
              `${game.months_played_12mo} of 12 months · ${game.total_plays_12mo} plays`
            }
          />
        )}

      {/* Discovery loading skeleton (shown when no discovery sections have loaded yet) */}
      {discoveryLoading &&
        discoveryLists.highestRanked.length === 0 &&
        phaseResult?.canShowHighestRanked && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i}>
                    <div className="bg-gray-200 aspect-square rounded-lg mb-2" />
                    <div className="bg-gray-200 h-4 rounded mb-1" />
                    <div className="bg-gray-200 h-3 rounded w-3/4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* ── Scaffold card for true zero-data Phase 1 users ── */}
      {phaseResult && !phaseResult.hasAnyData && (
        <section className="bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-100 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-gray-900">
                Your personal board game companion
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                MeepleGo builds a picture of your taste over time. Start with a
                rating or two and you'll see your top picks, hot takes, hidden
                gems, and play stats appear right here.
              </p>
              <p className="text-xs text-gray-400">
                No leaderboards. No pressure. Just your table, over time.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/rankings"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <StarIcon className="w-4 h-4" />
                  Rate your first game
                </Link>
                <Link
                  href="/games"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <MagnifyingGlassIcon className="w-4 h-4" />
                  Browse games
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Community Sections (gated — hidden for zero-data Phase 1) ── */}

      {/* Explore Top-Rated Games (Phase 2+ — sourced from global rank data) */}
      {phaseResult?.canShowExplore && (
        <section className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-4">
              <Heading as="h2" size="md" className="text-gray-900">
                Explore Top-Rated Games
              </Heading>
              <Link
                href="/games"
                className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
              >
                View all →
              </Link>
            </div>
            <p className="mt-0.5 text-sm sm:text-base text-gray-600">
              A public reference list for browsing
            </p>
          </div>
          {loading ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-48 h-64 bg-gray-200 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : (
            <div className="-mx-4 sm:-mx-6 lg:-mx-8">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 sm:px-6 lg:px-8">
                {featuredGames.map((game) => (
                  <div key={game.id} className="flex-shrink-0 w-48">
                    <GameCard
                      game={game as any}
                      viewMode="grid"
                      variant="balanced"
                      imageFit="contain"
                      className="h-full flex flex-col"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Industry Awards (hidden for zero-data Phase 1) */}
      {phaseResult?.canShowIndustryAwards && industryAwards.length > 0 && (
        <section className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-4">
              <Heading as="h2" size="md" className="text-gray-900">
                Industry Awards
              </Heading>
              <Link
                href="/awards"
                className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
              >
                Explore all →
              </Link>
            </div>
            <p className="mt-0.5 text-sm sm:text-base text-gray-600">
              Prestigious board game honors and recognition
            </p>
          </div>
          <NetflixScrollSection itemWidth="w-72" showCount={4}>
            {industryAwards.map((award: any) => (
              <AwardCard
                key={award.id}
                href={`/awards#${award.id}`}
                title={award.name}
                description={
                  award.description || 'Prestigious board game recognition'
                }
                yearSpan={undefined}
                winners={undefined as any}
                nominees={undefined as any}
                circleBorderClass={award.borderColor || 'border-amber-200'}
                circleBgClass={award.backgroundColor || 'bg-amber-50'}
                iconColorClass={award.iconColor || 'text-amber-600'}
                showStats={false}
                cta="View Details"
              />
            ))}
          </NetflixScrollSection>
        </section>
      )}

      {/* Community Lists (Phase 2+) */}
      {phaseResult?.canShowPublicLists && publicLists.length > 0 && (
        <section className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-4">
              <Heading as="h2" size="md" className="text-gray-900">
                Community Lists
              </Heading>
              <Link
                href="/lists"
                className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
              >
                Browse lists →
              </Link>
            </div>
            <p className="mt-0.5 text-sm sm:text-base text-gray-600">
              Collections curated by fellow players
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicLists.slice(0, 3).map((list) => (
              <ListCard key={list.id} list={list as any} isPublic={true} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default HomepageView
