import type { Meta, StoryObj } from '@storybook/react'
import { Chip, RatingChip } from './Chip'
import { StarIcon, HeartIcon, CheckIcon } from '@heroicons/react/24/outline'

const meta: Meta<typeof Chip> = {
  title: 'Elements/Chip',
  component: Chip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['subtle', 'solid', 'outline', 'overlay'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
    shape: {
      control: 'select',
      options: ['rounded', 'circle', 'square'],
    },
    color: {
      control: 'select',
      options: ['gray', 'blue', 'green', 'yellow', 'red', 'purple', 'rating'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Default Chip',
  },
}

export const Colors: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-3">Subtle Variant</h3>
        <div className="flex flex-wrap gap-2">
          <Chip color="gray" variant="subtle">Gray</Chip>
          <Chip color="blue" variant="subtle">Blue</Chip>
          <Chip color="green" variant="subtle">Green</Chip>
          <Chip color="yellow" variant="subtle">Yellow</Chip>
          <Chip color="red" variant="subtle">Red</Chip>
          <Chip color="purple" variant="subtle">Purple</Chip>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-3">Solid Variant</h3>
        <div className="flex flex-wrap gap-2">
          <Chip color="gray" variant="solid">Gray</Chip>
          <Chip color="blue" variant="solid">Blue</Chip>
          <Chip color="green" variant="solid">Green</Chip>
          <Chip color="yellow" variant="solid">Yellow</Chip>
          <Chip color="red" variant="solid">Red</Chip>
          <Chip color="purple" variant="solid">Purple</Chip>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-3">Outline Variant</h3>
        <div className="flex flex-wrap gap-2">
          <Chip color="gray" variant="outline">Gray</Chip>
          <Chip color="blue" variant="outline">Blue</Chip>
          <Chip color="green" variant="outline">Green</Chip>
          <Chip color="yellow" variant="outline">Yellow</Chip>
          <Chip color="red" variant="outline">Red</Chip>
          <Chip color="purple" variant="outline">Purple</Chip>
        </div>
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Chip size="xs" color="blue">XS</Chip>
      <Chip size="sm" color="blue">SM</Chip>
      <Chip size="md" color="blue">MD</Chip>
      <Chip size="lg" color="blue">LG</Chip>
    </div>
  ),
}

export const Shapes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Chip shape="rounded" color="purple">Rounded</Chip>
      <Chip shape="circle" color="purple">Circle</Chip>
      <Chip shape="square" color="purple">Square</Chip>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Chip color="green" variant="subtle">
        <div className="flex items-center gap-1">
          <CheckIcon className="w-3 h-3" />
          Complete
        </div>
      </Chip>
      <Chip color="red" variant="subtle">
        <div className="flex items-center gap-1">
          <HeartIcon className="w-3 h-3" />
          Favorite
        </div>
      </Chip>
      <Chip color="blue" variant="solid">
        <div className="flex items-center gap-1">
          <StarIcon className="w-3 h-3" />
          Featured
        </div>
      </Chip>
    </div>
  ),
}

export const Interactive: Story = {
  render: () => (
    <div className="flex gap-3">
      <Chip 
        color="blue" 
        interactive 
        onClick={() => alert('Clicked!')}
      >
        Click me
      </Chip>
      <Chip 
        color="green" 
        variant="solid" 
        interactive
        onClick={() => alert('Success!')}
      >
        Success Action
      </Chip>
    </div>
  ),
}

export const RatingChips: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Rating Scale (Subtle)</h3>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
            <RatingChip key={rating} value={rating} variant="subtle" />
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-3">Rating Scale (Solid)</h3>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
            <RatingChip key={rating} value={rating} variant="solid" />
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-3">Different Sizes</h3>
        <div className="flex items-center gap-3">
          <RatingChip value={8} size="xs" />
          <RatingChip value={8} size="sm" />
          <RatingChip value={8} size="md" />
          <RatingChip value={8} size="lg" />
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-3">Empty States</h3>
        <div className="flex items-center gap-3">
          <RatingChip value={null} />
          <RatingChip value={null} showEmptyAsStar />
          <RatingChip value={null} showEmptyAsStar size="md" />
        </div>
      </div>
    </div>
  ),
}

export const OverlayVariant: Story = {
  render: () => (
    <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-8 rounded-lg">
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=200&fit=crop" 
          alt="Background"
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
      <div className="relative flex flex-wrap gap-3">
        <Chip variant="overlay" color="gray">Overlay Chip</Chip>
        <RatingChip value={9} variant="overlay" />
        <Chip variant="overlay" color="blue">
          <div className="flex items-center gap-1">
            <StarIcon className="w-3 h-3" />
            Featured
          </div>
        </Chip>
      </div>
    </div>
  ),
}

export const StatusChips: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-3">Game Status</h3>
        <div className="flex flex-wrap gap-2">
          <Chip color="green" variant="subtle">Owned</Chip>
          <Chip color="blue" variant="subtle">Wishlist</Chip>
          <Chip color="yellow" variant="subtle">Borrowed</Chip>
          <Chip color="red" variant="subtle">Sold</Chip>
          <Chip color="purple" variant="subtle">Pre-order</Chip>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-3">Play Status</h3>
        <div className="flex flex-wrap gap-2">
          <Chip color="green" variant="solid">
            <CheckIcon className="w-3 h-3" />
          </Chip>
          <Chip color="gray" variant="outline">Not Played</Chip>
          <Chip color="blue" variant="subtle">In Progress</Chip>
        </div>
      </div>
    </div>
  ),
}
