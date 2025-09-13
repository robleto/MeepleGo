import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FunnelIcon, CalendarIcon } from '@heroicons/react/24/outline'
import Select from './Select'

const meta: Meta<typeof Select> = {
  title: 'Controls/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A styled select dropdown component with support for different sizes, states, and icons. Includes a custom chevron indicator.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'success'],
    },
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Select>

export const Default: Story = {
  render: () => (
    <Select>
      <option value="">Choose an option...</option>
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
      <option value="option3">Option 3</option>
    </Select>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="block text-sm font-medium mb-1">Small</label>
        <Select size="sm">
          <option value="">Choose size...</option>
          <option value="xs">Extra Small</option>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Medium (Default)
        </label>
        <Select size="md">
          <option value="">Choose size...</option>
          <option value="xs">Extra Small</option>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Large</label>
        <Select size="lg">
          <option value="">Choose size...</option>
          <option value="xs">Extra Small</option>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </Select>
      </div>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="block text-sm font-medium mb-1">Default</label>
        <Select>
          <option value="">Select an option...</option>
          <option value="valid">Valid Option</option>
          <option value="another">Another Option</option>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-red-700">
          Error
        </label>
        <Select state="error" value="">
          <option value="">Please select an option</option>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-green-700">
          Success
        </label>
        <Select state="success" value="selected">
          <option value="">Select an option...</option>
          <option value="selected">Selected Option ✓</option>
          <option value="other">Other Option</option>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-400">
          Disabled
        </label>
        <Select disabled>
          <option value="">Disabled select</option>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
        </Select>
      </div>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="block text-sm font-medium mb-1">Filter Select</label>
        <Select leftIcon={<FunnelIcon />}>
          <option value="">Filter by...</option>
          <option value="category">Category</option>
          <option value="publisher">Publisher</option>
          <option value="year">Year</option>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Date Select</label>
        <Select leftIcon={<CalendarIcon />} size="lg">
          <option value="">Select year...</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
          <option value="2021">2021</option>
        </Select>
      </div>
    </div>
  ),
}

export const WithPlaceholder: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="block text-sm font-medium mb-1">Game Category</label>
        <Select placeholder="Choose a category...">
          <option value="strategy">Strategy</option>
          <option value="family">Family</option>
          <option value="party">Party</option>
          <option value="thematic">Thematic</option>
          <option value="abstract">Abstract</option>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Player Count</label>
        <Select placeholder="How many players?" size="sm">
          <option value="1">1 Player</option>
          <option value="2">2 Players</option>
          <option value="3-4">3-4 Players</option>
          <option value="5+">5+ Players</option>
        </Select>
      </div>
    </div>
  ),
}

export const GameFilters: Story = {
  name: 'Real-world Example: Game Filters',
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="block text-sm font-medium mb-1">Sort by</label>
        <Select defaultValue="name">
          <option value="name">Name</option>
          <option value="year">Year Published</option>
          <option value="rating">Rating</option>
          <option value="complexity">Complexity</option>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Publisher</label>
        <Select placeholder="All publishers">
          <option value="asmodee">Asmodee</option>
          <option value="ffg">Fantasy Flight Games</option>
          <option value="stonemaier">Stonemaier Games</option>
          <option value="cmon">CMON</option>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Mechanics</label>
        <Select placeholder="Select mechanic..." leftIcon={<FunnelIcon />}>
          <option value="worker-placement">Worker Placement</option>
          <option value="deck-building">Deck Building</option>
          <option value="area-control">Area Control</option>
          <option value="cooperative">Cooperative</option>
        </Select>
      </div>
    </div>
  ),
}
