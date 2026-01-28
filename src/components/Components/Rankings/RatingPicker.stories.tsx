import type { Meta, StoryObj } from '@storybook/react'
import RatingPicker from './RatingPicker'
import { useState } from 'react'

const meta = {
  title: 'Components/Rankings/RatingPicker',
  component: RatingPicker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A vertical rating picker component using the 1-10 MeepleGo rating scale. Features color-coded buttons for each rating value, with red (1) to sky blue (10) gradient.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'radio' },
      options: ['sm', 'md'],
    },
    current: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RatingPicker>

export default meta
type Story = StoryObj<typeof meta>

// Interactive example with state
export const Interactive = () => {
  const [rating, setRating] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Current rating: {rating ?? 'None'}
      </div>
      {isOpen && (
        <RatingPicker
          current={rating}
          onSelect={(val) => {
            setRating(val)
            console.log('Selected:', val)
          }}
          onClear={() => {
            setRating(null)
            console.log('Cleared rating')
          }}
          onClose={() => {
            setIsOpen(false)
            setTimeout(() => setIsOpen(true), 500)
          }}
        />
      )}
    </div>
  )
}

// No rating selected
export const NoRating: Story = {
  args: {
    current: null,
    onSelect: (val) => console.log('Selected:', val),
    onClear: () => console.log('Cleared'),
    onClose: () => console.log('Closed'),
    size: 'sm',
  },
}

// Rating of 10 (Masterpiece)
export const Rating10: Story = {
  args: {
    current: 10,
    onSelect: (val) => console.log('Selected:', val),
    onClear: () => console.log('Cleared'),
    onClose: () => console.log('Closed'),
    size: 'sm',
  },
}

// Rating of 7 (Good)
export const Rating7: Story = {
  args: {
    current: 7,
    onSelect: (val) => console.log('Selected:', val),
    onClear: () => console.log('Cleared'),
    onClose: () => console.log('Closed'),
    size: 'sm',
  },
}

// Rating of 5 (Average)
export const Rating5: Story = {
  args: {
    current: 5,
    onSelect: (val) => console.log('Selected:', val),
    onClear: () => console.log('Cleared'),
    onClose: () => console.log('Closed'),
    size: 'sm',
  },
}

// Rating of 1 (Awful)
export const Rating1: Story = {
  args: {
    current: 1,
    onSelect: (val) => console.log('Selected:', val),
    onClear: () => console.log('Cleared'),
    onClose: () => console.log('Closed'),
    size: 'sm',
  },
}

// Medium size variant
export const MediumSize: Story = {
  args: {
    current: 8,
    onSelect: (val) => console.log('Selected:', val),
    onClear: () => console.log('Cleared'),
    onClose: () => console.log('Closed'),
    size: 'md',
  },
}

// Small size variant (default)
export const SmallSize: Story = {
  args: {
    current: 6,
    onSelect: (val) => console.log('Selected:', val),
    onClear: () => console.log('Cleared'),
    onClose: () => console.log('Closed'),
    size: 'sm',
  },
}
