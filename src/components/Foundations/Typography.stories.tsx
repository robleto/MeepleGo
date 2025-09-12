import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Foundations/Typography',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Typography system with heading hierarchy and text variants used throughout MeepleGo.'
      }
    }
  }
}
export default meta
type Story = StoryObj

export const Headings: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold">Heading 1 - Display</h1>
      <h2 className="text-3xl font-semibold">Heading 2 - Page Title</h2>
      <h3 className="text-2xl font-medium">Heading 3 - Section</h3>
      <h4 className="text-xl font-normal">Heading 4 - Subsection</h4>
      <p className="text-base">Body text - Regular content</p>
      <p className="text-sm text-gray-600">Small text - Captions and meta</p>
      <p className="text-xs text-gray-500">Micro text - Labels and hints</p>
    </div>
  )
}

export const Subhead: StoryObj = {
  render: () => (
    <div className="space-y-2">
      <h2 className="text-2xl font-normal tracking-wide text-gray-700 dark:text-gray-300">
        Subhead Example
      </h2>
      <p className="text-sm text-gray-600 max-w-md">
        Subheads provide additional context below main headings. They use lighter weight and subtle colors.
      </p>
    </div>
  )
}