import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Alerts',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Alert components for displaying important information and notifications.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<Meta>

export const PlaceholderAlerts: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-800">Alert components will be documented here when implemented.</p>
      </div>
    </div>
  ),
}