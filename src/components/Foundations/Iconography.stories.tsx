import type { Meta, StoryObj } from '@storybook/react'
import { 
  PlayIcon, 
  BookOpenIcon, 
  HeartIcon, 
  ListBulletIcon, 
  CubeIcon, 
  TrophyIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  Squares2X2Icon,
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  StarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { IconCircle } from '../Elements/IconCircle'

const meta: Meta = {
  title: 'Foundations/Iconography',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'MeepleGo standard iconography system using Heroicons. Consistent icons for all core concepts.',
      },
    },
  },
}
export default meta
type Story = StoryObj

const IconShowcase = ({ 
  title, 
  icons 
}: { 
  title: string
  icons: Array<{ name: string; icon: React.ReactNode; usage: string; color?: string }>
}) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {icons.map(({ name, icon, usage, color = 'text-gray-600' }) => (
        <div key={name} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className={`${color}`}>
              {icon}
            </div>
            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {name}
            </code>
          </div>
          <p className="text-xs text-gray-500">{usage}</p>
        </div>
      ))}
    </div>
  </div>
)

export const IconographySystem: Story = {
  render: () => (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">MeepleGo Iconography System</h1>
        <p className="text-gray-600">
          Consistent icon usage across all components using Heroicons (24/outline).
        </p>
      </div>

      <IconShowcase
        title="Core Actions & States"
        icons={[
          {
            name: 'PlayIcon',
            icon: <PlayIcon className="h-5 w-5" />,
            usage: 'Played status, game logs',
            color: 'text-blue-600'
          },
          {
            name: 'BookOpenIcon',
            icon: <BookOpenIcon className="h-5 w-5" />,
            usage: 'Library/Collection membership',
            color: 'text-green-600'
          },
          {
            name: 'HeartIcon',
            icon: <HeartIcon className="h-5 w-5" />,
            usage: 'Wishlist membership',
            color: 'text-pink-500'
          },
          {
            name: 'ListBulletIcon',
            icon: <ListBulletIcon className="h-5 w-5" />,
            usage: 'Custom lists, list management',
            color: 'text-gray-600'
          },
          {
            name: 'CubeIcon',
            icon: <CubeIcon className="h-5 w-5" />,
            usage: 'Games section, game references',
            color: 'text-indigo-600'
          },
          {
            name: 'TrophyIcon',
            icon: <TrophyIcon className="h-5 w-5" />,
            usage: 'Awards, winners, achievements',
            color: 'text-amber-500'
          }
        ]}
      />

      <IconShowcase
        title="Navigation & UI"
        icons={[
          {
            name: 'BookmarkIcon',
            icon: <BookmarkIcon className="h-5 w-5" />,
            usage: 'Collection management indicator',
            color: 'text-gray-600'
          },
          {
            name: 'MagnifyingGlassIcon',
            icon: <MagnifyingGlassIcon className="h-5 w-5" />,
            usage: 'Search functionality',
            color: 'text-gray-600'
          },
          {
            name: 'FunnelIcon',
            icon: <FunnelIcon className="h-5 w-5" />,
            usage: 'Filtering options',
            color: 'text-gray-600'
          },
          {
            name: 'XMarkIcon',
            icon: <XMarkIcon className="h-5 w-5" />,
            usage: 'Modal close, cancel actions',
            color: 'text-gray-600'
          },
          {
            name: 'Squares2X2Icon',
            icon: <Squares2X2Icon className="h-5 w-5" />,
            usage: 'Grid view toggle',
            color: 'text-gray-600'
          }
        ]}
      />

      <IconShowcase
        title="Metadata & Information"
        icons={[
          {
            name: 'UserGroupIcon',
            icon: <UserGroupIcon className="h-5 w-5" />,
            usage: 'Player count information',
            color: 'text-gray-600'
          },
          {
            name: 'ClockIcon',
            icon: <ClockIcon className="h-5 w-5" />,
            usage: 'Playing time information',
            color: 'text-gray-600'
          },
          {
            name: 'CalendarIcon',
            icon: <CalendarIcon className="h-5 w-5" />,
            usage: 'Publication year, dates',
            color: 'text-gray-600'
          },
          {
            name: 'StarIcon',
            icon: <StarIcon className="h-5 w-5" />,
            usage: 'Award nominees, favorites',
            color: 'text-yellow-500'
          },
          {
            name: 'ArrowPathIcon',
            icon: <ArrowPathIcon className="h-5 w-5" />,
            usage: 'Loading states, refresh',
            color: 'text-gray-600'
          }
        ]}
      />

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Size Standards</h4>
        <div className="flex items-center gap-6 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-3 w-3" />
            <code>h-3 w-3</code> - Small (12px)
          </div>
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-4 w-4" />
            <code>h-4 w-4</code> - Medium (16px)
          </div>
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-5 w-5" />
            <code>h-5 w-5</code> - Large (20px)
          </div>
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-6 w-6" />
            <code>h-6 w-6</code> - XL (24px)
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-green-50 rounded-lg">
        <h4 className="font-semibold text-green-900 mb-2">Color Associations</h4>
        <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="h-4 w-4 text-green-600" />
            <span>Green: Library/Collection</span>
          </div>
          <div className="flex items-center gap-2">
            <HeartIcon className="h-4 w-4 text-pink-500" />
            <span>Pink: Wishlist</span>
          </div>
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-4 w-4 text-amber-500" />
            <span>Amber: Awards/Winners</span>
          </div>
          <div className="flex items-center gap-2">
            <PlayIcon className="h-4 w-4 text-blue-600" />
            <span>Blue: Played Status</span>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const InContext: Story = {
  render: () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Icons in Context</h2>
      
      {/* Game Card Example */}
      <div className="bg-white rounded-lg shadow p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Wingspan</h3>
          <BookmarkIcon className="h-4 w-4 text-green-600" />
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <PlayIcon className="h-3 w-3 text-blue-600" />
            <span className="text-green-600">Played</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <UserGroupIcon className="h-4 w-4" />
              <span>1–5 players</span>
            </div>
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              <span>70 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Example */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-3">Navigation</h4>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-gray-700">
            <CubeIcon className="h-5 w-5" />
            <span>Games</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <TrophyIcon className="h-5 w-5" />
            <span>Awards</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <ListBulletIcon className="h-5 w-5" />
            <span>Lists</span>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const IconCircles: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">IconCircle Component</h3>
        <p className="text-gray-600 mb-6">
          The IconCircle component provides consistent circular backgrounds for icons, 
          used prominently in AwardCard components and other featured elements.
        </p>
      </div>

      {/* Sizes */}
      <div>
        <h4 className="font-medium mb-3">Sizes</h4>
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <IconCircle size="sm" tone="amber">
              <TrophyIcon className="w-5 h-5" />
            </IconCircle>
            <p className="text-xs mt-2">Small</p>
          </div>
          <div className="text-center">
            <IconCircle size="md" tone="amber">
              <TrophyIcon className="w-6 h-6" />
            </IconCircle>
            <p className="text-xs mt-2">Medium</p>
          </div>
          <div className="text-center">
            <IconCircle size="lg" tone="amber">
              <TrophyIcon className="w-8 h-8" />
            </IconCircle>
            <p className="text-xs mt-2">Large</p>
          </div>
        </div>
      </div>

      {/* Color Tones */}
      <div>
        <h4 className="font-medium mb-3">Color Tones</h4>
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <IconCircle size="md" tone="amber">
              <TrophyIcon className="w-6 h-6" />
            </IconCircle>
            <p className="text-xs mt-2">Amber</p>
          </div>
          <div className="text-center">
            <IconCircle size="md" tone="primary">
              <StarIcon className="w-6 h-6" />
            </IconCircle>
            <p className="text-xs mt-2">Primary</p>
          </div>
          <div className="text-center">
            <IconCircle size="md" tone="emerald">
              <HeartIcon className="w-6 h-6" />
            </IconCircle>
            <p className="text-xs mt-2">Emerald</p>
          </div>
          <div className="text-center">
            <IconCircle size="md" tone="pink">
              <BookmarkIcon className="w-6 h-6" />
            </IconCircle>
            <p className="text-xs mt-2">Pink</p>
          </div>
          <div className="text-center">
            <IconCircle size="md" tone="sky">
              <CubeIcon className="w-6 h-6" />
            </IconCircle>
            <p className="text-xs mt-2">Sky</p>
          </div>
        </div>
      </div>

      {/* Award Card Example */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-3">Used in Award Cards</h4>
        <div className="flex justify-center">
          <IconCircle size="lg" tone="amber" className="!h-16 !w-16">
            <TrophyIcon className="w-8 h-8" />
          </IconCircle>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Large amber IconCircle as featured in AwardCard components
        </p>
      </div>
    </div>
  ),
}
