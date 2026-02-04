'use client'
import Link from 'next/link'
import GameCard from '@/components/Components/GameCard'
import Heading from '@/components/Components/Heading'
import { AwardCard } from '@/components/Components/AwardCard'
import ListCard from '@/components/Components/ListCard'
import StatCard from '@/components/Elements/StatCard'
import ZeroState from '@/components/Components/ZeroState'
import HorizontalCardSection from './HorizontalCardSection'
import Hero from '@/components/Components/Hero'
import {
  ListBulletIcon,
  StarIcon,
  PlayIcon,
  BookmarkIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon,
  HandRaisedIcon,
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
  journalledCount: number
}

export interface HomepageViewProps {
  user: { id: string } | null
  username?: string | null
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
  recentlyPlayed?: any[]
  topCommunityRated?: any[]
}

export interface HomepageSubHeaderProps {
  phaseResult?: UserPhaseResult | null
  username?: string | null
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
]

export function HomepageSubHeader({
  phaseResult,
  username,
}: HomepageSubHeaderProps) {
  if (!phaseResult?.canShowQuickActions) {
    return null
  }

  const phase = phaseResult?.phase ?? 1
  const quickActions = phase >= 2 ? PHASE_2_ACTIONS : PHASE_1_ACTIONS

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) {
      return { icon: <SunIcon className="w-6 h-6 text-yellow-500" />, text: 'Good morning' }
    }
    if (hour < 17) {
      return { icon: <SunIcon className="w-6 h-6 text-orange-500" />, text: 'Good afternoon' }
    }
    return { icon: <MoonIcon className="w-6 h-6 text-indigo-500" />, text: 'Good evening' }
  }

  const greeting = getTimeBasedGreeting()
  
  let welcomeHeading: React.ReactNode = (
    <span className="inline-flex items-center gap-2">
      {greeting.icon}
      {greeting.text}
    </span>
  )
  
  if (phase >= 2) {
    welcomeHeading = (
      <span className="inline-flex items-center gap-2">
        {greeting.icon}
        {greeting.text}, {username || 'friend'}!
      </span>
    )
  } else if (phaseResult && phaseResult.accountAgeDays > 3) {
    welcomeHeading = (
      <span className="inline-flex items-center gap-2">
        Welcome back
        <HandRaisedIcon className="w-6 h-6 text-amber-500" />
      </span>
    )
  }

  return (
    <section className="space-y-4 text-center">
      <Heading as="h1" size="lg">
        {welcomeHeading}
      </Heading>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-2 px-3 py-2 transition-all hover:scale-105"
          >
            <div
              className={`w-8 h-8 ${action.color.replace('bg-', 'bg-').replace('-500', '-100')} rounded-lg flex items-center justify-center flex-shrink-0`}
            >
              <action.icon className={`w-4 h-4 ${action.color.replace('bg-', 'text-').replace('-500', '-600')}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

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
  username,
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
  recentlyPlayed = [],
  topCommunityRated = [],
}: HomepageViewProps) {
  // ── Guest experience (unchanged — OnboardingLanding handles the main logged-out view) ──
  if (!user) {
    return (
      <div className="space-y-6" id="games-section">
        <section className="space-y-2 bg-transparent">
          <ZeroState
            title="Track your board game life"
            description="Organize your collection, rate what you play, and celebrate your favorites. Join to unlock your personal stats."
            action={{ label: 'Sign up to get started', href: '/signup' }}
          />
        </section>

        {/* Trending Games */}
        <section className="space-y-4 bg-white">
          <div>
            <div className="flex items-center justify-between gap-4">
              <Heading as="h2" size="md" className="text-gray-900">
                Trending Games
              </Heading>
              <Link
                href="/games"
                className="text-xs font-medium sm:text-sm text-primary-600 hover:text-primary-500 whitespace-nowrap"
              >
                View all →
              </Link>
            </div>
            <p className="mt-0.5 text-sm sm:text-base text-gray-600">
              Discover what's popular in the board game community
            </p>
          </div>
          {loading ? (
            <div className="flex gap-4 pb-4 overflow-x-auto scrollbar-hide">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-48 h-64 bg-gray-200 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="-mx-4 sm:-mx-6 lg:-mx-8">
              <div className="flex gap-4 px-4 pb-4 overflow-x-auto scrollbar-hide sm:px-6 lg:px-8">
                {featuredGames.map((game) => (
                  <div key={game.id} className="flex-shrink-0 w-48">
                    <GameCard
                      game={game as any}
                      viewMode="grid"
                      variant="balanced"
                      imageFit="contain"
                      className="flex flex-col h-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Industry Awards */}
        {industryAwards.length > 0 && (
          <HorizontalCardSection
            mode="custom"
            title="Industry Awards"
            href="/awards"
            itemWidth="w-72"
            showCount={4}
            hideIfEmpty={false}
          >
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
          </HorizontalCardSection>
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
                  className="text-xs font-medium sm:text-sm text-primary-600 hover:text-primary-500 whitespace-nowrap"
                >
                  Browse lists →
                </Link>
              </div>
              <p className="mt-0.5 text-sm sm:text-base text-gray-600">
                Collections curated by fellow players
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

  // Fixed glance stat cards — subtle color treatment matching Sleeper Hits / Hot Takes badges
  const glanceCards: Array<{
    backgroundColor: string
    iconBg: string
    Icon: React.ComponentType<{ className?: string }>
    iconColor: string
    value: number
    label: string
    phase?: number // minimum phase to show (default: all)
  }> = [
    {
      backgroundColor: 'bg-indigo-600/10',
      iconBg: 'bg-indigo-600/10',
      Icon: BookmarkIcon,
      iconColor: 'text-indigo-700',
      value: userStats?.gamesOwned ?? 0,
      label: 'Games Owned',
    },
    {
      backgroundColor: 'bg-blue-600/10',
      iconBg: 'bg-blue-600/10',
      Icon: PlayIcon,
      iconColor: 'text-blue-700',
      value: userStats?.totalPlays ?? 0,
      label: 'Games Played',
    },
    {
      backgroundColor: 'bg-green-600/10',
      iconBg: 'bg-green-600/10',
      Icon: StarIcon,
      iconColor: 'text-green-700',
      value: userStats?.uniqueGames ?? 0,
      label: 'Games Ranked',
    },
    {
      backgroundColor: 'bg-amber-600/10',
      iconBg: 'bg-amber-600/10',
      Icon: BookOpenIcon,
      iconColor: 'text-amber-700',
      value: userStats?.journalledCount ?? 0,
      label: 'Games Journalled',
      phase: 2,
    },
  ]

  const visibleGlanceCards = glanceCards.filter((c) => !c.phase || phase >= c.phase)

  return (
    <div className="space-y-6" id="games-section">
      {/* DEBUG ONLY: remove before release */}
      {process.env.NEXT_PUBLIC_SHOW_PHASE_DEBUG === 'true' && phaseResult && (
        <details style={{ opacity: 0.7, fontSize: 12, marginBottom: 12 }}>
          <summary>Debug: phaseResult</summary>
          <pre>{JSON.stringify(phaseResult, null, 2)}</pre>
        </details>
      )}

      {/* White container for all discovery sections */}
      <section className="space-y-12">
      {/* Foundational Games (Phase 1, 1–2 rankings only) */}
      {phaseResult?.canShowFoundationalGames && foundationalGames.length > 0 && (
        <HorizontalCardSection
          mode="games"
          title="Have you played?"
          games={foundationalGames}
          loading={discoveryLoading}
          sectionKey="foundational-games"
          explainer={EXPLAINERS['foundational-games']}
          renderSubtitle={() => ''}
        />
      )}

      {/* Recently Played (Phase 3) — replaces top Hot Takes for power users */}
      {phaseResult?.canShowRecentlyPlayed && recentlyPlayed.length > 0 && (
        <HorizontalCardSection
          mode="games"
          title="Recently Played"
          games={recentlyPlayed}
          loading={discoveryLoading}
          sectionKey="recently-played"
          metadata={{
              showTitle: true,
              showYear: false,
              showPlayerCount: false,
              showPlaytime: false,
              showTagline: false,
            }}
        />
      )}

      {/* Your Hot Takes (Phase 1/2 top slot — Phase 3 sees it further down only) */}
      {!phaseResult?.canShowRecentlyPlayed &&
        phaseResult?.canShowHotTakes &&
        discoveryLists.hotTakes.length > 0 && (
          <HorizontalCardSection
            mode="games"
            title="Your Hot Takes"
            games={discoveryLists.hotTakes}
            loading={discoveryLoading}
            explainer={EXPLAINERS['hot-takes']}
            sectionKey="hot-takes"
            metadata={{
              showTitle: true,
              showYear: false,
              showPlayerCount: false,
              showPlaytime: false,
              showTagline: false,
            }}
          />
        )}



      {/* Gaming at a Glance */}
      {phaseResult?.canShowGlanceStats && (
        <section className="space-y-3">
          {/* <h2 className="text-[22px] font-semibold text-gray-900">
            Your Gaming at a Glance
          </h2> */}
          {loading ? (
            <div className={`grid grid-cols-2 gap-4 md:grid-cols-${visibleGlanceCards.length}`}>
              {visibleGlanceCards.map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 animate-pulse rounded-2xl h-[120px]"
                />
              ))}
            </div>
          ) : (
            <div className={`grid grid-cols-2 gap-4 md:grid-cols-${visibleGlanceCards.length}`}>
              {visibleGlanceCards.map((card) => (
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
          <HorizontalCardSection
            mode="games"
            title="Your Awards"
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
          <HorizontalCardSection
            mode="games"
            title="Your Top-Rated Games"
            games={discoveryLists.highestRanked}  
            loading={discoveryLoading}
            explainer={EXPLAINERS['highest-ranked']}
            sectionKey="highest-ranked"
            metadata={{
              showTitle: true,
              showYear: false,
              showPlayerCount: false,
              showPlaytime: false,
            }}
            renderSubtitle={() => ''}
            metadataMapper={(game: any) => ({
              userRanking: game.user_ranking ?? null,
            })}
          />
        )}

      {/* Your Hot Takes (Phase 1+) */}
      {phaseResult?.canShowHotTakes &&
        discoveryLists.hotTakes.length > 0 && (
          <HorizontalCardSection
            mode="games"
            title="Your Hot Takes"
            games={discoveryLists.hotTakes}
            loading={discoveryLoading}
            explainer={EXPLAINERS['hot-takes']}
            sectionKey="hot-takes"
            metadata={{
              showTitle: true,
              showYear: false,
              showPlayerCount: false,
              showPlaytime: false,
              showTagline: false,
              // delta will auto-populate from game.delta
              averageRating: null,
            }}
            renderSubtitle={() => ''}
          />
        )}

      {/* Sleeper Hits (Phase 2+) */}
      {phaseResult?.canShowSleeperHits &&
        discoveryLists.sleeperHits.length > 0 && (
          <HorizontalCardSection
            mode="games"
            title="Your Sleeper Hits"
            games={discoveryLists.sleeperHits}
            loading={discoveryLoading}
            explainer={EXPLAINERS['sleeper-hits']}
            sectionKey="sleeper-hits"
            metadata={{
              showTitle: true,
              showYear: false,
              showPlayerCount: false,
              showPlaytime: false,
              showTagline: false,
              // sleepinessClassification will auto-populate from game_num_ratings
            }}
            renderSubtitle={() => ''}
          />
        )}

      {/* Comeback Games (Phase 2+) */}
      {phaseResult?.canShowComebackGames &&
        discoveryLists.comebackGames.length > 0 && (
          <HorizontalCardSection
            mode="games"
            title="Games You Keep Coming Back To"
            games={discoveryLists.comebackGames}
            loading={discoveryLoading}
            explainer={EXPLAINERS['comeback-games']}
            sectionKey="comeback-games"
            renderSubtitle={(game: ComebackGame) =>
              `${game.months_played_12mo} of 12 months · ${game.total_plays_12mo} plays`
            }
          />
        )}

      {/* ── Scaffold card for Phase 1 users ── */}
      {/* Always shown in Phase 1 to frame expectation — not just zero-data.
          A user with 1-2 ratings is still Phase 1 and should see this. */}
      {phaseResult && phaseResult.phase === 1 && (
        <Hero
          title="Your personal board game companion"
          subtitle={
            phaseResult.hasAnyData
              ? 'Keep rating and logging plays — the more you add, the richer your highlights, hot takes, and hidden gems become.'
              : 'MeepleGo builds a picture of your taste over time. Start with a rating or two and you’ll see your top picks, hot takes, hidden gems, and play stats appear right here.'
          }
          steps={[
            {
              icon: <StarIcon className="w-5 h-5 text-amber-500" />,
              heading: 'Rate games',
              text: 'Score your favorites to start building your personal highlights and stats.'
            },
            {
              icon: <MagnifyingGlassIcon className="w-5 h-5 text-green-500" />,
              heading: 'Browse & discover',
              text: 'Explore the catalog and find new games to play and rate.'
            },
            {
              icon: <SparklesIcon className="w-5 h-5 text-primary-600" />,
              heading: 'See your journey',
              text: 'Watch your top picks, hot takes, hidden gems, and play stats appear as you log more.'
            },
          ]}
          cta={{
            label: phaseResult.hasAnyData ? 'Rate more games' : 'Rate your first game',
            href: '/rankings',
          }}
        />
      )}

      {/* ── Community Sections (gated — hidden for zero-data Phase 1) ── */}

      {/* Explore Top-Rated Games (Phase 2+ — sourced from MeepleGo user rankings) */}
      {phaseResult?.canShowExplore && topCommunityRated.length > 0 && (
        <HorizontalCardSection
          mode="games"
          title="Top-Rated on MeepleGo"
          games={topCommunityRated}
          loading={discoveryLoading}
          sectionKey="top-rated-meepleGo"
          metadata={{
            showTitle: true,
            showYear: false,
            showPlayerCount: false,
            showPlaytime: false,
          }}
          renderSubtitle={() => ''}
        />
      )}

      {/* Industry Awards (hidden for zero-data Phase 1) */}
      {phaseResult?.canShowIndustryAwards && industryAwards.length > 0 && (
        <HorizontalCardSection
          mode="custom"
          title="Industry Awards"
          href="/awards"
          itemWidth="w-72"
          showCount={4}
          hideIfEmpty={false}
        >
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
        </HorizontalCardSection>
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
                className="text-xs font-medium sm:text-sm text-primary-600 hover:text-primary-500 whitespace-nowrap"
              >
                Browse lists →
              </Link>
            </div>
            <p className="mt-0.5 text-sm sm:text-base text-gray-600">
              Collections curated by fellow players
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {publicLists.slice(0, 3).map((list) => (
              <ListCard key={list.id} list={list as any} isPublic={true} />
            ))}
          </div>
        </section>
      )}
      </section>
    </div>
  )
}

export default HomepageView
