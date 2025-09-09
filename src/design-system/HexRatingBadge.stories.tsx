import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/HexRatingBadge',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Hexagonal rating badges used to display game ratings with appropriate colors.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<Meta>

export const PlaceholderHexBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-800">HexRatingBadge components will be documented here when implemented.</p>
        <p className="text-sm text-blue-600 mt-2">Should display ratings 1-10 with corresponding colors from the rating system.</p>
      </div>
    </div>
  ),
}