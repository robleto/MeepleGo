import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import GameRowCard from './GameRowCard'

const mockGame = {
  id: 'g-row-1',
  bgg_id: 2222,
  name: 'Ark Nova',
  year_published: 2021,
  image_url:
    'https://cf.geekdo-images.com/4w1c4f0L1kR6Q2Z6TzQGqA__itemrep@2x/img/0C4B1eG6g0o6Y8Xx6G7sH8gL1QM=/fit-in/492x600/filters:strip_icc()/pic6293412.jpg',
  thumbnail_url:
    'https://cf.geekdo-images.com/4w1c4f0L1kR6Q2Z6TzQGqA__itemrep@2x/img/0C4B1eG6g0o6Y8Xx6G7sH8gL1QM=/fit-in/492x600/filters:strip_icc()/pic6293412.jpg',
  categories: ['Animals', 'Economic'],
  mechanics: ['Action Queue'],
  publisher: 'Feuerland Spiele',
  description: 'Build a modern zoo.',
  min_players: 1,
  max_players: 4,
  playtime_minutes: 150,
  ranking: { ranking: 9, played_it: true },
  list_membership: { library: true, wishlist: false },
  created_at: '',
  updated_at: '',
  summary: '',
  rank: 5,
  rating: 8.2,
  num_ratings: 12000,
}

const meta: Meta<typeof GameRowCard> = {
  title: 'Components/GameRowCard',
  component: GameRowCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    nextjs: { appDirectory: true },
  },
}

export default meta
type Story = StoryObj<typeof GameRowCard>

export const Default: Story = {
  args: {
    game: mockGame as any,
    index: 0,
    listRank: 1,
    onUpdate: async () => {},
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl bg-white border border-gray-200 rounded-lg">
        <Story />
      </div>
    ),
  ],
}
