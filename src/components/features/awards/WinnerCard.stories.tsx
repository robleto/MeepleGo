import type { Meta, StoryObj } from '@storybook/react';
import WinnerCard from './WinnerCard';
import type { GameWithRanking } from '@/types';

const meta = {
  title: 'Components/Features/Awards/WinnerCard',
  component: WinnerCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Displays the winning game in an award category with trophy icon and prominence.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WinnerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock winner game
const mockWinner: GameWithRanking = {
  id: '1',
  name: 'Wingspan',
  image_url: 'https://via.placeholder.com/150x150?text=Wingspan',
  bgg_id: 266192,
  year_published: 2019,
  min_players: 1,
  max_players: 5,
  playtime_minutes: 70,
  publisher: 'Stonemaier Games',
  description: 'Build bird habitats and collect birds in this beautiful engine-building game.',
  categories: ['Animals', 'Card Game'],
  mechanics: ['Engine Building', 'Card Drafting'],
  rank: 1,
  rating: 8.2,
  num_ratings: 15000,
  thumbnail_url: null,
  summary: null,
  cached_at: null,
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
  ranking: {
    id: '1',
    user_id: 'user1',
    game_id: '1',
    played_it: true,
    ranking: 9,
    notes: null,
    public_note: null,
    private_note: null,
    created_at: '2023-01-01',
    imported_from: null,
    updated_at: '2023-01-01',
  },
};

export const Default: Story = {
  args: {
    game: mockWinner,
  },
};
