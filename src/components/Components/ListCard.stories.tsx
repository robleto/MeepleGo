import type { Meta, StoryObj } from '@storybook/react';
import ListCard from './ListCard';
import { GameListWithItems } from '@/types/supabase';

const mockGames = [
  {
    id: '1',
    bgg_id: 266192,
    name: 'Wingspan',
    year_published: 2019,
    image_url: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__itemrep@2x/img/veohwKEtFpERbDq7xGMggHqLKX8=/fit-in/246x300/filters:strip_icc()/pic4458123.jpg',
    thumbnail_url: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__itemrep@2x/img/veohwKEtFpERbDq7xGMggHqLKX8=/fit-in/246x300/filters:strip_icc()/pic4458123.jpg',
    categories: ['Card Game'],
    mechanics: ['Engine Building'],
    publisher: 'Stonemaier Games',
    designer: 'Elizabeth Hargrave',
    description: 'A relaxing bird collection game.',
    summary: null,
    min_players: 1,
    max_players: 5,
    playtime_minutes: 70,
    rating: 8.1,
    weight: 2.42,
    rank: 15,
    num_ratings: 35000,
    tagline: 'A beautiful, relaxing bird collection game',
    honors: [],
    cached_at: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    bgg_id: 230802,
    name: 'Azul',
    year_published: 2017,
    image_url: 'https://cf.geekdo-images.com/aPSHJO0d0XOpQR5X-wJonw__itemrep@2x/img/YhqlW4jj12TeSDlxXPlbOAZ8DAM=/fit-in/246x300/filters:strip_icc()/pic3718275.jpg',
    thumbnail_url: 'https://cf.geekdo-images.com/aPSHJO0d0XOpQR5X-wJonw__itemrep@2x/img/YhqlW4jj12TeSDlxXPlbOAZ8DAM=/fit-in/246x300/filters:strip_icc()/pic3718275.jpg',
    categories: ['Abstract Strategy'],
    mechanics: ['Tile Placement'],
    publisher: 'Plan B Games',
    designer: 'Michael Kiesling',
    description: 'Azul captures the beautiful aesthetics of Moorish art.',
    min_players: 2,
    max_players: 4,
    playtime_minutes: 45,
    rating: 7.8,
    weight: 1.78,
    tagline: 'Beautiful tile-laying game',
    honors: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: '3',
    bgg_id: 9209,
    name: 'Ticket to Ride',
    year_published: 2004,
    image_url: 'https://cf.geekdo-images.com/ZWJg0dCdrWHIaeuIgcMaeg__itemrep@2x/img/vfXWOe-yMJ1nA-hrmj8SH9Q-vXA=/fit-in/246x300/filters:strip_icc()/pic38668.jpg',
    thumbnail_url: 'https://cf.geekdo-images.com/ZWJg0dCdrWHIaeuIgcMaeg__itemrep@2x/img/vfXWOe-yMJ1nA-hrmj8SH9Q-vXA=/fit-in/246x300/filters:strip_icc()/pic38668.jpg',
    categories: ['Family Game'],
    mechanics: ['Set Collection'],
    publisher: 'Days of Wonder',
    designer: 'Alan R. Moon',
    description: 'A cross-country train adventure.',
    min_players: 2,
    max_players: 5,
    playtime_minutes: 60,
    rating: 7.4,
    weight: 1.84,
    tagline: 'The classic train adventure game',
    honors: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: '4',
    bgg_id: 148228,
    name: 'Splendor',
    year_published: 2014,
    image_url: 'https://cf.geekdo-images.com/rwOMxx_NDD2iOnJ93xOqfA__itemrep@2x/img/hhAVIL5WnONvFLQEDCiX1_LZ-QY=/fit-in/246x300/filters:strip_icc()/pic1904079.jpg',
    thumbnail_url: 'https://cf.geekdo-images.com/rwOMxx_NDD2iOnJ93xOqfA__itemrep@2x/img/hhAVIL5WnONvFLQEDCiX1_LZ-QY=/fit-in/246x300/filters:strip_icc()/pic1904079.jpg',
    categories: ['Card Game'],
    mechanics: ['Engine Building'],
    publisher: 'Space Cowboys',
    designer: 'Marc André',
    description: 'As a wealthy Renaissance merchant, acquire mines and transportation.',
    min_players: 2,
    max_players: 4,
    playtime_minutes: 30,
    rating: 7.4,
    weight: 1.78,
    tagline: 'Gem trading in the Renaissance',
    honors: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: '5',
    bgg_id: 13,
    name: 'Catan',
    year_published: 1995,
    image_url: 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__itemrep@2x/img/M_3Vg7bCoyNFSV3T-VeDYUo2pNQ=/fit-in/246x300/filters:strip_icc()/pic2419375.jpg',
    thumbnail_url: 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__itemrep@2x/img/M_3Vg7bCoyNFSV3T-VeDYUo2pNQ=/fit-in/246x300/filters:strip_icc()/pic2419375.jpg',
    categories: ['Family Game'],
    mechanics: ['Trading'],
    publisher: 'Catan Studio',
    designer: 'Klaus Teuber',
    description: 'Build settlements, cities, and roads to collect resources.',
    min_players: 3,
    max_players: 4,
    playtime_minutes: 75,
    rating: 7.2,
    weight: 2.33,
    tagline: 'The classic island adventure',
    honors: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  }
];

const mockListWithGames: GameListWithItems = {
  id: '1',
  name: 'LIBRARY',
  description: 'All games you own or track',
  is_public: false,
  list_type: 'library',
  created_at: '',
  updated_at: '2024-12-20T10:00:00Z',
  user_id: 'user1',
  game_list_items: mockGames.map((game, index) => ({
    id: `item-${index}`,
    list_id: '1',
    game_id: game.id,
    ranking: null,
    played_it: true,
    score: null,
    created_at: '',
    updated_at: null,
    game: game as any
  })),
};

const mockEmptyList: GameListWithItems = {
  id: '2',
  name: 'Empty Custom List',
  description: 'A list with no games yet.',
  is_public: true,
  list_type: 'custom',
  created_at: '',
  updated_at: '',
  user_id: 'user1',
  game_list_items: [],
};

const meta: Meta<typeof ListCard> = {
  title: 'Components/ListCard',
  component: ListCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Card component displaying user-created game lists with metadata and visibility status. Features fanned game images for visual appeal.'
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof ListCard>;

export const LibraryCard: Story = {
  args: {
    list: mockListWithGames,
  },
};

export const EmptyList: Story = {
  args: {
    list: mockEmptyList,
  },
};

export const WishlistCard: Story = {
  args: {
    list: {
      ...mockListWithGames,
      id: '3',
      name: 'WISHLIST',
      description: 'Games you want to own',
      list_type: 'wishlist',
      game_list_items: mockListWithGames.game_list_items.slice(0, 3), // Fewer games
    },
  },
};

export const CustomList: Story = {
  args: {
    list: {
      ...mockListWithGames,
      id: '4',
      name: 'Strategy Games',
      description: 'My favorite strategy games for game night',
      list_type: 'custom',
      is_public: true,
    },
  },
};

export const CreateNewList: Story = {
  args: {
    variant: 'create',
    onCreateClick: () => console.log('Create new list clicked!'),
  },
};

export const CreateNewListCustomText: Story = {
  args: {
    variant: 'create',
    createTitle: 'New Collection',
    createDescription: 'Start building your custom game collection',
    onCreateClick: () => console.log('Create collection clicked!'),
  },
};
