import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import ProfileHeader from './ProfileHeader'

const meta: Meta<typeof ProfileHeader> = {
  title: 'Components/ProfileHeader',
  component: ProfileHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    nextjs: { appDirectory: true },
  },
}

export default meta
type Story = StoryObj<typeof ProfileHeader>

export const WithBanner: Story = {
  args: {
    profile: {
      username: 'rob',
      full_name: 'Rob Leto',
      avatar_url: null,
      bio: 'Board game collector, designer, and enthusiast.',
      banner_url:
        'https://images.unsplash.com/photo-1519682577862-22b62b24e493?q=80&w=1600&auto=format&fit=crop',
    },
    stats: {
      gamesOwned: 194,
      gamesPlayed: 416,
      listsCreated: 3,
    },
    isOwnProfile: true,
    showBanner: true,
  },
}

export const NoBanner: Story = {
  args: {
    profile: {
      username: 'rob',
      full_name: 'Rob Leto',
      avatar_url: null,
      bio: 'Board game collector, designer, and enthusiast.',
      banner_url: null,
    },
    stats: {
      gamesOwned: 194,
      gamesPlayed: 416,
      listsCreated: 3,
    },
    isOwnProfile: false,
    showBanner: false,
  },
}

export const WithAvatar: Story = {
  args: {
    profile: {
      username: 'robleto',
      full_name: 'Greg Robleto',
      avatar_url: 'https://i.pravatar.cc/300?img=12',
      bio: null,
      banner_url: null,
    },
    stats: {
      gamesOwned: 417,
      gamesPlayed: 194,
      listsCreated: 4,
    },
    isOwnProfile: true,
    showBanner: false,
  },
}

export const OtherProfile: Story = {
  args: {
    profile: {
      username: 'meeple_fan',
      full_name: 'Meeple Fan',
      avatar_url: null,
      bio: 'I love Catan and Wingspan!',
      banner_url: null,
    },
    stats: {
      gamesOwned: 52,
      gamesPlayed: 88,
      listsCreated: 1,
    },
    isOwnProfile: false,
    showBanner: false,
  },
}
