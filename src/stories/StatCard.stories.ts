import type { Meta, StoryObj } from '@storybook/react'
import StatCard from '../components/Elements/StatCard'
import {
  BookmarkIcon,
  CubeIcon,
  StarIcon,
  ListBulletIcon,
  TrophyIcon,
  ClockIcon,
  CalendarIcon,
  FlagIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

const meta: Meta<typeof StatCard> = {
  title: 'Elements/StatCard',
  component: StatCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Clean stat cards for displaying key metrics with icons in upper left and values in upper right',
      },
    },
  },
  argTypes: {
    iconBg: {
      control: 'select',
      options: [
        'bg-blue-500',
        'bg-red-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-gray-700',
        'bg-orange-500',
        'bg-teal-500',
      ],
      description: 'Background color for the icon circle',
    },
    iconColor: {
      control: 'select',
      options: ['text-white', 'text-gray-900'],
      description: 'Text color for the icon',
    },
    Icon: {
      control: 'select',
      options: {
        BookmarkIcon: BookmarkIcon,
        CubeIcon: CubeIcon,
        StarIcon: StarIcon,
        ListBulletIcon: ListBulletIcon,
        TrophyIcon: TrophyIcon,
        ClockIcon: ClockIcon,
        CalendarIcon: CalendarIcon,
        FlagIcon: FlagIcon,
        UserGroupIcon: UserGroupIcon,
        ChartBarIcon: ChartBarIcon,
      },
      description: 'Heroicon to display',
    },
    value: {
      control: 'text',
      description: 'Main value to display',
    },
    label: {
      control: 'text',
      description: 'Label text below the value',
    },
    onClick: {
      action: 'clicked',
      description: 'Optional click handler',
    },
  },
}

export default meta
type Story = StoryObj<typeof StatCard>

export const Default: Story = {
  args: {
    iconBg: 'bg-blue-500',
    Icon: BookmarkIcon,
    iconColor: 'text-white',
    value: 42,
    label: 'Games Owned',
  },
}

export const Today: Story = {
  args: {
    iconBg: 'bg-blue-500',
    Icon: ClockIcon,
    iconColor: 'text-white',
    value: 14,
    label: 'Today',
  },
}

export const Scheduled: Story = {
  args: {
    iconBg: 'bg-red-500',
    Icon: CalendarIcon,
    iconColor: 'text-white',
    value: 15,
    label: 'Scheduled',
  },
}

export const All: Story = {
  args: {
    iconBg: 'bg-gray-700',
    Icon: CubeIcon,
    iconColor: 'text-white',
    value: 95,
    label: 'All',
  },
}

export const Flagged: Story = {
  args: {
    iconBg: 'bg-orange-500',
    Icon: FlagIcon,
    iconColor: 'text-white',
    value: 0,
    label: 'Flagged',
  },
}

export const WithInteraction: Story = {
  args: {
    iconBg: 'bg-purple-500',
    Icon: TrophyIcon,
    iconColor: 'text-white',
    value: 12,
    label: 'Awards',
    onClick: () => console.log('Card clicked!'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Clickable card with hover effects',
      },
    },
  },
}

export const LargeNumbers: Story = {
  args: {
    iconBg: 'bg-teal-500',
    Icon: UserGroupIcon,
    iconColor: 'text-white',
    value: '1.2K',
    label: 'Total Players',
  },
}

export const StringValue: Story = {
  args: {
    iconBg: 'bg-indigo-500',
    Icon: ChartBarIcon,
    iconColor: 'text-white',
    value: 'A+',
    label: 'Grade',
  },
}
