import type { Meta, StoryObj } from '@storybook/react';
import ListCard from './ListCard';
import { GameListWithItems } from '@/types/supabase';

const mockList: GameListWithItems = {
  id: '1',
  name: 'My Favorite Games',
  description: 'A list of my favorite games.',
  is_public: true,
  list_type: 'custom',
  created_at: '',
  updated_at: '',
  user_id: 'user1',
  game_list_items: [],
};

const meta: Meta<typeof ListCard> = {
  title: 'Components/Lists/ListCard',
  component: ListCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Card component displaying user-created game lists with metadata and visibility status.'
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof ListCard>;

export const Default: Story = {
  render: () => <ListCard list={mockList} />,
};
