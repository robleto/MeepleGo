import PageLayout from '@/components/PageLayout'
import Link from 'next/link'
import {
  TrophyIcon,
  ChartBarIcon,
  CubeIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Awards',
    description: 'Create and manage your yearly awards. Nominate and pick winners for categories like Best Game, Best Strategy Game, and more.',
    href: '/awards',
    icon: TrophyIcon,
    color: 'bg-yellow-500',
  },
  {
    name: 'Rankings',
    description: 'Rate your games from 1-10 and track which ones you\'ve played. Build your personal ranking system.',
    href: '/rankings',
    icon: ChartBarIcon,
    color: 'bg-blue-500',
  },
  {
    name: 'Games',
    description: 'Browse your game collection with detailed information, ratings, and quick actions.',
    href: '/games',
    icon: CubeIcon,
    color: 'bg-green-500',
  },
  {
    name: 'Lists',
    description: 'Create custom lists like "Top 10 Party Games" or "Games to Play With Family" and organize your collection.',
    href: '/lists',
    icon: ListBulletIcon,
    color: 'bg-purple-500',
  },
]

const stats = [
  { label: 'Games in Collection', value: '0' },
  { label: 'Games Played', value: '0' },
  { label: 'Average Rating', value: '—' },
  { label: 'Lists Created', value: '0' },
]

export default function HomePage() {
  return (
    <PageLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Welcome to MeepleGo
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Your personal board game collection manager. Track, rate, and organize 
            your games with powerful tools for awards, rankings, and custom lists.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <Link
              key={feature.name}
              href={feature.href}
              className="group relative bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-center space-x-4">
                <div className={`flex-shrink-0 p-3 rounded-lg ${feature.color}`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">
                    {feature.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/add"
              className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              Add New Game
            </Link>
            <Link
              href="/rankings"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Rate Games
            </Link>
            <Link
              href="/lists"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Create List
            </Link>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-primary-50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-primary-900 mb-2">Getting Started</h2>
          <p className="text-primary-700 mb-4">
            Welcome to MeepleGo! To get started, add some games to your collection and begin rating them.
          </p>
          <div className="space-y-2 text-sm text-primary-600">
            <div>1. Add games using the + button or from the Add page</div>
            <div>2. Rate games you\'ve played on the Rankings page</div>
            <div>3. Create custom lists to organize your collection</div>
            <div>4. Set up yearly awards to celebrate your favorite games</div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
