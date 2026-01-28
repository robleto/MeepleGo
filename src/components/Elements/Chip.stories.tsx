import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Image from 'next/image'
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
          <Chip color="gray" variant="subtle">
            Gray
          </Chip>
          <Chip color="blue" variant="subtle">
            Blue
          </Chip>
          <Chip color="green" variant="subtle">
            Green
          </Chip>
          <Chip color="yellow" variant="subtle">
            Yellow
          </Chip>
          <Chip color="red" variant="subtle">
            Red
          </Chip>
          <Chip color="purple" variant="subtle">
            Purple
          </Chip>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Solid Variant</h3>
        <div className="flex flex-wrap gap-2">
          <Chip color="gray" variant="solid">
            Gray
          </Chip>
          <Chip color="blue" variant="solid">
            Blue
          </Chip>
          <Chip color="green" variant="solid">
            Green
          </Chip>
          <Chip color="yellow" variant="solid">
            Yellow
          </Chip>
          <Chip color="red" variant="solid">
            Red
          </Chip>
          <Chip color="purple" variant="solid">
            Purple
          </Chip>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Outline Variant</h3>
        <div className="flex flex-wrap gap-2">
          <Chip color="gray" variant="outline">
            Gray
          </Chip>
          <Chip color="blue" variant="outline">
            Blue
          </Chip>
          <Chip color="green" variant="outline">
            Green
          </Chip>
          <Chip color="yellow" variant="outline">
            Yellow
          </Chip>
          <Chip color="red" variant="outline">
            Red
          </Chip>
          <Chip color="purple" variant="outline">
            Purple
          </Chip>
        </div>
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Chip size="xs" color="blue">
        XS
      </Chip>
      <Chip size="sm" color="blue">
        SM
      </Chip>
      <Chip size="md" color="blue">
        MD
      </Chip>
      <Chip size="lg" color="blue">
        LG
      </Chip>
    </div>
  ),
}

export const Shapes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Chip shape="rounded" color="purple">
        Rounded
      </Chip>
      <Chip shape="circle" color="purple">
        Circle
      </Chip>
      <Chip shape="square" color="purple">
        Square
      </Chip>
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
      <Chip color="blue" interactive onClick={() => alert('Clicked!')}>
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
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
            <RatingChip key={rating} value={rating} variant="subtle" />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Rating Scale (Solid)</h3>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
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
        <Image
          src="https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=200&fit=crop"
          alt="Background"
          className="object-cover rounded-lg"
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          priority
        />
      </div>
      <div className="relative flex flex-wrap gap-3">
        <Chip variant="overlay" color="gray">
          Overlay Chip
        </Chip>
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
          <Chip color="blue" variant="subtle">
            Own It
          </Chip>
          <Chip color="pink" variant="subtle">
            Wishlist
          </Chip>
          <Chip color="orange" variant="subtle">
            Borrowed
          </Chip>
          <Chip color="red" variant="subtle">
            Sold
          </Chip>
          <Chip color="purple" variant="subtle">
            Pre-order
          </Chip>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Play Status</h3>
        <div className="flex flex-wrap gap-2">
          <Chip color="green" variant="solid">
            <div className="flex items-center gap-1">
              <CheckIcon className="w-3 h-3" />
              Played It
            </div>
          </Chip>
          <Chip color="gray" variant="outline">
            Not Played
          </Chip>
          <Chip color="yellow" variant="subtle">
            In Progress
          </Chip>
        </div>
      </div>
    </div>
  ),
}

export const MediumStatusChips: Story = {
  name: 'Medium Status Chips (Recommended)',
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Game Status (Medium Size)</h3>
        <div className="flex flex-wrap gap-3">
          <Chip color="blue" variant="subtle" size="md">
            Own It
          </Chip>
          <Chip color="pink" variant="subtle" size="md">
            Wishlist
          </Chip>
          <Chip color="orange" variant="subtle" size="md">
            Borrowed
          </Chip>
          <Chip color="red" variant="subtle" size="md">
            Sold
          </Chip>
          <Chip color="purple" variant="subtle" size="md">
            Pre-order
          </Chip>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Play Status (Medium Size)</h3>
        <div className="flex flex-wrap gap-3">
          <Chip color="green" variant="solid" size="md">
            <div className="flex items-center gap-1.5">
              <CheckIcon className="w-4 h-4" />
              Played It
            </div>
          </Chip>
          <Chip color="gray" variant="outline" size="md">
            Not Played
          </Chip>
          <Chip color="yellow" variant="subtle" size="md">
            In Progress
          </Chip>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">
          Color Strategy
        </h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div>
            <strong>Play Status:</strong> Green (played), Gray (unplayed),
            Yellow (in progress)
          </div>
          <div>
            <strong>Game Status:</strong> Blue (own it), Pink (wishlist), Orange
            (borrowed), Red (sold), Purple (pre-order)
          </div>
        </div>
      </div>
    </div>
  ),
}

export const SmallStatusChips: Story = {
  name: 'Small Status Chips (ListView)',
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">
          Game Status (Small Size - ListView)
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Inactive State (White BG, Gray Text):
            </p>
            <div className="flex flex-wrap gap-2">
              <Chip color="blue" variant="outline" size="sm">
                Own It
              </Chip>
              <Chip color="pink" variant="outline" size="sm">
                <div className="flex items-center gap-1">
                  <HeartIcon className="w-4 h-4" />
                  <span>Wishlist</span>
                </div>
              </Chip>
              <Chip color="orange" variant="outline" size="sm">
                Borrowed
              </Chip>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Active State (Light Pastel BG, Colored Text):
            </p>
            <div className="flex flex-wrap gap-2">
              <Chip color="blue" variant="subtle" size="sm">
                Own It
              </Chip>
              <Chip color="pink" variant="subtle" size="sm">
                <div className="flex items-center gap-1">
                  <HeartIcon className="w-4 h-4" />
                  <span>Wishlist</span>
                </div>
              </Chip>
              <Chip color="orange" variant="subtle" size="sm">
                Borrowed
              </Chip>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">
          Play Status (Small Size - ListView)
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 mb-2">Inactive State:</p>
            <div className="flex flex-wrap gap-2">
              <Chip color="gray" variant="outline" size="sm">
                Not Played
              </Chip>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Active State:</p>
            <div className="flex flex-wrap gap-2">
              <Chip color="green" variant="subtle" size="sm">
                <div className="flex items-center gap-1">
                  <CheckIcon className="w-4 h-4" />
                  <span>Played It</span>
                </div>
              </Chip>
              <Chip color="yellow" variant="subtle" size="sm">
                In Progress
              </Chip>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-green-50 rounded-lg">
        <h4 className="font-semibold text-green-900 mb-2">
          Updated Design Treatment
        </h4>
        <div className="text-sm text-green-800 space-y-1">
          <div>
            <strong>Inactive:</strong> White background with gray text/icons
          </div>
          <div>
            <strong>Active:</strong> Light pastel background with colored
            text/icons (no bold/solid colors)
          </div>
          <div>
            <strong>Size:</strong> Small (sm) for ListView components
          </div>
        </div>
      </div>
    </div>
  ),
}
