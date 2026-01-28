import type { Meta, StoryObj } from '@storybook/react'
import ZeroState from './ZeroState'
import {
  StarIcon,
  HeartIcon,
  BookmarkIcon,
  ListBulletIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline'

const meta = {
  title: 'Components/ZeroState',
  component: ZeroState,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Empty state component used across the app when there are no items to display. Used in Rankings, Library, Wishlist, Lists, and Awards pages.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      description: 'Optional icon to display at the top',
      control: { type: 'select' },
      options: ['StarIcon', 'HeartIcon', 'BookmarkIcon', 'ListBulletIcon', 'TrophyIcon', 'None'],
      mapping: {
        StarIcon: <StarIcon className="w-8 h-8 text-gray-400" />,
        HeartIcon: <HeartIcon className="w-8 h-8 text-gray-400" />,
        BookmarkIcon: <BookmarkIcon className="w-8 h-8 text-gray-400" />,
        ListBulletIcon: <ListBulletIcon className="w-8 h-8 text-gray-400" />,
        TrophyIcon: <TrophyIcon className="w-8 h-8 text-gray-400" />,
        None: undefined,
      },
    },
    variant: {
      control: { type: 'radio' },
      options: ['default', 'compact'],
    },
  },
} satisfies Meta<typeof ZeroState>

export default meta
type Story = StoryObj<typeof meta>

// Default empty rankings page
export const Rankings: Story = {
  args: {
    icon: <StarIcon className="w-8 h-8 text-gray-400" />,
    title: 'No rankings yet',
    description: "You haven't rated any games yet. Start by browsing games and giving them a rating from 1-10.",
    action: {
      label: 'Browse Games',
      href: '/games',
    },
  },
}

// Empty wishlist
export const Wishlist: Story = {
  args: {
    icon: <HeartIcon className="w-8 h-8 text-gray-400" />,
    title: 'Your wishlist is empty',
    description: 'Add games to your wishlist by clicking the heart icon on any game.',
    action: {
      label: 'Explore Games',
      href: '/games',
    },
  },
}

// Empty library
export const Library: Story = {
  args: {
    icon: <BookmarkIcon className="w-8 h-8 text-gray-400" />,
    title: 'Your library is empty',
    description: 'Add games to your library by bookmarking them. You can import your collection from BoardGameGeek.',
    action: {
      label: 'Import Collection',
      href: '/import',
    },
  },
}

// Empty custom lists
export const CustomLists: Story = {
  args: {
    icon: <ListBulletIcon className="w-8 h-8 text-gray-400" />,
    title: 'No custom lists yet',
    description: 'Create curated collections of your favorite games, party picks, or anything else you want to organize.',
    action: {
      label: 'Create Your First List',
      onClick: () => alert('Create list modal would open'),
    },
  },
}

// Empty awards
export const Awards: Story = {
  args: {
    icon: <TrophyIcon className="w-8 h-8 text-gray-400" />,
    title: 'No personal awards yet',
    description: 'Your personalized awards will be generated based on your game ratings and play history.',
    action: {
      label: 'Rate Some Games',
      href: '/games',
    },
  },
}

// Compact variant
export const Compact: Story = {
  args: {
    icon: <StarIcon className="w-6 h-6 text-gray-400" />,
    title: 'No results found',
    description: 'Try adjusting your filters or search terms.',
    variant: 'compact',
  },
}

// No icon variant
export const NoIcon: Story = {
  args: {
    title: 'Nothing here yet',
    description: 'Get started by adding your first item.',
    action: {
      label: 'Get Started',
      onClick: () => alert('Action clicked'),
    },
  },
}

// No action variant
export const NoAction: Story = {
  args: {
    icon: <StarIcon className="w-8 h-8 text-gray-400" />,
    title: 'Coming soon',
    description: 'This feature is under development and will be available soon.',
  },
}
