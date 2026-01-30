'use client'
import Link from 'next/link'
import GameCard from '@/components/Components/GameCard'
import Heading from '@/components/Components/Heading'
import { AwardCard } from '@/components/Components/AwardCard'
import ListCard from '@/components/Components/ListCard'
import StatCard from '@/components/Elements/StatCard'
import NetflixScrollSection from '@/components/Elements/NetflixScrollSection'
import ZeroState from '@/components/Components/ZeroState'
import {
  TrophyIcon,
  ChartBarIcon,
  CubeIcon,
  ListBulletIcon,
  CalendarIcon,
  StarIcon,
  PlayIcon,
  BookmarkIcon,
  ClockIcon,
  FlagIcon,
  SparklesIcon,
  FireIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import type { Game } from '@/types/supabase'
import type {
  MostAwardedGame,
  HighestRankedGame,
  SleeperHitGame,
  HotTakeGame,
  ComebackGame,
} from '@/types'
import DiscoveryCard from './DiscoveryCard'

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
  bggMostPlayed?: Game[]
  bggHotness?: Game[]
  bggBestsellers?: Game[]
  bggListIds?: {
    trendingplays?: string
    hotness?: string
    mostplayed?: string
    bestsellers?: string
  }
  discoveryLists?: {
    mostAwarded: MostAwardedGame[]
    highestRanked: HighestRankedGame[]
    sleeperHits: SleeperHitGame[]
    hotTakes: HotTakeGame[]
    comebackGames: ComebackGame[]
  }
  discoveryLoading?: boolean
}

const features = [
  {
    name: 'Awards',
    description:
      'Create and manage your yearly awards. Nominate and pick winners for categories like Best Game, Best Strategy Game, and more.',
    href: '/awards',
    icon: TrophyIcon,
    color: 'bg-yellow-500',
  },
  {
    name: 'Rankings',
    description:
      "Rate your games from 1-10 and track which ones you've played. Build your personal ranking system.",
    href: '/rankings',
    icon: ChartBarIcon,
    color: 'bg-blue-500',
  },
  {
    name: 'Games',
    description:
      'Browse your game collection with detailed information, ratings, and quick actions.',
    href: '/games',
    icon: CubeIcon,
    color: 'bg-green-500',
  },
  {
    name: 'Lists',
    description:
      'Create custom lists like "Top 10 Party Games" or "Games to Play With Family" and organize your collection.',
    href: '/lists',
    icon: ListBulletIcon,
    color: 'bg-purple-500',
  },
]

export function HomepageView({
  user,
  loading,
  featuredGames,
  userStats,
  industryAwards = [],
  publicLists = [],
  bggMostPlayed = [],
  bggHotness = [],
  bggBestsellers = [],
  bggListIds = {},
  discoveryLists = {
    mostAwarded: [],
    highestRanked: [],
    sleeperHits: [],
    hotTakes: [],
    comebackGames: [],
  },
  discoveryLoading = false,
}: HomepageViewProps) {
  // Guest experience
  if (!user) {
    return (
      <div className="space-y-12" id="games-section">
        {/* Zero-state hero for guests */}
        <section className="space-y-2">
          <ZeroState
            title="Track your board game life"
            description="Organize your collection, rate what you play, and celebrate your favorites. Join to unlock your personal stats."
            action={{ label: 'Sign up to get started', href: '/signup' }}
          />
        </section>

        {/* BGG Trending (Trending Plays) */}
        <section className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-4">
              <Heading
                as="h2"
                size="md"
                className="text-gray-900"
              >
                Trending Games
              </Heading>
              <Link
                href={
                  bggListIds.trendingplays
                    ? `/lists/${bggListIds.trendingplays}`
                    : '/games'
                }
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

        {/* BGG Hotness */}
        {bggHotness.length > 0 && (
          <section className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-4">
                <Heading
                  as="h2"
                  size="md"
                  className="text-gray-900"
                >
                  BGG Hotness
                </Heading>
                <Link
                  href={
                    bggListIds.hotness ? `/lists/${bggListIds.hotness}` : '/lists'
                  }
                  className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
                >
                  View all →
                </Link>
              </div>
              <p className="mt-0.5 text-sm sm:text-base text-gray-600">
                What's trending hot on BoardGameGeek right now
              </p>
            </div>
            <div className="-mx-4 sm:-mx-6 lg:-mx-8">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 sm:px-6 lg:px-8">
                {bggHotness.map((game) => (
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
          </section>
        )}

        {/* BGG Most Played */}
        {bggMostPlayed.length > 0 && (
          <section className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-4">
                <Heading
                  as="h2"
                  size="md"
                  className="text-gray-900"
                >
                  BGG Most Played
                </Heading>
                <Link
                  href={
                    bggListIds.mostplayed
                      ? `/lists/${bggListIds.mostplayed}`
                      : '/lists'
                  }
                  className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
                >
                  View all →
                </Link>
              </div>
              <p className="mt-0.5 text-sm sm:text-base text-gray-600">
                Games getting the most plays right now
              </p>
            </div>
            <div className="-mx-4 sm:-mx-6 lg:-mx-8">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 sm:px-6 lg:px-8">
                {bggMostPlayed.map((game) => (
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
          </section>
        )}

        {/* BGG Bestsellers */}
        {bggBestsellers.length > 0 && (
          <section className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-4">
                <Heading
                  as="h2"
                  size="md"
                  className="text-gray-900"
                >
                  BGG Bestsellers
                </Heading>
                <Link
                  href={
                    bggListIds.bestsellers
                      ? `/lists/${bggListIds.bestsellers}`
                      : '/lists'
                  }
                  className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
                >
                  View all →
                </Link>
              </div>
              <p className="mt-0.5 text-sm sm:text-base text-gray-600">
                Top-selling games on BoardGameGeek
              </p>
            </div>
            <div className="-mx-4 sm:-mx-6 lg:-mx-8">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 sm:px-6 lg:px-8">
                {bggBestsellers.map((game) => (
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
          </section>
        )}

        {/* Industry Awards */}
        {industryAwards.length > 0 && (
          <section className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-4">
                <Heading
                  as="h2"
                  size="md"
                  className="text-gray-900"
                >
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
        <section className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-4">
              <Heading
                as="h2"
                size="md"
                className="text-gray-900"
              >
                Public Lists
              </Heading>
              <Link
                href="/lists"
                className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
              >
                Browse lists →
              </Link>
            </div>
            <p className="mt-0.5 text-sm sm:text-base text-gray-600">
              Community-curated game collections ({publicLists.length} found)
            </p>
          </div>
          {publicLists.length > 0 ? (
            <NetflixScrollSection itemWidth="w-72" showCount={4}>
              {publicLists.map((list) => (
                <ListCard key={list.id} list={list as any} isPublic={true} />
              ))}
            </NetflixScrollSection>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Loading lists or no public lists found...
            </div>
          )}
        </section>
      </div>
    )
  }

  // Authenticated experience
  return (
    <div className="space-y-12" id="games-section">
      {/* Trending Games Section */}
      <section className="space-y-4">
        <div>
          <div className="flex items-center justify-between gap-4">
            <Heading
              as="h2"
              size="md"
              className="text-gray-900"
            >
              Trending Games
            </Heading>
            <Link
              href={
                bggListIds.trendingplays
                  ? `/lists/${bggListIds.trendingplays}`
                  : '/games'
              }
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

      {/* BGG Hotness */}
      {bggHotness.length > 0 && (
        <section className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-4">
              <Heading
                as="h2"
                size="md"
                className="text-gray-900"
              >
                BGG Hotness
              </Heading>
              <Link
                href={
                  bggListIds.hotness ? `/lists/${bggListIds.hotness}` : '/lists'
                }
                className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
              >
                View all →
              </Link>
            </div>
            <p className="mt-0.5 text-sm sm:text-base text-gray-600">
              What's trending hot on BoardGameGeek right now
            </p>
          </div>
          <div className="-mx-4 sm:-mx-6 lg:-mx-8">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 sm:px-6 lg:px-8">
              {bggHotness.map((game) => (
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
        </section>
      )}

      {/* BGG Most Played */}
      {bggMostPlayed.length > 0 && (
        <section className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-4">
              <Heading
                as="h2"
                size="md"
                className="text-gray-900"
              >
                BGG Most Played
              </Heading>
              <Link
                href={
                  bggListIds.mostplayed
                    ? `/lists/${bggListIds.mostplayed}`
                    : '/lists'
                }
                className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
              >
                View all →
              </Link>
            </div>
            <p className="mt-0.5 text-sm sm:text-base text-gray-600">
              Games getting the most plays right now
            </p>
          </div>
          <div className="-mx-4 sm:-mx-6 lg:-mx-8">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 sm:px-6 lg:px-8">
              {bggMostPlayed.map((game) => (
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
        </section>
      )}

      {/* BGG Bestsellers */}
      {bggBestsellers.length > 0 && (
        <section className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-4">
              <Heading
                as="h2"
                size="md"
                className="text-gray-900"
              >
                BGG Bestsellers
              </Heading>
              <Link
                href={
                  bggListIds.bestsellers
                    ? `/lists/${bggListIds.bestsellers}`
                    : '/lists'
                }
                className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
              >
                View all →
              </Link>
            </div>
            <p className="mt-0.5 text-sm sm:text-base text-gray-600">
              Top-selling games on BoardGameGeek
            </p>
          </div>
          <div className="-mx-4 sm:-mx-6 lg:-mx-8">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 sm:px-6 lg:px-8">
              {bggBestsellers.map((game) => (
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
        </section>
      )}

      <section className="space-y-4">
        <div>
          <Heading
            as="h2"
            size="md"
            className="text-gray-900"
          >
            Your Gaming at a Glance
          </Heading>
          <p className="mt-0.5 text-sm sm:text-base text-gray-600">
            Track your progress and discover insights about your gaming habits
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard
              iconBg="bg-blue-500"
              Icon={BookmarkIcon}
              iconColor="text-white"
              value={userStats?.gamesOwned || 0}
              label="Games Owned"
            />
            <StatCard
              iconBg="bg-green-500"
              Icon={CubeIcon}
              iconColor="text-white"
              value={userStats?.uniqueGames || 0}
              label="Games Played"
            />
            <StatCard
              iconBg="bg-yellow-500"
              Icon={StarIcon}
              iconColor="text-white"
              value={userStats?.avgRating?.toFixed(1) || '—'}
              label="Avg Rating"
            />
            <StatCard
              iconBg="bg-purple-500"
              Icon={ListBulletIcon}
              iconColor="text-white"
              value={userStats?.listsCreated || 0}
              label="Lists Created"
            />
            <StatCard
              iconBg="bg-amber-500"
              Icon={TrophyIcon}
              iconColor="text-white"
              value={userStats?.awardsCreated || 0}
              label="Awards Created"
            />
          </div>
        )}
      </section>

      {/* Discovery Lists Section */}
      <section className="space-y-8">
        <div>
          <Heading as="h2" size="lg" className="text-gray-900 dark:text-white">
            Personalized Discoveries
          </Heading>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Insights based on your gaming activity and preferences
          </p>
        </div>

        {/* Most Awarded This Year */}
        <DiscoveryCard
          title="Most Awarded This Year"
          icon={<TrophyIcon className="w-5 h-5 text-amber-500" />}
          subtitle="Awards-based standouts from your collection"
          games={discoveryLists.mostAwarded}
          loading={discoveryLoading}
          emptyMessage="Award some games this year to see them here!"
          renderSubtitle={(game: MostAwardedGame) =>
            `${game.total_points} pts · ${game.award_count} award${game.award_count !== 1 ? 's' : ''}`
          }
          href="/awards"
        />

        {/* Highest Ranked by You */}
        <DiscoveryCard
          title="Highest Ranked by You"
          icon={<StarIcon className="w-5 h-5 text-yellow-500" />}
          subtitle="Your top-rated games, ranked by your scores"
          games={discoveryLists.highestRanked}
          loading={discoveryLoading}
          emptyMessage="Rate some games to build your personal top 10!"
          renderSubtitle={(game: HighestRankedGame) => {
            const plays =
              game.plays_12mo > 0
                ? ` · played ${game.plays_12mo}x this year`
                : ''
            return `${game.user_ranking}/10${plays}`
          }}
          href="/rankings"
        />

        {/* Sleeper Hits */}
        <DiscoveryCard
          title="Your Sleeper Hits"
          icon={<SparklesIcon className="w-5 h-5 text-indigo-500" />}
          subtitle="Hidden gems you rated highly despite fewer ratings"
          games={discoveryLists.sleeperHits}
          loading={discoveryLoading}
          emptyMessage="Rate some lesser-known games to discover hidden gems!"
          renderSubtitle={(game: SleeperHitGame) =>
            `Rated ${game.user_ranking}/10 · only ${game.game_num_ratings?.toLocaleString()} ratings`
          }
          href="/rankings"
        />

        {/* Hot Takes */}
        <DiscoveryCard
          title="Your Hot Takes"
          icon={<FireIcon className="w-5 h-5 text-red-500" />}
          subtitle="Where your ratings disagree most with the community"
          games={discoveryLists.hotTakes}
          loading={discoveryLoading}
          emptyMessage="Rate games to see where you differ from the community!"
          renderSubtitle={(game: HotTakeGame) => {
            const sign = game.delta > 0 ? '+' : ''
            return `You: ${game.user_ranking}/10 · BGG: ${game.bgg_rating.toFixed(1)} · ${sign}${game.delta.toFixed(1)}`
          }}
          href="/rankings"
        />

        {/* Games You Keep Coming Back To */}
        <DiscoveryCard
          title="Games You Keep Coming Back To"
          icon={<ArrowPathIcon className="w-5 h-5 text-teal-500" />}
          subtitle="Consistent favorites based on the last 12 months"
          games={discoveryLists.comebackGames}
          loading={discoveryLoading}
          emptyMessage="Log plays to see your most consistent favorites!"
          renderSubtitle={(game: ComebackGame) =>
            `${game.months_played_12mo} of 12 months · ${game.total_plays_12mo} plays`
          }
          href="/plays"
        />
      </section>

      {/* Industry Awards Preview */}
      {industryAwards.length > 0 && (
        <section className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-4">
              <Heading
                as="h2"
                size="md"
                className="text-gray-900"
              >
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

          {/* Netflix-style horizontal scrolling */}
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
      <section className="space-y-4">
        <div>
          <div className="flex items-center justify-between gap-4">
            <Heading
              as="h2"
              size="md"
              className="text-gray-900"
            >
              Public Lists
            </Heading>
            <Link
              href="/lists"
              className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
            >
              Browse lists →
            </Link>
          </div>
          <p className="mt-0.5 text-sm sm:text-base text-gray-600">
            Community-curated game collections ({publicLists.length} found)
          </p>
        </div>
        {publicLists.length > 0 ? (
          <NetflixScrollSection itemWidth="w-72" showCount={4}>
            {publicLists.map((list) => (
              <ListCard key={list.id} list={list as any} isPublic={true} />
            ))}
          </NetflixScrollSection>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Loading lists or no public lists found...
          </div>
        )}
      </section>
    </div>
  )
}

export default HomepageView
