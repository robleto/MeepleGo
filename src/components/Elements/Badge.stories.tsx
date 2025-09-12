import type { Meta, StoryObj } from '@storybook/react'
import { 
  TrophyIcon, 
  StarIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import Badge, { WinnerBadge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'Elements/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile badge component for labels, status indicators, and notifications. Includes a specialized WinnerBadge variant for awards.'
      }
    }
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'],
    },
    shape: {
      control: 'select',
      options: ['rounded', 'pill', 'square'],
    },
    subtle: {
      control: 'boolean',
    },
    children: {
      control: 'text',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {
  args: {
    children: 'Badge',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge size="xs">Extra Small</Badge>
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
}

export const Subtle: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default" subtle>Default</Badge>
      <Badge variant="primary" subtle>Primary</Badge>
      <Badge variant="secondary" subtle>Secondary</Badge>
      <Badge variant="success" subtle>Success</Badge>
      <Badge variant="warning" subtle>Warning</Badge>
      <Badge variant="error" subtle>Error</Badge>
      <Badge variant="info" subtle>Info</Badge>
    </div>
  ),
}

export const Shapes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge shape="square">Square</Badge>
      <Badge shape="rounded">Rounded</Badge>
      <Badge shape="pill">Pill</Badge>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="success" icon={<CheckCircleIcon />}>Verified</Badge>
      <Badge variant="warning" icon={<ExclamationTriangleIcon />}>Warning</Badge>
      <Badge variant="error" icon={<XCircleIcon />}>Error</Badge>
      <Badge variant="info" icon={<InformationCircleIcon />}>Info</Badge>
      <Badge variant="secondary" icon={<StarIcon />}>Featured</Badge>
    </div>
  ),
}

export const GameStatusExamples: Story = {
  name: 'Real-world Example: Game Status',
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant="success" subtle icon={<CheckCircleIcon />}>Owned</Badge>
        <Badge variant="warning" subtle>Wishlist</Badge>
        <Badge variant="info" subtle>Played</Badge>
        <Badge variant="primary" subtle>Favorite</Badge>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Badge size="xs" variant="secondary">Strategy</Badge>
        <Badge size="xs" variant="secondary">Family</Badge>
        <Badge size="xs" variant="secondary">2-4 Players</Badge>
        <Badge size="xs" variant="secondary">60-90 min</Badge>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Badge variant="success" shape="pill">In Stock</Badge>
        <Badge variant="error" shape="pill">Out of Stock</Badge>
        <Badge variant="warning" shape="pill">Pre-Order</Badge>
      </div>
    </div>
  ),
}

export const WinnerBadges: Story = {
  name: 'Winner Badge Variants',
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <WinnerBadge type="winner" />
        <WinnerBadge type="nominee" />
        <WinnerBadge type="honorable" />
        <WinnerBadge type="special" />
      </div>
      
      <div className="flex flex-wrap gap-3">
        <WinnerBadge type="winner" size="md">Game of the Year</WinnerBadge>
        <WinnerBadge type="nominee" size="sm">Best Family Game</WinnerBadge>
        <WinnerBadge type="special" size="lg">Editor's Choice</WinnerBadge>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <WinnerBadge type="winner" shape="pill">Spiel des Jahres</WinnerBadge>
        <WinnerBadge type="nominee" shape="square">BGG Golden Geek</WinnerBadge>
      </div>
    </div>
  ),
}

export const CustomColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge customColor="bg-pink-400">Pink Badge</Badge>
      <Badge customColor="bg-orange-400">Orange Badge</Badge>
      <Badge customColor="bg-cyan-400">Cyan Badge</Badge>
      <Badge customColor="bg-emerald-400">Emerald Badge</Badge>
      <Badge customColor="bg-violet-400">Violet Badge</Badge>
    </div>
  ),
}

export const AllSizesAndVariants: Story = {
  render: () => (
    <div className="space-y-4">
      {(['xs', 'sm', 'md', 'lg'] as const).map(size => (
        <div key={size} className="flex flex-wrap gap-2 items-center">
          <span className="w-16 text-sm font-medium capitalize">{size}:</span>
          <Badge size={size} variant="default">Default</Badge>
          <Badge size={size} variant="primary">Primary</Badge>
          <Badge size={size} variant="success">Success</Badge>
          <Badge size={size} variant="warning">Warning</Badge>
          <Badge size={size} variant="error">Error</Badge>
        </div>
      ))}
    </div>
  ),
}
