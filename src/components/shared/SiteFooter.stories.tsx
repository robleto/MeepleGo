import type { Meta, StoryObj } from '@storybook/react'
import SiteFooter from './SiteFooter'

const meta: Meta<typeof SiteFooter> = {
  title: 'Components/Shared/SiteFooter',
  component: SiteFooter,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const InPageContext: Story = {
  render: () => (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Page Content</h1>
          <p className="text-gray-600 mb-8">
            This shows how the footer appears at the bottom of a typical page.
            The footer provides consistent navigation and company information.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Card {i + 1}</h3>
                <p className="text-gray-600">
                  Sample content to demonstrate page layout with footer.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  ),
}
