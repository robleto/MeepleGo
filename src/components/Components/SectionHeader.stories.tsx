import type { Meta, StoryObj } from '@storybook/react'
import SectionHeader from './SectionHeader'

const meta = {
  title: 'Components/SectionHeader',
  component: SectionHeader,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A standardized section header component using the Heading component with "section" variant. Commonly used across pages to introduce major content sections. Supports optional right slot for actions or filters.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    rightSlot: {
      description: 'Optional content to display on the right side (buttons, filters, etc.)',
    },
  },
} satisfies Meta<typeof SectionHeader>

export default meta
type Story = StoryObj<typeof meta>

// Default section header
export const Default: Story = {
  args: {
    title: 'My Rankings',
  },
}

// With subtitle
export const WithSubtitle: Story = {
  args: {
    title: 'Industry Awards',
  },
}

// With action button
export const WithAction: Story = {
  args: {
    title: 'My Lists',
    rightSlot: (
      <button className="px-4 py-2 rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100 text-sm font-medium transition-colors">
        Create New List
      </button>
    ),
  },
}

// With filter button
export const WithFilter: Story = {
  args: {
    title: 'Game Library',
    rightSlot: (
      <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
      </button>
    ),
  },
}

// With view mode toggle
export const WithViewToggle: Story = {
  args: {
    title: 'All Games',
    rightSlot: (
      <div className="flex items-center gap-1 border border-gray-300 rounded-md p-1">
        <button className="px-2 py-1 rounded bg-gray-100 text-gray-900">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button className="px-2 py-1 rounded text-gray-500 hover:bg-gray-50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    ),
  },
}

// No margin variant (for sticky headers)
export const NoMargin: Story = {
  args: {
    title: 'Rankings',
    containerClassName: 'flex items-end justify-between mb-0',
  },
}

// Custom title styling
export const CustomStyling: Story = {
  args: {
    title: 'Featured Collections',
    titleClassName: 'mb-2',
    containerClassName: 'flex items-end justify-between mb-6',
  },
}

// Multiple actions
export const MultipleActions: Story = {
  args: {
    title: 'Awards',
    rightSlot: (
      <div className="flex items-center gap-2">
        <select className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm">
          <option>2026</option>
          <option>2025</option>
          <option>2024</option>
        </select>
        <button className="px-3 py-1.5 rounded-md bg-amber-500 text-white text-sm font-medium hover:bg-amber-600">
          Edit
        </button>
      </div>
    ),
  },
}

// Example page layout
export const PageExample = () => (
  <div className="max-w-6xl mx-auto p-8 space-y-12">
    <SectionHeader
      title="My Rankings"
      rightSlot={
        <button className="text-sm text-sky-600 hover:text-sky-700 font-medium">
          View All →
        </button>
      }
    />
    <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center text-gray-500">
      Content goes here
    </div>

    <SectionHeader
      title="My Lists"
      rightSlot={
        <button className="px-4 py-2 rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100 text-sm font-medium">
          + New List
        </button>
      }
    />
    <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center text-gray-500">
      Content goes here
    </div>

    <SectionHeader title="Industry Awards" />
    <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center text-gray-500">
      Content goes here
    </div>
  </div>
)
