import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Form Fields',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Standard form field components used throughout the application.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<Meta>

export const BasicFormFields: Story = {
  render: () => (
    <div className="max-w-md space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Input
        </label>
        <input 
          type="text" 
          placeholder="Enter game name..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Dropdown
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option>Select a category...</option>
          <option>Strategy</option>
          <option>Family</option>
          <option>Thematic</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Textarea
        </label>
        <textarea 
          placeholder="Add notes about this game..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  ),
}