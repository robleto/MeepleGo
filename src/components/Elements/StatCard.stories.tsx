import type { Meta, StoryObj } from '@storybook/react'
import StatCard from './StatCard'
import {
  StarIcon,
  BookmarkIcon,
  HeartIcon,
  TrophyIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

const meta = {
  title: 'Elements/StatCard',
  component: StatCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A versatile stat card component used to display key metrics and statistics. Features an icon, large value, and descriptive label. Available in three sizes: default, compact, and mini.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'radio' },
      options: ['default', 'compact', 'mini'],
    },
    onClick: {
      action: 'clicked',
    },
  },
} satisfies Meta<typeof StatCard>

export default meta
type Story = StoryObj<typeof meta>

// Rankings count
export const Rankings: Story = {
  args: {
    iconBg: 'bg-emerald-100',
    Icon: StarIcon,
    iconColor: 'text-emerald-600',
    value: 87,
    label: 'Games Ranked',
    size: 'default',
  },
}

// Library size
export const Library: Story = {
  args: {
    iconBg: 'bg-sky-100',
    Icon: BookmarkIcon,
    iconColor: 'text-sky-600',
    value: 142,
    label: 'In Library',
    size: 'default',
  },
}

// Wishlist count
export const Wishlist: Story = {
  args: {
    iconBg: 'bg-rose-100',
    Icon: HeartIcon,
    iconColor: 'text-rose-600',
    value: 23,
    label: 'Wishlist',
    size: 'default',
  },
}

// Awards earned
export const Awards: Story = {
  args: {
    iconBg: 'bg-amber-100',
    Icon: TrophyIcon,
    iconColor: 'text-amber-600',
    value: 12,
    label: 'Awards',
    size: 'default',
  },
}

// Play time
export const PlayTime: Story = {
  args: {
    iconBg: 'bg-purple-100',
    Icon: ClockIcon,
    iconColor: 'text-purple-600',
    value: '247h',
    label: 'Total Play Time',
    size: 'default',
  },
}

// Player count
export const PlayerCount: Story = {
  args: {
    iconBg: 'bg-indigo-100',
    Icon: UserGroupIcon,
    iconColor: 'text-indigo-600',
    value: '2-4',
    label: 'Players',
    size: 'default',
  },
}

// Average rating
export const AverageRating: Story = {
  args: {
    iconBg: 'bg-teal-100',
    Icon: ChartBarIcon,
    iconColor: 'text-teal-600',
    value: '7.8',
    label: 'Avg Rating',
    size: 'default',
  },
}

// Compact size
export const CompactSize: Story = {
  args: {
    iconBg: 'bg-emerald-100',
    Icon: StarIcon,
    iconColor: 'text-emerald-600',
    value: 87,
    label: 'Games Ranked',
    size: 'compact',
  },
}

// Mini size
export const MiniSize: Story = {
  args: {
    iconBg: 'bg-sky-100',
    Icon: BookmarkIcon,
    iconColor: 'text-sky-600',
    value: 142,
    label: 'Library',
    size: 'mini',
  },
}

// Clickable variant
export const Clickable: Story = {
  args: {
    iconBg: 'bg-emerald-100',
    Icon: StarIcon,
    iconColor: 'text-emerald-600',
    value: 87,
    label: 'Games Ranked',
    size: 'default',
    onClick: () => alert('Stat card clicked!'),
  },
}

// Grid of stat cards
export const Grid = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
    <StatCard
      iconBg="bg-emerald-100"
      Icon={StarIcon}
      iconColor="text-emerald-600"
      value={87}
      label="Ranked"
    />
    <StatCard
      iconBg="bg-sky-100"
      Icon={BookmarkIcon}
      iconColor="text-sky-600"
      value={142}
      label="Library"
    />
    <StatCard
      iconBg="bg-rose-100"
      Icon={HeartIcon}
      iconColor="text-rose-600"
      value={23}
      label="Wishlist"
    />
    <StatCard
      iconBg="bg-amber-100"
      Icon={TrophyIcon}
      iconColor="text-amber-600"
      value={12}
      label="Awards"
    />
  </div>
)

// Compact grid
export const CompactGrid = () => (
  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-w-4xl">
    <StatCard
      iconBg="bg-emerald-100"
      Icon={StarIcon}
      iconColor="text-emerald-600"
      value={87}
      label="Ranked"
      size="compact"
    />
    <StatCard
      iconBg="bg-sky-100"
      Icon={BookmarkIcon}
      iconColor="text-sky-600"
      value={142}
      label="Library"
      size="compact"
    />
    <StatCard
      iconBg="bg-rose-100"
      Icon={HeartIcon}
      iconColor="text-rose-600"
      value={23}
      label="Wishlist"
      size="compact"
    />
    <StatCard
      iconBg="bg-amber-100"
      Icon={TrophyIcon}
      iconColor="text-amber-600"
      value={12}
      label="Awards"
      size="compact"
    />
    <StatCard
      iconBg="bg-purple-100"
      Icon={ClockIcon}
      iconColor="text-purple-600"
      value="247h"
      label="Played"
      size="compact"
    />
    <StatCard
      iconBg="bg-teal-100"
      Icon={ChartBarIcon}
      iconColor="text-teal-600"
      value="7.8"
      label="Avg"
      size="compact"
    />
  </div>
)
