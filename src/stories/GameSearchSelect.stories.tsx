import type { Meta, StoryObj } from '@storybook/react'
import GameSearchSelect, { SuggestionGame } from './GameSearchSelect'

const meta = {
  title: 'Components/GameSearchSelect',
  component: GameSearchSelect,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    hero: {
      control: 'boolean',
      description: 'Use larger hero variant styling',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the search input',
    },
    autoFocus: {
      control: 'boolean',
      description: 'Auto-focus the input on mount',
    },
  },
} satisfies Meta<typeof GameSearchSelect>

export default meta
type Story = StoryObj<typeof meta>

const handleSelect = (game: SuggestionGame) => {
  console.log('Selected game:', game)
  alert(`Selected: ${game.name} (${game.year_published})`)
}

export const Default: Story = {
  args: {
    onSelect: handleSelect,
    placeholder: 'Search these games…',
    autoFocus: false,
    hero: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
}

export const Hero: Story = {
  args: {
    onSelect: handleSelect,
    placeholder: 'Find your first game...',
    autoFocus: false,
    hero: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '600px' }}>
        <Story />
      </div>
    ),
  ],
}

export const AutoFocus: Story = {
  args: {
    onSelect: handleSelect,
    placeholder: 'Search these games…',
    autoFocus: true,
    hero: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
}

export const CustomPlaceholder: Story = {
  args: {
    onSelect: handleSelect,
    placeholder: 'Type to search board games...',
    autoFocus: false,
    hero: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
}
