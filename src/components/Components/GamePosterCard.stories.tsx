import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import GamePosterCard from './GamePosterCard'

const meta: Meta<typeof GamePosterCard> = {
  title: 'Components/Rankings/GamePosterCard',
  component: GamePosterCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const mockGame = {
  id: '1',
  name: 'Wingspan',
  year_published: 2019,
  image_url:
    'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__original/img/Tbuekz3--8SfIryKDd8Yc8QjL8A=/0x0/filters:format(jpeg)/pic4458123.jpg',
  ranking: null,
  bgg_id: 266192,
  thumbnail_url:
    'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__thumb/img/ZPTOLpQKdTbPmtF3VGXz5VnGLxs=/fit-in/200x150/filters:strip_icc()/pic4458123.jpg',
  categories: ['Animals', 'Card Game'],
  mechanics: ['Engine Building'],
  min_players: 1,
  max_players: 5,
  playing_time: 70,
  min_age: 10,
  weight: 2.42,
  description: 'A strategy card game about birds',
  publishers: ['Stonemaier Games'],
  designers: ['Elizabeth Hargrave'],
  artists: ['Beth Sobel'],
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
}

export const Unrated: Story = {
  args: {
    game: mockGame as any,
    onUpdate: (gameId, patch) => console.log('Update:', gameId, patch),
    onClick: () => console.log('Card clicked'),
  },
}

export const Rated: Story = {
  args: {
    game: {
      ...mockGame,
      ranking: {
        ranking: 8.5,
        played_it: true,
      },
    } as any,
    onUpdate: (gameId, patch) => console.log('Update:', gameId, patch),
    onClick: () => console.log('Card clicked'),
  },
}

export const NotPlayed: Story = {
  args: {
    game: {
      ...mockGame,
      ranking: {
        ranking: null,
        played_it: false,
      },
    } as any,
    onUpdate: (gameId, patch) => console.log('Update:', gameId, patch),
    onClick: () => console.log('Card clicked'),
  },
}

export const HighRating: Story = {
  args: {
    game: {
      ...mockGame,
      ranking: {
        ranking: 10,
        played_it: true,
      },
    } as any,
    onUpdate: (gameId, patch) => console.log('Update:', gameId, patch),
    onClick: () => console.log('Card clicked'),
  },
}

export const LowRating: Story = {
  args: {
    game: {
      ...mockGame,
      ranking: {
        ranking: 3.2,
        played_it: true,
      },
    } as any,
    onUpdate: (gameId, patch) => console.log('Update:', gameId, patch),
    onClick: () => console.log('Card clicked'),
  },
}

export const LongTitle: Story = {
  args: {
    game: {
      ...mockGame,
      name: 'Terraforming Mars: Ares Expedition - Crisis Expansion',
      ranking: {
        ranking: 7.8,
        played_it: true,
      },
    } as any,
    onUpdate: (gameId, patch) => console.log('Update:', gameId, patch),
    onClick: () => console.log('Card clicked'),
  },
}

export const GameGrid: Story = {
  render: () => (
    <div className="space-y-6 p-8">
      <h2 className="text-2xl font-bold">GamePosterCard Grid</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { name: 'Wingspan', rating: 8.5, played: true },
          { name: 'Azul', rating: 7.2, played: true },
          { name: 'Ticket to Ride', rating: null, played: false },
          { name: 'Splendor', rating: 6.8, played: true },
          { name: 'King of Tokyo', rating: 9.1, played: true },
          { name: 'Pandemic', rating: null, played: false },
        ].map((gameData, i) => (
          <GamePosterCard
            key={i}
            game={
              {
                ...mockGame,
                id: String(i),
                name: gameData.name,
                ranking: gameData.rating
                  ? {
                      ranking: gameData.rating,
                      played_it: gameData.played,
                    }
                  : null,
              } as any
            }
            onUpdate={(gameId, patch) => console.log('Update:', gameId, patch)}
            onClick={() => console.log('Clicked:', gameData.name)}
          />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold mb-2">🎮 Interactive Features</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click to view game details</li>
            <li>• Star icon to toggle "played" status</li>
            <li>• Rating chip shows current rating</li>
            <li>• Hover states for interactions</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold mb-2">🎨 Visual Design</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Poster-style layout (tall cards)</li>
            <li>• Game image with overlay controls</li>
            <li>• Year and title display</li>
            <li>• Responsive grid layout</li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Usage Notes</h4>
        <p className="text-blue-800 text-sm">
          GamePosterCard is used in grid layouts for rankings and game
          collections. It provides a compact, visual way to display games with
          quick rating and status controls.
        </p>
      </div>
    </div>
  ),
}
