import type { Meta, StoryObj } from '@storybook/react'
import TimelineMarker from './TimelineMarker'

const meta: Meta<typeof TimelineMarker> = {
  title: 'Elements/TimelineMarker',
  component: TimelineMarker,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A timeline marker component used in awards pages to show year progression with a vertical line, dot marker, and rotated year label.'
      }
    }
  },
  argTypes: {
    year: {
      control: { type: 'number', min: 1900, max: 2030, step: 1 },
      description: 'The year to display on the timeline marker'
    },
    isLast: {
      control: 'boolean',
      description: 'Whether this is the last marker (affects vertical line length)'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply'
    }
  }
}

export default meta
type Story = StoryObj<typeof TimelineMarker>

export const Default: Story = {
  args: {
    year: 2024,
    isLast: false
  }
}

export const LastMarker: Story = {
  args: {
    year: 2025,
    isLast: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Timeline marker for the last/most recent year with shortened vertical line.'
      }
    }
  }
}

export const MultipleMarkers: Story = {
  render: () => (
    <div className="flex flex-col space-y-0 min-h-screen">
      <div className="flex">
        <TimelineMarker year={2022} />
        <div className="flex-1 p-6 bg-gray-50 rounded-r-lg">
          <h3 className="text-lg font-semibold mb-2">2022 Awards</h3>
          <p className="text-gray-600">Content for 2022 awards year...</p>
        </div>
      </div>
      <div className="flex">
        <TimelineMarker year={2023} />
        <div className="flex-1 p-6 bg-gray-50 rounded-r-lg">
          <h3 className="text-lg font-semibold mb-2">2023 Awards</h3>
          <p className="text-gray-600">Content for 2023 awards year...</p>
        </div>
      </div>
      <div className="flex">
        <TimelineMarker year={2024} />
        <div className="flex-1 p-6 bg-gray-50 rounded-r-lg">
          <h3 className="text-lg font-semibold mb-2">2024 Awards</h3>
          <p className="text-gray-600">Content for 2024 awards year...</p>
        </div>
      </div>
      <div className="flex">
        <TimelineMarker year={2025} isLast />
        <div className="flex-1 p-6 bg-gray-50 rounded-r-lg">
          <h3 className="text-lg font-semibold mb-2">2025 Awards</h3>
          <p className="text-gray-600">Most recent awards year...</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple timeline markers showing how they connect vertically with content alongside.'
      }
    }
  }
}

export const DarkMode: Story = {
  args: {
    year: 2024,
    isLast: false
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Timeline marker in dark mode with appropriate color adjustments.'
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="bg-gray-900 min-h-32 p-4">
          <Story />
        </div>
      </div>
    )
  ]
}

export const CustomYear: Story = {
  args: {
    year: 1995,
    isLast: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Timeline marker with a custom year to show flexibility.'
      }
    }
  }
}
