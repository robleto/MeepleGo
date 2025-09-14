'use client'
import Link from 'next/link'
import GameCard from '@/components/Components/GameCard'
import Heading from '@/components/Components/Heading'
import { AwardCard } from '@/components/Components/AwardCard'
import ListCard from '@/components/Components/ListCard'
import {
  TrophyIcon,
  ChartBarIcon,
  CubeIcon,
  ListBulletIcon,
  CalendarIcon,
  StarIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'
import type { Game } from '@/types/supabase'

export interface UserStats {
  totalPlays: number
  uniqueGames: number
  avgRating: number | null
  ratingsTimeline: Array<{ date: string; avgRating: number; count: number }>
  recentTags: Array<{ tag: string; count: number }>
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
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Everything You Need</h2>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Powerful tools to organize, rate, and celebrate your board game collection</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <Link key={feature.name} href={feature.href} className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${feature.color}`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">{feature.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{feature.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Get Started</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link href="/add" className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors">Add Games</Link>
            <Link href="/games" className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Browse Collection</Link>
            <Link href="/rankings" className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Start Rating</Link>
          </div>
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
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Your Gaming at a Glance</h2>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Track your progress and discover insights about your gaming habits</p>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard iconBg="bg-blue-100" Icon={PlayIcon} iconColor="text-blue-600" value={userStats?.totalPlays || 0} label="Total Plays" />
            <StatCard iconBg="bg-green-100" Icon={CubeIcon} iconColor="text-green-600" value={userStats?.uniqueGames || 0} label="Games Played" />
            <StatCard iconBg="bg-yellow-100" Icon={StarIcon} iconColor="text-yellow-600" value={userStats?.avgRating?.toFixed(1) || '—'} label="Avg Rating" />
            <StatCard iconBg="bg-purple-100" Icon={CalendarIcon} iconColor="text-purple-600" value={userStats?.ratingsTimeline?.length || 0} label="Gaming Days" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {industryAwards.slice(0, 3).map((award: any) => (
              <AwardCard
                key={award.id}
                title={award.name}
                description={award.description || "Prestigious board game recognition"}
                icon={<TrophyIcon className="h-6 w-6" />}
                circleBorderClass={award.borderColor || "border-amber-200"}
                circleBgClass={award.backgroundColor || "bg-amber-50"}
                iconColorClass={award.iconColor || "text-amber-600"}
                href={`/awards#${award.id}`}
                cta="View Details"
              />
            ))}
          </div>
        </section>
      )}

      {/* Public Lists Preview - Always show section for debugging */}
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
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Your Gaming Toolkit</h2>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Everything you need to manage and celebrate your board game collection</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <Link key={feature.name} href={feature.href} className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              <div className="flex items-center space-x-4">
                <div className={`flex-shrink-0 p-3 rounded-lg ${feature.color}`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">{feature.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{feature.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/add" className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors">Add New Game</Link>
          <Link href="/rankings" className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Rate Games</Link>
          <Link href="/awards" className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Create Awards</Link>
        </div>
      </section>
    </div>
  )
}

interface StatCardProps {
  iconBg: string
  Icon: any
  iconColor: string
  value: string | number
  label: string
}
function StatCard({ iconBg, Icon, iconColor, value, label }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
      <div className={`flex items-center justify-center w-8 h-8 ${iconBg} rounded-lg mx-auto mb-2`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
    </div>
  )
}

export default HomepageView
