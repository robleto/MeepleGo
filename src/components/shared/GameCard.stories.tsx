import type { Meta, StoryObj } from '@storybook/react';
import GameCard from './GameCard';

// Mock Next.js router for Storybook
const mockRouter = {
  push: () => Promise.resolve(true),
  replace: () => Promise.resolve(true),
  prefetch: () => Promise.resolve(),
  back: () => {},
  forward: () => {},
  refresh: () => {},
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  events: { on: () => {}, off: () => {}, emit: () => {} }
};

// Create a wrapper that mocks the router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => {
  // This will prevent the useRouter hook from being called in Storybook
  return <div suppressHydrationWarning>{children}</div>;
};

const mockGame = {
  id: '1',
  bgg_id: 12345,
  name: 'Wingspan',
  year_published: 2019,
  image_url: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__itemrep@2x/img/veohwKEtFpERbDq7xGMggHqLKX8=/fit-in/492x600/filters:strip_icc()/pic4458123.jpg',
  thumbnail_url: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__itemrep@2x/img/veohwKEtFpERbDq7xGMggHqLKX8=/fit-in/492x600/filters:strip_icc()/pic4458123.jpg',
  categories: ['Card Game'],
  mechanics: ['Engine Building'],
  publisher: 'Stonemaier Games',
  designer: 'Elizabeth Hargrave',
  description: 'A relaxing bird collection game.',
  min_players: 1,
  max_players: 5,
  playtime_minutes: 70,
  honors: [
    { category: 'Winner', result_raw: 'Winner', result_category: 'Winner', derived_result: 'Winner' },
  ],
  ranking: { id: 'r1', user_id: null, game_id: '1', played_it: true, ranking: 8, notes: null, public_note: null, private_note: null, created_at: null, imported_from: null, updated_at: null },
  list_membership: { library: true, wishlist: false },
  tagline: 'A beautiful, relaxing bird collection game',
  created_at: '',
  updated_at: '',
  summary: 'A relaxing bird game',
  rank: 1,
  rating: 8.0,
  num_ratings: 10000,
  cached_at: '',
};

const wishlistGame = {
  ...mockGame,
  list_membership: { library: false, wishlist: true },
  ranking: { ...mockGame.ranking, played_it: false },
};

const playedGame = {
  ...mockGame,
  ranking: { ...mockGame.ranking, played_it: true },
};

const winnerGame = {
  ...mockGame,
  honors: [
    { category: 'Winner', result_raw: 'Winner', result_category: 'Winner', derived_result: 'Winner' },
  ],
};

const unratedGame = {
  ...mockGame,
  ranking: { ...mockGame.ranking, ranking: null, played_it: false },
};

const meta: Meta<typeof GameCard> = {
  // Nest GameCard under Components hierarchy (removed top-level exposure)
  title: 'Archived/GameCard/Grid View',
  component: GameCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <RouterWrapper>
        <Story />
      </RouterWrapper>
    ),
  ],
  argTypes: {
    viewMode: { control: 'select', options: ['grid', 'list'] },
    hideWinnerBadge: { control: 'boolean' },
    showSummary: { control: 'boolean' },
    emphasizeMeta: { control: 'boolean' },
    showMeta: { control: 'boolean' },
    allowWinnerBadgeInListView: { control: 'boolean' },
    variant: { control: 'select', options: ['detailed', 'balanced', 'compact'] },
    listRank: { control: 'number' }
  },
  parameters: {
    layout: 'padded',
    nextjs: {
      appDirectory: true,
    },
    viewport: {
      defaultViewport: 'responsive',
    },
  },
};

export default meta;

type Story = StoryObj<typeof GameCard>;

// Removed granular overlay demo stories (rating chip, bookmark, played status, winner badge)
// to keep Storybook concise. Those concepts are covered in the States Showcase.

// ========================================
// GAMECARD LAYOUT STORIES
// ========================================

// These stories focus on the GameCard layouts (grid vs list) rather than states

export const GridLayout: Story = {
  name: 'Grid/Layout',
  args: {
    game: mockGame,
    viewMode: 'grid',
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
};

// ========================================
// DENSITY VARIATIONS
// ========================================

// These stories focus on the three information density levels for GameCard

export const DensityDetailed: Story = {
  name: 'Grid/Density Detailed',
  args: {
    game: mockGame,
    viewMode: 'grid',
    variant: 'detailed',
    showSummary: true,
    showMeta: true,
    emphasizeMeta: true,
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
};

export const DensityBalanced: Story = {
  name: 'Grid/Density Balanced',
  args: {
    game: mockGame,
    viewMode: 'grid',
    variant: 'balanced',
    showSummary: false,
    showMeta: true,
    emphasizeMeta: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
};

export const DensityCompact: Story = {
  name: 'Grid/Density Compact',
  args: {
    game: mockGame,
    viewMode: 'grid',
    variant: 'compact',
    showSummary: false,
    showMeta: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
};

export const DensityComparison: Story = {
  name: 'Grid/Density All Variants',
  render: () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Density Comparison</h3>
        <p className="text-sm text-gray-600">Three information density levels for different use cases</p>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <GameCard 
              game={mockGame} 
              viewMode="grid" 
              variant="detailed"
              showSummary={true}
              showMeta={true}
              emphasizeMeta={true}
            />
            <div className="text-center">
              <div className="text-sm font-medium">Rich Detail</div>
              <div className="text-xs text-gray-500">Summary + emphasized metadata</div>
            </div>
          </div>

          <div className="space-y-2">
            <GameCard 
              game={mockGame} 
              viewMode="grid" 
              variant="balanced"
              showSummary={false}
              showMeta={true}
              emphasizeMeta={false}
            />
            <div className="text-center">
              <div className="text-sm font-medium">Balanced</div>
              <div className="text-xs text-gray-500">Basic metadata shown</div>
            </div>
          </div>

          <div className="space-y-2">
            <GameCard 
              game={mockGame} 
              viewMode="grid" 
              variant="compact"
              showSummary={false}
              showMeta={false}
            />
            <div className="text-center">
              <div className="text-sm font-medium">Compact</div>
              <div className="text-xs text-gray-500">Title + year only</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ========================================
// COLLECTION VIEWS
// ========================================

// These stories show multiple GameCards together to demonstrate layout patterns

export const GridCollection: Story = {
  name: 'Grid/Collection Example',
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <GameCard game={mockGame} viewMode="grid" />
      <GameCard game={wishlistGame} viewMode="grid" />
      <GameCard game={winnerGame} viewMode="grid" />
      <GameCard game={unratedGame} viewMode="grid" />
    </div>
  ),
};

export const StatesShowcase: Story = {
  name: 'Grid/States Showcase',
  render: () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Overlay States (Balanced Density)</h3>
        <p className="text-sm text-gray-600">Different overlay combinations at standard density</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <GameCard game={mockGame} viewMode="grid" variant="balanced" showMeta={true} />
            <div className="text-center text-xs text-gray-600">Rated + Library</div>
          </div>
          <div className="space-y-2">
            <GameCard game={wishlistGame} viewMode="grid" variant="balanced" showMeta={true} />
            <div className="text-center text-xs text-gray-600">Wishlist</div>
          </div>
          <div className="space-y-2">
            <GameCard game={winnerGame} viewMode="grid" variant="balanced" showMeta={true} />
            <div className="text-center text-xs text-gray-600">Award Winner</div>
          </div>
          <div className="space-y-2">
            <GameCard game={unratedGame} viewMode="grid" variant="balanced" showMeta={true} />
            <div className="text-center text-xs text-gray-600">Unrated</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Compact Density with Overlays</h3>
        <p className="text-sm text-gray-600">How overlays work at compact density level</p>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="space-y-1">
            <GameCard game={mockGame} viewMode="grid" variant="compact" showMeta={false} />
            <div className="text-center text-xs text-gray-600">Rated</div>
          </div>
          <div className="space-y-1">
            <GameCard game={wishlistGame} viewMode="grid" variant="compact" showMeta={false} />
            <div className="text-center text-xs text-gray-600">Wishlist</div>
          </div>
          <div className="space-y-1">
            <GameCard game={winnerGame} viewMode="grid" variant="compact" showMeta={false} />
            <div className="text-center text-xs text-gray-600">Winner</div>
          </div>
          <div className="space-y-1">
            <GameCard game={unratedGame} viewMode="grid" variant="compact" showMeta={false} />
            <div className="text-center text-xs text-gray-600">Unrated</div>
          </div>
        </div>
      </div>
    </div>
  ),
};
