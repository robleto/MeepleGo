import type { Meta, StoryObj } from '@storybook/react'
import { GameImageFallback } from './GameImageFallback'

const meta: Meta<typeof GameImageFallback> = {
  title: 'Components/Shared/GameImageFallback',
  component: GameImageFallback,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['square', 'thumb'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Square: Story = {
  args: {
    name: 'Wingspan',
    variant: 'square',
    className: 'w-48 h-48',
  },
}

export const Thumb: Story = {
  args: {
    name: 'Azul',
    variant: 'thumb',
  },
}

export const SingleWord: Story = {
  args: {
    name: 'Catan',
    variant: 'square',
    className: 'w-32 h-32',
  },
}

export const LongName: Story = {
  args: {
    name: 'Terraforming Mars: Ares Expedition',
    variant: 'square',
    className: 'w-40 h-40',
  },
}

export const ShortInitials: Story = {
  args: {
    name: 'Go',
    variant: 'square',
    className: 'w-24 h-24',
  },
}

export const VariantComparison: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div>
        <p className="text-sm text-gray-600 mb-2 text-center">Square Variant</p>
        <GameImageFallback name="Wingspan" variant="square" className="w-32 h-32" />
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-2 text-center">Thumb Variant</p>
        <GameImageFallback name="Wingspan" variant="thumb" />
      </div>
    </div>
  ),
}

export const GameCollection: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4">
      {[
        'Wingspan',
        'Azul',
        'Ticket to Ride',
        'Splendor',
        'King of Tokyo',
        'Pandemic',
        'Catan',
        'Gloomhaven',
      ].map((gameName) => (
        <div key={gameName} className="text-center">
          <GameImageFallback name={gameName} variant="square" className="w-20 h-20 mb-2" />
          <p className="text-xs text-gray-600 truncate">{gameName}</p>
        </div>
      ))}
    </div>
  ),
}
