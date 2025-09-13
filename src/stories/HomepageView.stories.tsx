import type { Meta, StoryObj } from '@storybook/react'
import HomepageView, { type HomepageViewProps } from '@/components/Components/HomepageView'

const meta: Meta<typeof HomepageView> = {
  title: 'Pages/HomepageView',
  component: HomepageView,
  parameters: {
    layout: 'fullscreen',
  },
}
export default meta

type Story = StoryObj<typeof HomepageView>

const sampleGames: any[] = Array.from({ length: 3 }).map((_, i) => ({
  id: `game-${i}`,
  bgg_id: 1000 + i,
  name: ['Cascadia', 'Wingspan', 'Gloomhaven'][i] || `Game ${i + 1}`,
  year_published: 2021,
  image_url: null,
  thumbnail_url: null,
  categories: ['Strategy'],
  mechanics: ['Drafting'],
  min_players: 1,
  max_players: 4,
  min_playtime: 30,
  max_playtime: 60,
  complexity: 2.4,
  description: 'Sample game description',
  publisher: 'Sample Publisher',
  designer: 'Sample Designer',
  ranking_value: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}))

const baseArgs: HomepageViewProps = {
  user: null,
  loading: false,
  featuredGames: sampleGames,
  userStats: null,
  industryAwards: [
    { id: 'a1', name: 'Best Strategy Game', year: 2025, winner_game_name: 'Gloomhaven' },
    { id: 'a2', name: 'Family Game of the Year', year: 2025, winner_game_name: 'Wingspan' },
    { id: 'a3', name: 'Best Solo Experience', year: 2025 },
  ],
  publicLists: [
    { id: 'l1', name: 'Top Lightweight Euros', description: 'Fast teach euro style games', games_count: 12, updated_at: new Date().toISOString() },
    { id: 'l2', name: 'Cozy Autumn Picks', description: 'Warm thematic games for fall', games_count: 8, updated_at: new Date().toISOString() },
    { id: 'l3', name: 'Solo Night Rotation', games_count: 5, updated_at: new Date().toISOString() },
  ],
}

export const Guest: Story = {
  args: baseArgs,
}

export const GuestLoading: Story = {
  args: { ...baseArgs, loading: true, featuredGames: [] },
}

export const Authenticated: Story = {
  args: {
    ...baseArgs,
    user: { id: 'user-1' },
    userStats: {
      totalPlays: 42,
      uniqueGames: 18,
      avgRating: 7.6,
      ratingsTimeline: [
        { date: '2025-01-01', avgRating: 7.5, count: 2 },
        { date: '2025-02-10', avgRating: 8.0, count: 3 },
      ],
      recentTags: [
        { tag: 'cooperative', count: 5 },
        { tag: 'engine-building', count: 3 },
      ],
    },
  },
}

export const AuthLoading: Story = {
  args: {
    ...baseArgs,
    user: { id: 'user-1' },
    loading: true,
    featuredGames: [],
  },
}
