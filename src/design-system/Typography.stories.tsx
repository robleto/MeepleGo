import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Typography',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Typography scale and text styles used throughout MeepleGo.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<Meta>

export const TypographyScale: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Headings</h1>
        <p className="text-gray-600">Standard heading hierarchy for consistent content structure.</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Heading 1 - 4xl font-bold</h1>
          <code className="text-sm text-gray-500">text-4xl font-bold</code>
        </div>
        <div>
          <h2 className="text-3xl font-semibold text-gray-900">Heading 2 - 3xl font-semibold</h2>
          <code className="text-sm text-gray-500">text-3xl font-semibold</code>
        </div>
        <div>
          <h3 className="text-2xl font-semibold text-gray-900">Heading 3 - 2xl font-semibold</h3>
          <code className="text-sm text-gray-500">text-2xl font-semibold</code>
        </div>
        <div>
          <h4 className="text-xl font-semibold text-gray-900">Heading 4 - xl font-semibold</h4>
          <code className="text-sm text-gray-500">text-xl font-semibold</code>
        </div>
        <div>
          <h5 className="text-lg font-medium text-gray-900">Heading 5 - lg font-medium</h5>
          <code className="text-sm text-gray-500">text-lg font-medium</code>
        </div>
        <div>
          <h6 className="text-base font-medium text-gray-900">Heading 6 - base font-medium</h6>
          <code className="text-sm text-gray-500">text-base font-medium</code>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Body Text</h2>
        <div className="space-y-3">
          <div>
            <p className="text-base text-gray-900">Body Large - Regular paragraph text</p>
            <code className="text-sm text-gray-500">text-base text-gray-900</code>
          </div>
          <div>
            <p className="text-sm text-gray-700">Body Small - Secondary text and descriptions</p>
            <code className="text-sm text-gray-500">text-sm text-gray-700</code>
          </div>
          <div>
            <p className="text-xs text-gray-600">Caption - Metadata and labels</p>
            <code className="text-sm text-gray-500">text-xs text-gray-600</code>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Special Text</h2>
        <div className="space-y-3">
          <div>
            <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Inline Code</code>
            <p className="text-sm text-gray-500 mt-1">px-2 py-1 bg-gray-100 rounded text-sm font-mono</p>
          </div>
          <div>
            <a href="#" className="text-blue-600 hover:text-blue-800 underline">Link Text</a>
            <p className="text-sm text-gray-500 mt-1">text-blue-600 hover:text-blue-800 underline</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Game-Specific Typography</h2>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Game Card Title</h3>
            <p className="text-sm text-gray-600 mb-2">Secondary info like publisher, year</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>2–4 players</span>
              <span>•</span>
              <span>60–90 min</span>
              <span>•</span>
              <span>2019</span>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-xl font-bold text-blue-900 mb-1">Award Category</h2>
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Game of the Year</h3>
            <p className="text-sm text-blue-700">Award description and context</p>
          </div>
        </div>
      </div>
    </div>
  ),
}