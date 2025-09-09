import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Icons',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Icon components and usage patterns for MeepleGo.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<Meta>

export const PlaceholderIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-800">Icon components will be documented here when implemented.</p>
        <p className="text-sm text-blue-600 mt-2">See Iconography Guide for complete icon system documentation.</p>
      </div>
    </div>
  ),
}