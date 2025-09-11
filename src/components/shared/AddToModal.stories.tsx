import type { Meta, StoryObj } from '@storybook/react'
import AddToModal from './AddToModal'

const meta: Meta<typeof AddToModal> = {
  title: 'Archived/Shared/AddToModal',
  component: AddToModal,
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
  tagline: 'A relaxing, award-winning strategy card game about birds',
  year_published: 2019,
  min_players: 1,
  max_players: 5,
  playing_time: 70,
  thumb_url: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__thumb/img/ZPTOLpQKdTbPmtF3VGXz5VnGLxs=/fit-in/200x150/filters:strip_icc()/pic4458123.jpg',
  ranking: null,
  played_it: false,
  list_membership: {
    library: false,
    wishlist: false
  }
}

export const Closed: Story = {
  args: {
    game: mockGame as any, // Type assertion for story simplicity
    open: false,
    onClose: () => console.log('Modal closed'),
    onMembershipChange: (gameId, change) => console.log('Membership changed:', gameId, change),
  },
}

export const Open: Story = {
  args: {
    game: mockGame as any,
    open: true,
    onClose: () => console.log('Modal closed'),
    onMembershipChange: (gameId, change) => console.log('Membership changed:', gameId, change),
  },
}

export const WithRating: Story = {
  args: {
    game: {
      ...mockGame,
      ranking: { ranking: 8.5 },
      played_it: true,
    } as any,
    open: true,
    onClose: () => console.log('Modal closed'),
    onMembershipChange: (gameId, change) => console.log('Membership changed:', gameId, change),
  },
}

export const InLibrary: Story = {
  args: {
    game: {
      ...mockGame,
      ranking: { ranking: 7.2 },
      played_it: true,
      list_membership: {
        library: true,
        wishlist: false
      }
    } as any,
    open: true,
    onClose: () => console.log('Modal closed'),
    onMembershipChange: (gameId, change) => console.log('Membership changed:', gameId, change),
  },
}

export const OnWishlist: Story = {
  args: {
    game: {
      ...mockGame,
      list_membership: {
        library: false,
        wishlist: true
      }
    } as any,
    open: true,
    onClose: () => console.log('Modal closed'),
    onMembershipChange: (gameId, change) => console.log('Membership changed:', gameId, change),
  },
}

export const NoGame: Story = {
  args: {
    game: null,
    open: true,
    onClose: () => console.log('Modal closed'),
    onMembershipChange: (gameId, change) => console.log('Membership changed:', gameId, change),
  },
}

export const ModalStates: Story = {
  render: () => (
    <div className="space-y-6 p-8">
      <h2 className="text-2xl font-bold">AddToModal States</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold mb-2">🎮 Rating & Status</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Rate games (1-10 scale)</li>
            <li>• Mark as "Played It"</li>
            <li>• Interactive rating selector</li>
            <li>• Visual rating feedback</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold mb-2">📚 List Management</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Add to Library</li>
            <li>• Add to Wishlist</li>
            <li>• Remove from lists</li>
            <li>• Multiple list membership</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold mb-2">💭 Comments</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Personal notes</li>
            <li>• Game impressions</li>
            <li>• Free-form text</li>
            <li>• Optional field</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold mb-2">🎨 UI Features</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Modal overlay</li>
            <li>• Game image preview</li>
            <li>• Responsive design</li>
            <li>• Save state management</li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Usage Notes</h4>
        <p className="text-blue-800 text-sm">
          AddToModal allows users to quickly rate games, add them to lists, and track
          their play status. It's typically triggered from game cards or the game detail modal.
        </p>
      </div>
    </div>
  ),
}
