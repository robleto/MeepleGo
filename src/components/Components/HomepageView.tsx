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
} from '@heroicons/react/24/outline'
import type { Game } from '@/types/supabase'

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

export function HomepageView({ user, loading, featuredGames, userStats, industryAwards = [], publicLists = [], bggMostPlayed = [], bggHotness = [], bggBestsellers = [], bggListIds = {} }: HomepageViewProps) {
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
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Heading as="h2" size="lg" className="text-gray-900 dark:text-white">Trending Games</Heading>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Discover what's popular in the board game community</p>
            </div>
            <Link href={bggListIds.trendingplays ? `/lists/${bggListIds.trendingplays}` : "/games"} className="text-primary-600 hover:text-primary-500 font-medium">View all →</Link>
          </div>
          {loading ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-48 h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
              {featuredGames.map((game) => (
                <div key={game.id} className="flex-shrink-0 w-48">
                  <GameCard 
                    game={game as any} 
                    viewMode="grid" 
                    variant="balanced"
                    className="h-full flex flex-col"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* BGG Hotness */}
        {bggHotness.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Heading as="h2" size="lg" className="text-gray-900 dark:text-white">BGG Hotness</Heading>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">What's trending hot on BoardGameGeek right now</p>
              </div>
              <Link href={bggListIds.hotness ? `/lists/${bggListIds.hotness}` : "/lists"} className="text-primary-600 hover:text-primary-500 font-medium">View all →</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
              {bggHotness.map((game) => (
                <div key={game.id} className="flex-shrink-0 w-48">
                  <GameCard 
                    game={game as any} 
                    viewMode="grid" 
                    variant="balanced"
                    className="h-full flex flex-col"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BGG Most Played */}
        {bggMostPlayed.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Heading as="h2" size="lg" className="text-gray-900 dark:text-white">BGG Most Played</Heading>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Games getting the most plays right now</p>
              </div>
              <Link href={bggListIds.mostplayed ? `/lists/${bggListIds.mostplayed}` : "/lists"} className="text-primary-600 hover:text-primary-500 font-medium">View all →</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
              {bggMostPlayed.map((game) => (
                <div key={game.id} className="flex-shrink-0 w-48">
                  <GameCard 
                    game={game as any} 
                    viewMode="grid" 
                    variant="balanced"
                    className="h-full flex flex-col"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BGG Bestsellers */}
        {bggBestsellers.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Heading as="h2" size="lg" className="text-gray-900 dark:text-white">BGG Bestsellers</Heading>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Top-selling games on BoardGameGeek</p>
              </div>
              <Link href={bggListIds.bestsellers ? `/lists/${bggListIds.bestsellers}` : "/lists"} className="text-primary-600 hover:text-primary-500 font-medium">View all →</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
              {bggBestsellers.map((game) => (
                <div key={game.id} className="flex-shrink-0 w-48">
                  <GameCard 
                    game={game as any} 
                    viewMode="grid" 
                    variant="balanced"
                    className="h-full flex flex-col"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Industry Awards */}
        {industryAwards.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Heading as="h2" size="lg" className="text-gray-900 dark:text-white">Industry Awards</Heading>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Prestigious board game honors and recognition</p>
              </div>
              <Link href="/awards" className="text-primary-600 hover:text-primary-500 font-medium">Explore all →</Link>
            </div>
            <NetflixScrollSection itemWidth="w-72" showCount={4}>
              {industryAwards.map((award: any) => (
                <AwardCard
                  key={award.id}
                  href={`/awards#${award.id}`}
                  title={award.name}
                  description={award.description || "Prestigious board game recognition"}
                  yearSpan={undefined}
                  winners={undefined as any}
                  nominees={undefined as any}
                  total={undefined}
                  circleBorderClass={award.borderColor || "border-amber-200"}
                  circleBgClass={award.backgroundColor || "bg-amber-50"}
                  iconColorClass={award.iconColor || "text-amber-600"}
                  showStats={false}
                  cta="View Details"
                />
              ))}
            </NetflixScrollSection>
          </section>
        )}

        {/* Public Lists */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Heading as="h2" size="lg" className="text-gray-900 dark:text-white">Public Lists</Heading>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Community-curated game collections ({publicLists.length} found)</p>
            </div>
            <Link href="/lists" className="text-primary-600 hover:text-primary-500 font-medium">Browse lists →</Link>
          </div>
          {publicLists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicLists.slice(0, 3).map((list) => (
                <ListCard
                  key={list.id}
                  list={list as any}
                  isPublic={true}
                />
              ))}
            </div>
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
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Heading as="h2" size="lg" className="text-gray-900 dark:text-white">Trending Games</Heading>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Discover what's popular in the board game community</p>
          </div>
          <Link href={bggListIds.trendingplays ? `/lists/${bggListIds.trendingplays}` : "/games"} className="text-primary-600 hover:text-primary-500 font-medium">View all games →</Link>
        </div>
        {loading ? (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-48 h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
            {featuredGames.map((game) => (
              <div key={game.id} className="flex-shrink-0 w-48">
                <GameCard 
                  game={game as any} 
                  viewMode="grid" 
                  variant="balanced"
                  className="h-full flex flex-col"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* BGG Hotness */}
      {bggHotness.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Heading as="h2" size="lg" className="text-gray-900 dark:text-white">BGG Hotness</Heading>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">What's trending hot on BoardGameGeek right now</p>
            </div>
            <Link href={bggListIds.hotness ? `/lists/${bggListIds.hotness}` : "/lists"} className="text-primary-600 hover:text-primary-500 font-medium">View all →</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
            {bggHotness.map((game) => (
              <div key={game.id} className="flex-shrink-0 w-48">
                <GameCard 
                  game={game as any} 
                  viewMode="grid" 
                  variant="balanced"
                  className="h-full flex flex-col"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BGG Most Played */}
      {bggMostPlayed.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Heading as="h2" size="lg" className="text-gray-900 dark:text-white">BGG Most Played</Heading>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Games getting the most plays right now</p>
            </div>
            <Link href={bggListIds.mostplayed ? `/lists/${bggListIds.mostplayed}` : "/lists"} className="text-primary-600 hover:text-primary-500 font-medium">View all →</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
            {bggMostPlayed.map((game) => (
              <div key={game.id} className="flex-shrink-0 w-48">
                <GameCard 
                  game={game as any} 
                  viewMode="grid" 
                  variant="balanced"
                  className="h-full flex flex-col"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BGG Bestsellers */}
      {bggBestsellers.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Heading as="h2" size="lg" className="text-gray-900 dark:text-white">BGG Bestsellers</Heading>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Top-selling games on BoardGameGeek</p>
            </div>
            <Link href={bggListIds.bestsellers ? `/lists/${bggListIds.bestsellers}` : "/lists"} className="text-primary-600 hover:text-primary-500 font-medium">View all →</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
            {bggBestsellers.map((game) => (
              <div key={game.id} className="flex-shrink-0 w-48">
                <GameCard 
                  game={game as any} 
                  viewMode="grid" 
                  variant="balanced"
                  className="h-full flex flex-col"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Heading as="h2" size="lg" className="text-gray-900 dark:text-white">Your Gaming at a Glance</Heading>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Track your progress and discover insights about your gaming habits</p>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-pulse rounded-2xl h-[120px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard iconBg="bg-blue-500" Icon={BookmarkIcon} iconColor="text-white" value={userStats?.gamesOwned || 0} label="Games Owned" />
            <StatCard iconBg="bg-green-500" Icon={CubeIcon} iconColor="text-white" value={userStats?.uniqueGames || 0} label="Games Played" />
            <StatCard iconBg="bg-yellow-500" Icon={StarIcon} iconColor="text-white" value={userStats?.avgRating?.toFixed(1) || '—'} label="Avg Rating" />
            <StatCard iconBg="bg-purple-500" Icon={ListBulletIcon} iconColor="text-white" value={userStats?.listsCreated || 0} label="Lists Created" />
            <StatCard iconBg="bg-amber-500" Icon={TrophyIcon} iconColor="text-white" value={userStats?.awardsCreated || 0} label="Awards Created" />
          </div>
        )}
      </section>

      {/* Industry Awards Preview */}
      {industryAwards.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Heading as="h2" size="lg" className="text-gray-900 dark:text-white">Industry Awards</Heading>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Prestigious board game honors and recognition</p>
            </div>
            <Link href="/awards" className="text-primary-600 hover:text-primary-500 font-medium">Explore all →</Link>
          </div>
          
          {/* Netflix-style horizontal scrolling */}
          <NetflixScrollSection itemWidth="w-72" showCount={4}>
            {industryAwards.map((award: any) => (
              <AwardCard
                key={award.id}
                href={`/awards#${award.id}`}
                title={award.name}
                description={award.description || "Prestigious board game recognition"}
                yearSpan={undefined}
                winners={undefined as any}
                nominees={undefined as any}
                total={undefined}
                circleBorderClass={award.borderColor || "border-amber-200"}
                circleBgClass={award.backgroundColor || "bg-amber-50"}
                iconColorClass={award.iconColor || "text-amber-600"}
                showStats={false}
                cta="View Details"
              />
            ))}
          </NetflixScrollSection>
        </section>
      )}

      {/* Public Lists */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Heading as="h2" size="lg" className="text-gray-900 dark:text-white">Public Lists</Heading>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Community-curated game collections ({publicLists.length} found)</p>
          </div>
          <Link href="/lists" className="text-primary-600 hover:text-primary-500 font-medium">Browse lists →</Link>
        </div>
        {publicLists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicLists.slice(0, 3).map((list) => (
              <ListCard
                key={list.id}
                list={list as any}
                isPublic={true}
              />
            ))}
          </div>
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
