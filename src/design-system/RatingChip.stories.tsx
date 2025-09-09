import type { Meta, StoryObj } from '@storybook/react'
import RatingChip from './elements/RatingChip'

const meta: Meta<typeof RatingChip> = {
  title: 'Design System/RatingChip',
  component: RatingChip,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Compact rating chips for displaying game ratings with color-coded backgrounds. Perfect for showing ratings in lists, cards, and overlays.',
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'number', min: 1, max: 10, step: 0.1 },
      description: 'Rating value (1-10) or null for unrated',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Size of the chip',
    },
    variant: {
      control: 'select',
      options: ['subtle', 'solid', 'overlay'],
      description: 'Visual style variant',
    },
    shape: {
      control: 'select',
      options: ['rounded', 'circle', 'square'],
      description: 'Shape of the chip',
    },
    interactive: {
      control: 'boolean',
      description: 'Whether the chip should have hover effects',
    },
    showEmptyAsStar: {
      control: 'boolean',
      description: 'Show star icon for unrated games',
    },
  },
} satisfies Meta<typeof RatingChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 8,
  },
}

export const AllRatings: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-3">All Rating Values</h3>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
            <RatingChip key={rating} value={rating} />
          ))}
          <RatingChip value={null} />
        </div>
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-3">Size Variants</h3>
        <div className="flex items-center gap-4">
          <RatingChip value={8} size="xs" />
          <RatingChip value={8} size="sm" />
          <RatingChip value={8} size="md" />
          <RatingChip value={8} size="lg" />
        </div>
      </div>
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Subtle Variant (Default)</h3>
        <div className="flex gap-2">
          {[2, 5, 8, 10, null].map((rating, i) => (
            <RatingChip key={i} value={rating} variant="subtle" />
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Solid Variant</h3>
        <div className="flex gap-2">
          {[2, 5, 8, 10, null].map((rating, i) => (
            <RatingChip key={i} value={rating} variant="solid" />
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Overlay Variant</h3>
        <div className="relative bg-gray-800 p-4 rounded-lg">
          <div className="flex gap-2">
            {[2, 5, 8, 10, null].map((rating, i) => (
              <RatingChip key={i} value={rating} variant="overlay" />
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
}

export const Shapes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-3">Shape Variants</h3>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <RatingChip value={8} shape="rounded" size="md" />
            <p className="text-xs text-gray-600 mt-1">Rounded</p>
          </div>
          <div className="text-center">
            <RatingChip value={8} shape="circle" size="md" />
            <p className="text-xs text-gray-600 mt-1">Circle</p>
          </div>
          <div className="text-center">
            <RatingChip value={8} shape="square" size="md" />
            <p className="text-xs text-gray-600 mt-1">Square</p>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const Interactive: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-3">Interactive Chips</h3>
        <div className="flex gap-2">
          <RatingChip 
            value={7} 
            interactive 
            onClick={() => alert('Rating clicked!')} 
          />
          <RatingChip 
            value={9} 
            interactive 
            onClick={() => alert('Rating clicked!')} 
          />
          <RatingChip 
            value={null} 
            showEmptyAsStar 
            interactive 
            onClick={() => alert('Rate this game!')} 
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">Click the chips above</p>
      </div>
    </div>
  ),
}

export const EmptyStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-3">Empty/Unrated States</h3>
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <RatingChip value={null} />
            <p className="text-xs text-gray-600 mt-1">Default</p>
          </div>
          <div className="text-center">
            <RatingChip value={null} showEmptyAsStar />
            <p className="text-xs text-gray-600 mt-1">With Star</p>
          </div>
          <div className="text-center">
            <RatingChip value={null} showEmptyAsStar interactive />
            <p className="text-xs text-gray-600 mt-1">Interactive</p>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const InContext: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Usage Examples</h3>
        
        {/* Game card example */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Wingspan</h4>
            <RatingChip value={9} size="sm" />
          </div>
          <p className="text-sm text-gray-600">Engine-building board game about birds</p>
        </div>
        
        {/* List item example */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded"></div>
              <span className="font-medium">Azul</span>
            </div>
            <RatingChip value={7.5} size="xs" variant="solid" />
          </div>
        </div>
      </div>
    </div>
  ),
}