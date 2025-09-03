
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import GameDetailModal from './GameDetailModal';

const mockGame = {
  id: '1',
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

const meta: Meta<typeof GameDetailModal> = {
  title: 'Components/GameDetailModal',
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
