import type { Meta, StoryObj } from '@storybook/react'
import HomepageView, {
  type HomepageViewProps,
} from '@/components/Components/HomepageView'
import type { UserPhaseResult } from '@/lib/userPhase'

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
    {
      id: 'a1',
      name: 'Best Strategy Game',
      year: 2025,
      winner_game_name: 'Gloomhaven',
    },
    {
      id: 'a2',
      name: 'Family Game of the Year',
      year: 2025,
      winner_game_name: 'Wingspan',
    },
    { id: 'a3', name: 'Best Solo Experience', year: 2025 },
  ],
  publicLists: [
    {
      id: 'l1',
      name: 'Top Lightweight Euros',
      description: 'Fast teach euro style games',
      games_count: 12,
      updated_at: new Date().toISOString(),
    },
    {
      id: 'l2',
      name: 'Cozy Autumn Picks',
      description: 'Warm thematic games for fall',
      games_count: 8,
      updated_at: new Date().toISOString(),
    },
    {
      id: 'l3',
      name: 'Solo Night Rotation',
      games_count: 5,
      updated_at: new Date().toISOString(),
    },
  ],
}

// Phase result helpers
const phase1Result: UserPhaseResult = {
  phase: 1,
  accountAgeDays: 2,
  hasAnyData: false,
  canShowHighestRanked: false,
  canShowHotTakes: false,
  canShowSleeperHits: false,
  canShowComebackGames: false,
  canShowMostAwarded: false,
  canShowGlanceStats: false,
  canShowPublicLists: false,
  canShowQuickActions: true,
  canShowIndustryAwards: false,
  canShowExplore: false,
}

const phase2Result: UserPhaseResult = {
  phase: 2,
  accountAgeDays: 14,
  hasAnyData: true,
  canShowHighestRanked: true,
  canShowHotTakes: true,
  canShowSleeperHits: true,
  canShowComebackGames: true,
  canShowMostAwarded: false,
  canShowGlanceStats: true,
  canShowPublicLists: true,
  canShowQuickActions: true,
  canShowIndustryAwards: true,
  canShowExplore: true,
}

const phase3Result: UserPhaseResult = {
  phase: 3,
  accountAgeDays: 90,
  hasAnyData: true,
  canShowHighestRanked: true,
  canShowHotTakes: true,
  canShowSleeperHits: true,
  canShowComebackGames: true,
  canShowMostAwarded: true,
  canShowGlanceStats: true,
  canShowPublicLists: true,
  canShowQuickActions: true,
  canShowIndustryAwards: true,
  canShowExplore: true,
}

// Sample discovery data
const sampleDiscoveryGames = Array.from({ length: 5 }).map((_, i) => ({
  game_id: `disc-${i}`,
  game_name: ['Cascadia', 'Wingspan', 'Arnak', 'Azul', 'Everdell'][i],
  game_thumbnail_url: null,
  game_year_published: 2020 + i,
  game_rating: 7.5 + i * 0.3,
  user_ranking: 8 + (i % 3),
  plays_12mo: i + 1,
  last_played: '2025-06-01',
  game_num_ratings: 500 + i * 100,
  bgg_rating: 7.2 + i * 0.2,
  delta: 1.5 - i * 0.5,
  abs_delta: Math.abs(1.5 - i * 0.5),
  hot_take_type: i < 3 ? ('loved_more' as const) : ('liked_less' as const),
  total_points: 10 - i,
  award_count: 3 - (i % 3),
  most_recent_award: 'Best Game',
  months_played_12mo: 6 + i,
  total_plays_12mo: 10 + i * 3,
  consistency_score: 0.8 - i * 0.05,
  last_play_month: '2025-06',
}))

export const Guest: Story = {
  args: baseArgs,
}

export const GuestLoading: Story = {
  args: { ...baseArgs, loading: true, featuredGames: [] },
}

export const Phase1NewUser: Story = {
  name: 'Phase 1 — New User (no data)',
  args: {
    ...baseArgs,
    user: { id: 'user-1' },
    phaseResult: phase1Result,
    userStats: {
      totalPlays: 0,
      uniqueGames: 0,
      gamesOwned: 0,
      avgRating: null,
      ratingsTimeline: [],
      recentTags: [],
      listsCreated: 0,
      awardsCreated: 0,
    },
  },
}

export const Phase1WithSomeData: Story = {
  name: 'Phase 1 — New User (a few ratings)',
  args: {
    ...baseArgs,
    user: { id: 'user-1' },
    phaseResult: {
      ...phase1Result,
      hasAnyData: true,
      canShowHighestRanked: true,
      canShowHotTakes: true,
    },
    userStats: {
      totalPlays: 2,
      uniqueGames: 3,
      gamesOwned: 0,
      avgRating: 7.5,
      ratingsTimeline: [],
      recentTags: [],
      listsCreated: 0,
      awardsCreated: 0,
    },
    discoveryLists: {
      mostAwarded: [],
      highestRanked: sampleDiscoveryGames.slice(0, 3),
      sleeperHits: [],
      hotTakes: sampleDiscoveryGames.slice(0, 2),
      comebackGames: [],
    },
  },
}

export const Phase2Returning: Story = {
  name: 'Phase 2 — Returning User',
  args: {
    ...baseArgs,
    user: { id: 'user-1' },
    phaseResult: phase2Result,
    userStats: {
      totalPlays: 42,
      uniqueGames: 18,
      gamesOwned: 12,
      avgRating: 7.6,
      ratingsTimeline: [
        { date: '2025-01-01', avgRating: 7.5, count: 2 },
        { date: '2025-02-10', avgRating: 8.0, count: 3 },
      ],
      recentTags: [
        { tag: 'cooperative', count: 5 },
        { tag: 'engine-building', count: 3 },
      ],
      listsCreated: 3,
      awardsCreated: 0,
    },
    discoveryLists: {
      mostAwarded: [],
      highestRanked: sampleDiscoveryGames,
      sleeperHits: sampleDiscoveryGames.slice(0, 3),
      hotTakes: sampleDiscoveryGames.slice(0, 4),
      comebackGames: sampleDiscoveryGames.slice(0, 2),
    },
  },
}

export const Phase3Power: Story = {
  name: 'Phase 3 — Power User',
  args: {
    ...baseArgs,
    user: { id: 'user-1' },
    phaseResult: phase3Result,
    userStats: {
      totalPlays: 120,
      uniqueGames: 45,
      gamesOwned: 30,
      avgRating: 7.8,
      ratingsTimeline: [
        { date: '2025-01-01', avgRating: 7.5, count: 5 },
        { date: '2025-02-10', avgRating: 8.0, count: 8 },
      ],
      recentTags: [
        { tag: 'cooperative', count: 12 },
        { tag: 'engine-building', count: 8 },
      ],
      listsCreated: 5,
      awardsCreated: 3,
    },
    discoveryLists: {
      mostAwarded: sampleDiscoveryGames.slice(0, 3),
      highestRanked: sampleDiscoveryGames,
      sleeperHits: sampleDiscoveryGames.slice(0, 4),
      hotTakes: sampleDiscoveryGames,
      comebackGames: sampleDiscoveryGames.slice(0, 3),
    },
  },
}

export const AuthLoading: Story = {
  args: {
    ...baseArgs,
    user: { id: 'user-1' },
    loading: true,
    featuredGames: [],
    phaseResult: phase2Result,
  },
}
