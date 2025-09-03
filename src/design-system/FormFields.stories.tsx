import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Form Fields',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Form field styles and components used throughout MeepleGo forms.'
      }
    }
  }
}
export default meta

export const Inputs: StoryObj = {
  render: () => (
    <div className="space-y-4 max-w-sm">
      <input className="w-full px-3 py-2 border rounded" placeholder="Text input" />
      <select className="w-full px-3 py-2 border rounded">
        <option>Option 1</option>
        <option>Option 2</option>
      </select>
      <div className="flex items-center gap-2">
        <input type="checkbox" className="mr-1" id="checkbox1" />
        <label htmlFor="checkbox1">Checkbox</label>
      </div>
      <div className="flex items-center gap-2">
        <input type="radio" name="radio" className="mr-1" id="radio1" />
        <label htmlFor="radio1">Radio</label>
      </div>
      <textarea className="w-full px-3 py-2 border rounded" placeholder="Textarea" />
      <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Button</button>
    </div>
  )
}
