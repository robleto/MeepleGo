import type { Meta, StoryObj } from '@storybook/react';
import NomineeGrid from './NomineeGrid';
import type { GameWithRanking } from '@/types';

const meta = {
  title: 'Components/Features/Awards/NomineeGrid',
  component: NomineeGrid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Grid layout for displaying nominated games in an award category.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NomineeGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock nominee games
const mockNominees: GameWithRanking[] = [
  {
    id: '2',
    name: 'Azul',
    image_url: 'https://via.placeholder.com/150x150?text=Azul',
    bgg_id: 230802,
    year_published: 2017,
    min_players: 2,
    max_players: 4,
    playtime_minutes: 45,
    publisher: 'Plan B Games',
    description: 'Create beautiful tile patterns inspired by Portuguese azulejos.',
    categories: ['Abstract Strategy'],
    mechanics: ['Pattern Building', 'Tile Placement'],
    rank: 2,
    rating: 7.8,
    num_ratings: 12000,
    thumbnail_url: null,
    summary: null,
    cached_at: null,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    ranking: {
      id: '2',
      user_id: 'user1',
      game_id: '2',
      played_it: true,
      ranking: 8,
      notes: null,
      public_note: null,
      private_note: null,
      created_at: '2023-01-01',
      imported_from: null,
      updated_at: '2023-01-01',
    },
  },
  {
    id: '3',
    name: 'Scythe',
    image_url: 'https://via.placeholder.com/150x150?text=Scythe',
    bgg_id: 169786,
    year_published: 2016,
    min_players: 1,
    max_players: 5,
    playtime_minutes: 115,
    publisher: 'Stonemaier Games',
    description: 'Lead your faction to victory in this asymmetric strategy game.',
    categories: ['Science Fiction', 'Territory Building'],
    mechanics: ['Area Control', 'Variable Player Powers'],
    rank: 3,
    rating: 8.3,
    num_ratings: 18000,
    thumbnail_url: null,
    summary: null,
    cached_at: null,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    ranking: {
      id: '3',
      user_id: 'user1',
      game_id: '3',
      played_it: true,
      ranking: 7,
      notes: null,
      public_note: null,
      private_note: null,
      created_at: '2023-01-01',
      imported_from: null,
      updated_at: '2023-01-01',
    },
  },
  {
    id: '4',
    name: 'Ticket to Ride',
    image_url: 'https://via.placeholder.com/150x150?text=Ticket+to+Ride',
    bgg_id: 9209,
    year_published: 2004,
    min_players: 2,
    max_players: 5,
    playtime_minutes: 60,
    publisher: 'Days of Wonder',
    description: 'Connect cities across the country in this railway-themed board game.',
    categories: ['Trains'],
    mechanics: ['Set Collection', 'Route Building'],
    rank: 4,
    rating: 7.4,
    num_ratings: 20000,
    thumbnail_url: null,
    summary: null,
    cached_at: null,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    ranking: {
      id: '4',
      user_id: 'user1',
      game_id: '4',
      played_it: true,
      ranking: 6,
      notes: null,
      public_note: null,
      private_note: null,
      created_at: '2023-01-01',
      imported_from: null,
      updated_at: '2023-01-01',
    },
  },
];

export const Default: Story = {
  args: {
    nominees: mockNominees,
  },
};

export const Empty: Story = {
  args: {
    nominees: [],
  },
};

export const SingleNominee: Story = {
  args: {
    nominees: [mockNominees[0]],
  },
};
