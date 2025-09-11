import type { Meta, StoryObj } from '@storybook/react';
import GameCard from '../shared/GameCard';

// Mock Next.js router for Storybook
const RouterWrapper = ({ children }: { children: React.ReactNode }) => {
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
  id: '2',
  name: 'Gloomhaven',
  list_membership: { library: false, wishlist: true },
  ranking: { ...mockGame.ranking, played_it: false, ranking: null },
};

const winnerGame = {
  ...mockGame,
  id: '3', 
  name: 'Brass: Birmingham',
  honors: [
    { category: 'Winner', result_raw: 'Winner', result_category: 'Winner', derived_result: 'Winner' },
  ],
};

const meta: Meta<typeof GameCard> = {
  title: 'Components/GameCard',
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
    variant: { control: 'select', options: ['detailed', 'balanced', 'compact'] },
    hideWinnerBadge: { control: 'boolean' },
    showSummary: { control: 'boolean' },
    emphasizeMeta: { control: 'boolean' },
    showMeta: { control: 'boolean' },
    allowWinnerBadgeInListView: { control: 'boolean' },
    listRank: { control: 'number' }
  },
  parameters: {
    layout: 'padded',
    nextjs: {
      appDirectory: true,
    },
    docs: {
      description: {
        component: 'Versatile game card component that displays game information in both grid and list view modes with different density levels.'
      }
    }
  },
};

export default meta;
type Story = StoryObj<typeof GameCard>;

// ========================================
// GRID VIEW VARIATIONS
// ========================================

export const GridView: Story = {
  name: 'Grid View',
  args: {
    game: mockGame,
    viewMode: 'grid',
    variant: 'balanced',
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
};

export const GridViewDetailed: Story = {
  name: 'Grid View - Detailed',
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

export const GridViewCompact: Story = {
  name: 'Grid View - Compact',
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

// ========================================
// LIST VIEW VARIATIONS  
// ========================================

export const ListView: Story = {
  name: 'List View',
  args: {
    game: mockGame,
    viewMode: 'list',
    variant: 'balanced',
    listRank: 1,
  },
};

export const ListViewDetailed: Story = {
  name: 'List View - Detailed',
  args: {
    game: mockGame,
    viewMode: 'list',
    variant: 'detailed',
    listRank: 1,
  },
};

export const ListViewCompact: Story = {
  name: 'List View - Compact',
  args: {
    game: mockGame,
    viewMode: 'list',
    variant: 'compact',
    listRank: 1,
  },
};

// ========================================
// COMPARISON STORIES
// ========================================

export const GridViewComparison: Story = {
  name: 'Grid View - All Variants',
  render: () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Grid View Density Comparison</h3>
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
              <div className="text-sm font-medium">Detailed</div>
              <div className="text-xs text-gray-500">Rich information display</div>
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
              <div className="text-xs text-gray-500">Standard display</div>
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
              <div className="text-xs text-gray-500">Minimal information</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const ListViewComparison: Story = {
  name: 'List View - All Variants',
  render: () => (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">List View Density Comparison</h3>
        
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Detailed</div>
            <GameCard game={mockGame} viewMode="list" variant="detailed" listRank={1} />
          </div>
          
          <div>
            <div className="text-sm font-medium mb-2">Balanced</div>
            <GameCard game={mockGame} viewMode="list" variant="balanced" listRank={1} />
          </div>
          
          <div>
            <div className="text-sm font-medium mb-2">Compact</div>
            <GameCard game={mockGame} viewMode="list" variant="compact" listRank={1} />
          </div>
        </div>
      </div>
    </div>
  ),
};

export const GameStatesShowcase: Story = {
  name: 'Game States',
  render: () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Grid View - Different Game States</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <GameCard game={mockGame} viewMode="grid" variant="balanced" />
            <div className="text-center text-xs text-gray-600">Library + Rated</div>
          </div>
          <div className="space-y-2">
            <GameCard game={wishlistGame} viewMode="grid" variant="balanced" />
            <div className="text-center text-xs text-gray-600">Wishlist</div>
          </div>
          <div className="space-y-2">
            <GameCard game={winnerGame} viewMode="grid" variant="balanced" />
            <div className="text-center text-xs text-gray-600">Award Winner</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">List View - Different Game States</h3>
        <div className="space-y-3 max-w-4xl">
          <GameCard game={mockGame} viewMode="list" variant="balanced" listRank={1} />
          <GameCard game={wishlistGame} viewMode="list" variant="balanced" listRank={2} />
          <GameCard game={winnerGame} viewMode="list" variant="balanced" listRank={3} />
        </div>
      </div>
    </div>
  ),
};
