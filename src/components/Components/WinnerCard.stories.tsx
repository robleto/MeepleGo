import type { Meta, StoryObj } from '@storybook/react';
import WinnerCard from './WinnerCard';
import { GameWithRanking } from '@/types';

const meta: Meta<typeof WinnerCard> = {
  title: 'Components/WinnerCard',
  component: WinnerCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockGame: GameWithRanking = {
  id: '1',
  bgg_id: 266192,
  name: 'Wingspan',
  year_published: 2019,
  image_url: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__original/img/cI782Zis9cT66B6hPiOqSctGx6A=/0x0/filters:format(jpeg)/pic4458123.jpg',
  thumbnail_url: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__thumb/img/Af1LtVfOmd_4PF6BJTM-2U-y8E0=/fit-in/200x150/filters:strip_icc()/pic4458123.jpg',
  categories: ['Animals', 'Card Game'],
  mechanics: ['Engine Building', 'Hand Management'],
  min_players: 1,
  max_players: 5,
  playtime_minutes: 70,
  publisher: 'Stonemaier Games',
  description: 'A competitive, medium-weight, card-driven, engine-building board game.',
  summary: 'Engine-building with birds',
  rank: 15,
  rating: 8.1,
  num_ratings: 45000,
  cached_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ranking: {
    id: 'r1',
    user_id: 'u1',
    game_id: '1',
    played_it: true,
    ranking: 9,
    notes: null,
    public_note: null,
    private_note: null,
    created_at: null,
    imported_from: null,
    updated_at: null,
  },
};

export const Default: Story = {
  args: {
    game: mockGame,
  },
};

export const WithoutRanking: Story = {
  args: {
    game: {
      ...mockGame,
      ranking: null,
    },
  },
};

export const CustomClassName: Story = {
  args: {
    game: mockGame,
    className: 'border-2 border-amber-400 rounded-lg p-4',
  },
};
