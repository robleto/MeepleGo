import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import PageLayout from './PageLayout'
import Heading from './Heading'

const meta: Meta<typeof PageLayout> = {
  title: 'Components/PageLayout',
  component: PageLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <div className="space-y-6">
        <Heading as="h1" size="xl">
          Sample Page Content
        </Heading>
        <p className="text-gray-600">
          This is how content appears within the PageLayout component. The
          layout provides consistent spacing, max-width constraints, and
          responsive padding.
        </p>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Card Content</h3>
          <p className="text-gray-600">
            Page content can include various elements like cards, forms, tables,
            and other UI components.
          </p>
        </div>
      </div>
    ),
  },
}

export const WithMultipleCards: Story = {
  args: {
    children: (
      <div className="space-y-6">
        <Heading as="h1" size="xl">
          Dashboard Example
        </Heading>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Card {i + 1}</h3>
              <p className="text-gray-600">
                Sample card content to demonstrate the layout's responsive grid
                capabilities.
              </p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
}
