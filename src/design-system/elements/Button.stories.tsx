import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'
import { PlusIcon, TrashIcon, HeartIcon } from '@heroicons/react/24/outline'

const meta: Meta<typeof Button> = {
  title: 'Design System/Elements/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'outline'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
    shape: {
      control: 'select',
      options: ['default', 'rounded', 'pill', 'square'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
}

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button variant="primary" size="xs">Extra Small</Button>
      <Button variant="primary" size="sm">Small</Button>
      <Button variant="primary" size="md">Medium</Button>
      <Button variant="primary" size="lg">Large</Button>
    </div>
  ),
}

export const Shapes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button variant="primary" shape="default">Default</Button>
      <Button variant="primary" shape="rounded">Rounded</Button>
      <Button variant="primary" shape="pill">Pill</Button>
      <Button variant="primary" shape="square">Square</Button>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button variant="primary" leftIcon={<PlusIcon className="w-4 h-4" />}>
        Add Item
      </Button>
      <Button variant="danger" rightIcon={<TrashIcon className="w-4 h-4" />}>
        Delete
      </Button>
      <Button variant="ghost" leftIcon={<HeartIcon className="w-4 h-4" />} rightIcon={<PlusIcon className="w-4 h-4" />}>
        Like & Share
      </Button>
    </div>
  ),
}

export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Loading...',
  },
}

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled Button',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="primary" disabled>Disabled</Button>
    </div>
  ),
}
