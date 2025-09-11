
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import GameDetailModal from './GameDetailModal';

const mockGame = {
  id: 1,
  name: 'Wingspan',
  year_published: 2019,
  image_url: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__imagepage/img/Vxxy__bDYKWQMTOHAE9rJUdxM9o=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4458123.jpg',
  thumbnail_url: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__imagepage/img/Vxxy__bDYKWQMTOHAE9rJUdxM9o=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4458123.jpg',
  categories: ['Card Game'],
  mechanics: ['Engine Building'],
  publisher: 'Stonemaier Games',
  designer: 'Elizabeth Hargrave',
  description: 'A relaxing bird collection game.',
  min_players: 1,
  max_players: 5,
  playtime_minutes: 70,
  honors: [],
  ranking: 8,
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

// Game with awards data that reproduces the duplicate "Winner" bug
const gameWithAwards = {
  ...mockGame,
  name: 'Award-Winning Strategy Game',
  honors: [
    {
      name: 'Spiel des Jahres',
      category: 'Winner',
      result_raw: 'Winner',
      year: 2023,
      source: 'bgg'
    },
    {
      name: 'Golden Geek Award',
      category: 'Board Game of the Year Winner',
      result_raw: '',
      year: 2023,
      source: 'bgg'
    },
    {
      name: 'International Gamers Award',
      category: 'Nominee',
      result_raw: 'Nominated',
      year: 2023,
      source: 'bgg'
    },
    {
      name: 'Origins Award',
      category: '',
      result_raw: 'Winner - Best Strategy Game',
      year: 2022,
      source: 'bgg'
    },
    {
      name: 'Game of the Year',
      category: 'Winner',
      result_raw: 'First Place',
      year: 2023,
      source: 'personal',
      is_personal: true
    }
  ]
};

const meta: Meta<typeof GameDetailModal> = {
  title: 'Archived/GameDetailModal',
  component: GameDetailModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Modal for displaying detailed game information with rating and list management.'
      }
    }
  }
}
export default meta

type Story = StoryObj<typeof GameDetailModal>

export const Default: Story = {
  args: {
    open: true,
    game: mockGame
  }
}

export const WithAwards: Story = {
  args: {
    open: true,
    game: gameWithAwards
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the awards section with various award types. This story reproduces the duplicate "Winner" text bug where "Winner" appears twice when both category and result contain "winner".'
      }
    }
  }
}

export const MissingBggData: Story = {
  args: {
    open: true,
    game: {
      ...mockGame,
      name: 'Game Without BGG Data',
      rating: null,
      rank: null,
      num_ratings: null
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how the modal handles games without BGG rating and rank data, displaying "Not available" placeholders.'
      }
    }
  }
}
