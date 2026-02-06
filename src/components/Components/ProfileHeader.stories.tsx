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
