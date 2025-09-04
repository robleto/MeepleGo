import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import RatingChip from './elements/RatingChip'
import RatingPopup from './elements/RatingPopup'

const meta: Meta<typeof RatingChip> = {
  title: 'Design System/RatingChip',
  component: RatingChip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Unified rating display component supporting multiple variants, shapes, and sizes for consistent rating visualization across MeepleGo.'
      }
    }
  },
  argTypes: {
    value: { control: { type: 'number', min: 1, max: 10, step: 0.1 } },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    variant: { control: 'select', options: ['subtle', 'solid', 'overlay'] },
    shape: { control: 'select', options: ['rounded', 'circle', 'square'] },
    interactive: { control: 'boolean' },
    className: { control: 'text' }
  },
  args: {
    value: 8,
    size: 'sm',
    variant: 'subtle',
    shape: 'rounded',
    interactive: false
  }
}
export default meta

type Story = StoryObj<typeof RatingChip>

export const AllVariants: Story = {
  name: 'All Variants',
  render: (args) => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Subtle (Light/Pastel)</h4>
        <div className="flex gap-2 items-center">
          <RatingChip {...args} variant="subtle" value={8} />
          <RatingChip {...args} variant="subtle" value={5} />
          <RatingChip {...args} variant="subtle" value={2} />
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Solid (Bold Colors)</h4>
        <div className="flex gap-2 items-center">
          <RatingChip {...args} variant="solid" value={8} />
          <RatingChip {...args} variant="solid" value={5} />
          <RatingChip {...args} variant="solid" value={2} />
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Overlay (For images)</h4>
        <div className="relative w-64 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-end justify-end p-2">
          <RatingChip {...args} variant="overlay" value={8} />
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Shapes</h4>
        <div className="flex gap-2 items-center">
          <RatingChip {...args} variant="solid" shape="rounded" value={8} />
          <RatingChip {...args} variant="solid" shape="square" value={8} />
        </div>
      </div>
    </div>
  )
}

export const Sizes: Story = {
  name: 'Size Variations',
  render: (args) => (
    <div className="flex gap-6 items-end">
      <RatingChip {...args} size="xs" value={7} />
      <RatingChip {...args} size="sm" value={7} />
      <RatingChip {...args} size="md" value={7} />
      <RatingChip {...args} size="lg" value={7} />
    </div>
  )
}

export const UsagePatterns: Story = {
  name: 'Usage Patterns',
  render: () => (
    <div className="space-y-8">
      <div>
        <h4 className="text-sm font-semibold mb-4">List View - Subtle variant</h4>
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium">Wingspan</h5>
              <p className="text-sm text-gray-500">Elizabeth Hargrave • 2019</p>
            </div>
            <RatingChip value={8.1} variant="subtle" size="sm" />
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold mb-4">Grid View - Overlay variant</h4>
        <div className="w-48 h-64 bg-gradient-to-b from-green-400 to-blue-500 rounded-lg relative">
          <RatingChip value={8.1} variant="overlay" shape="square" size="md" className="absolute bottom-2 right-2" />
        </div>
      </div>
    </div>
  )
}

export const Interactive: Story = {
  name: 'Interactive',
  render: (args) => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Click to see hover effects</p>
      <div className="flex gap-2">
        <RatingChip {...args} value={8} interactive onClick={() => alert('Clicked!')} />
        <RatingChip {...args} value={5} variant="solid" interactive onClick={() => alert('Clicked!')} />
        <RatingChip {...args} value={2} variant="overlay" shape="square" interactive onClick={() => alert('Clicked!')} />
      </div>
    </div>
  )
}

export const WithRatingPopup: Story = {
  name: 'With Rating Popup',
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    const [rating, setRating] = useState<number | null>(7)
    const [position, setPosition] = useState({ x: 0, y: 0 })

    const handleRatingClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      const rect = event.currentTarget.getBoundingClientRect()
      setPosition({ 
        x: rect.left + rect.width / 2, 
        y: rect.bottom + 8 
      })
      setIsOpen(true)
    }

    return (
      <div className="space-y-8">
        <div>
          <h4 className="text-sm font-semibold mb-4">Complete Rating System</h4>
          <p className="text-sm text-gray-600 mb-4">
            Click the rating chips to see the popup with your color system.
          </p>
          
          <div className="space-y-4">
            <div className="p-6 border rounded-lg bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium">Wingspan</h5>
                  <p className="text-sm text-gray-500">Elizabeth Hargrave • 2019</p>
                </div>
                {rating ? (
                  <RatingChip 
                    value={rating} 
                    variant="subtle" 
                    size="sm" 
                    interactive
                    onClick={handleRatingClick}
                  />
                ) : (
                  <button 
                    onClick={handleRatingClick}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Rate this game
                  </button>
                )}
              </div>
            </div>

            <div className="relative w-48 h-64 bg-gradient-to-b from-green-400 to-blue-500 rounded-lg">
              {rating && (
                <RatingChip 
                  value={rating} 
                  variant="overlay" 
                  shape="square" 
                  size="md" 
                  interactive
                  className="absolute bottom-2 right-2"
                  onClick={handleRatingClick}
                />
              )}
            </div>
          </div>
        </div>

        <RatingPopup
          gameId="storybook-demo"
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
  }
}
