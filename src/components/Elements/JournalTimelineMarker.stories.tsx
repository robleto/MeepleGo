import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import JournalTimelineMarker from './JournalTimelineMarker'

const meta: Meta<typeof JournalTimelineMarker> = {
  title: 'Elements/JournalTimelineMarker',
  component: JournalTimelineMarker,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A timeline marker component for journal pages that can display either individual dates (month/day) or years, with a vertical line and dot marker. Designed for chronological content like play logs.',
      },
    },
  },
  argTypes: {
    date: {
      control: 'text',
      description: 'ISO date string (e.g., "2024-01-15")',
    },
    isLast: {
      control: 'boolean',
      description:
        'Whether this is the last marker (affects vertical line length)',
    },
    variant: {
      control: 'select',
      options: ['date', 'year'],
      description:
        'Display format: "date" shows month/day, "year" shows full year',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
}

export default meta
type Story = StoryObj<typeof JournalTimelineMarker>

export const Default: Story = {
  args: {
    date: '2024-01-15',
    isLast: false,
    variant: 'date',
  },
}

export const YearVariant: Story = {
  args: {
    date: '2024-01-15',
    isLast: false,
    variant: 'year',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Timeline marker showing only the year, useful for yearly groupings.',
      },
    },
  },
}

export const LastMarker: Story = {
  args: {
    date: '2024-12-25',
    isLast: true,
    variant: 'date',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Timeline marker for the last/most recent date with shortened vertical line.',
      },
    },
  },
}

export const JournalTimeline: Story = {
  render: () => (
    <div className="flex flex-col space-y-0 min-h-screen">
      <div className="flex">
        <JournalTimelineMarker date="2024-01-15" variant="date" />
        <div className="flex-1 p-6 bg-gray-50 rounded-r-lg">
          <h3 className="text-lg font-semibold mb-2">January 15, 2024</h3>
          <p className="text-gray-600">
            Played Wingspan with friends - fantastic engine building game!
          </p>
          <div className="mt-2 flex gap-2">
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded">
              strategy
            </span>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded">
              engine-building
            </span>
          </div>
        </div>
      </div>
      <div className="flex">
        <JournalTimelineMarker date="2024-01-14" variant="date" />
        <div className="flex-1 p-6 bg-gray-50 rounded-r-lg">
          <h3 className="text-lg font-semibold mb-2">January 14, 2024</h3>
          <p className="text-gray-600">
            Solo game of Spirit Island - challenging but rewarding!
          </p>
          <div className="mt-2 flex gap-2">
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded">
              solo
            </span>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded">
              cooperative
            </span>
          </div>
        </div>
      </div>
      <div className="flex">
        <JournalTimelineMarker date="2024-01-12" variant="date" isLast />
        <div className="flex-1 p-6 bg-gray-50 rounded-r-lg">
          <h3 className="text-lg font-semibold mb-2">January 12, 2024</h3>
          <p className="text-gray-600">
            Family game night with Ticket to Ride - always a crowd pleaser!
          </p>
          <div className="mt-2 flex gap-2">
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded">
              family
            </span>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded">
              route-building
            </span>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Multiple journal timeline markers showing how they connect vertically with play log content alongside.',
      },
    },
  },
}

export const DarkMode: Story = {
  args: {
    date: '2024-01-15',
    isLast: false,
    variant: 'date',
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story:
          'Journal timeline marker in dark mode with appropriate color adjustments.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="bg-gray-900 min-h-32 p-4">
          <Story />
        </div>
      </div>
    ),
  ],
}

export const DifferentDates: Story = {
  render: () => (
    <div className="flex flex-col space-y-0">
      <div className="flex">
        <JournalTimelineMarker date="2024-12-31" variant="date" />
        <div className="flex-1 p-4 bg-gray-50 rounded-r-lg">
          <h4 className="font-semibold">New Year's Eve Gaming</h4>
          <p className="text-sm text-gray-600">End of year celebration games</p>
        </div>
      </div>
      <div className="flex">
        <JournalTimelineMarker date="2024-07-04" variant="date" />
        <div className="flex-1 p-4 bg-gray-50 rounded-r-lg">
          <h4 className="font-semibold">Independence Day Games</h4>
          <p className="text-sm text-gray-600">Backyard BBQ and board games</p>
        </div>
      </div>
      <div className="flex">
        <JournalTimelineMarker date="2024-02-14" variant="date" isLast />
        <div className="flex-1 p-4 bg-gray-50 rounded-r-lg">
          <h4 className="font-semibold">Valentine's Day</h4>
          <p className="text-sm text-gray-600">Romantic 2-player games</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Timeline markers with various dates throughout the year.',
      },
    },
  },
}
