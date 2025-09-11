import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import RatingPopup from './RatingPopup'

const meta: Meta<typeof RatingPopup> = {
  title: 'Components/RatingPopup',
  component: RatingPopup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {
  args: {
    gameId: '1',
    gameName: 'Wingspan',
    currentRating: null,
    isOpen: false,
    onClose: () => console.log('Popup closed'),
    onRatingChange: (rating) => console.log('Rating changed:', rating),
    position: { x: 200, y: 100 },
  },
}

export const Open: Story = {
  args: {
    gameId: '1',
    gameName: 'Wingspan',
    currentRating: null,
    isOpen: true,
    onClose: () => console.log('Popup closed'),
    onRatingChange: (rating) => console.log('Rating changed:', rating),
    position: { x: 200, y: 100 },
  },
}

export const WithCurrentRating: Story = {
  args: {
    gameId: '1',
    gameName: 'Wingspan',
    currentRating: 8.5,
    isOpen: true,
    onClose: () => console.log('Popup closed'),
    onRatingChange: (rating) => console.log('Rating changed:', rating),
    position: { x: 200, y: 100 },
  },
}

export const LongGameName: Story = {
  args: {
    gameId: '1',
    gameName: 'Terraforming Mars: Ares Expedition - Crisis Expansion',
    currentRating: 7.2,
    isOpen: true,
    onClose: () => console.log('Popup closed'),
    onRatingChange: (rating) => console.log('Rating changed:', rating),
    position: { x: 150, y: 80 },
  },
}

export const InteractiveDemo: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    const [rating, setRating] = useState<number | null>(null)
    const [position, setPosition] = useState({ x: 300, y: 150 })

    const handleOpenPopup = (event: React.MouseEvent) => {
      const rect = event.currentTarget.getBoundingClientRect()
      setPosition({ x: rect.left, y: rect.bottom + 10 })
      setIsOpen(true)
    }

    return (
      <div className="p-8 space-y-6">
        <h2 className="text-2xl font-bold">RatingPopup Interactive Demo</h2>
        
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <h3 className="font-semibold mb-2">Current Rating: {rating || 'None'}</h3>
            <button
              onClick={handleOpenPopup}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Rate Game: Wingspan
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h4 className="font-semibold mb-2">🎯 Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 1-10 rating scale</li>
                <li>• Visual rating indicators</li>
                <li>• Hover states</li>
                <li>• Clear rating option</li>
                <li>• Auto-save to database</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h4 className="font-semibold mb-2">🎨 Interactions</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click to rate</li>
                <li>• Hover to preview</li>
                <li>• Escape to close</li>
                <li>• Click outside to close</li>
                <li>• Position-aware placement</li>
              </ul>
            </div>
          </div>
        </div>

        <RatingPopup
          gameId="1"
          gameName="Wingspan"
          currentRating={rating}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onRatingChange={(newRating) => {
            setRating(newRating)
            console.log('Rating changed:', newRating)
          }}
          position={position}
        />
      </div>
    )
  },
}

export const PositionVariants: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold">RatingPopup Positioning</h2>
      
      <div className="relative bg-gray-100 rounded-lg p-8 min-h-96">
        <div className="grid grid-cols-3 gap-8 h-full">
          {/* Top Left */}
          <div className="relative">
            <div className="bg-white p-3 rounded shadow text-center text-sm">Top Left</div>
            <RatingPopup
              gameId="1"
              gameName="Azul"
              currentRating={6}
              isOpen={true}
              onClose={() => {}}
              onRatingChange={() => {}}
              position={{ x: 50, y: 50 }}
            />
          </div>

          {/* Top Center */}
          <div className="relative">
            <div className="bg-white p-3 rounded shadow text-center text-sm">Top Center</div>
            <RatingPopup
              gameId="2"
              gameName="Ticket to Ride"
              currentRating={8}
              isOpen={true}
              onClose={() => {}}
              onRatingChange={() => {}}
              position={{ x: 200, y: 50 }}
            />
          </div>

          {/* Top Right */}
          <div className="relative">
            <div className="bg-white p-3 rounded shadow text-center text-sm">Top Right</div>
            <RatingPopup
              gameId="3"
              gameName="Splendor"
              currentRating={7.5}
              isOpen={true}
              onClose={() => {}}
              onRatingChange={() => {}}
              position={{ x: 350, y: 50 }}
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Usage Notes</h4>
        <p className="text-blue-800 text-sm">
          RatingPopup provides a quick way to rate games with visual feedback. It automatically
          positions itself relative to the trigger element and handles saving to the database.
        </p>
      </div>
    </div>
  ),
}
