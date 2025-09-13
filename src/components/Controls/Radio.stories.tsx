import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Radio from './Radio'

const meta: Meta<typeof Radio> = {
  title: 'Controls/Radio Button',
  component: Radio,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Radio buttons for selecting one option from a group. Should be used within a fieldset or group where only one selection is allowed.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'success'],
    },
    disabled: {
      control: 'boolean',
    },
    label: {
      control: 'text',
    },
    description: {
      control: 'text',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Radio>

export const Default: Story = {
  args: {
    label: 'Select this option',
    name: 'example',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Radio size="sm" label="Small radio button" name="size-demo" />
      <Radio size="md" label="Medium radio button (default)" name="size-demo" />
      <Radio size="lg" label="Large radio button" name="size-demo" />
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <Radio
        label="Default state"
        description="This is the default appearance"
        name="state-demo"
      />
      <Radio
        state="error"
        label="Error state"
        description="This option has validation errors"
        name="state-demo"
      />
      <Radio
        state="success"
        label="Success state"
        description="This option is valid"
        name="state-demo"
        defaultChecked
      />
      <Radio
        disabled
        label="Disabled state"
        description="This option is not available"
        name="state-demo"
      />
      <Radio
        disabled
        defaultChecked
        label="Disabled and selected"
        description="This option is locked as selected"
        name="disabled-demo"
      />
    </div>
  ),
}

export const WithDescriptions: Story = {
  render: () => (
    <fieldset className="space-y-4">
      <legend className="text-lg font-medium text-gray-900 mb-3">
        Choose your preference
      </legend>
      <Radio
        name="preference"
        label="Email notifications"
        description="Receive updates via email"
      />
      <Radio
        name="preference"
        label="SMS notifications"
        description="Get text messages for important updates"
      />
      <Radio
        name="preference"
        label="Push notifications"
        description="Receive notifications in the app"
        defaultChecked
      />
      <Radio
        name="preference"
        label="No notifications"
        description="Don't send any notifications"
      />
    </fieldset>
  ),
}

export const WithoutLabels: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <Radio size="sm" name="standalone-sm" />
        <span className="text-sm">Small standalone radio</span>
      </div>
      <div className="flex items-center space-x-3">
        <Radio size="md" name="standalone-md" />
        <span className="text-sm">Medium standalone radio</span>
      </div>
      <div className="flex items-center space-x-3">
        <Radio size="lg" name="standalone-lg" />
        <span className="text-sm">Large standalone radio</span>
      </div>
    </div>
  ),
}

export const GameViewMode: Story = {
  name: 'Real-world Example: Game View Mode',
  render: () => (
    <fieldset className="space-y-4 max-w-md">
      <legend className="text-lg font-medium text-gray-900 mb-3">
        View Options
      </legend>

      <Radio
        name="view-mode"
        label="Grid View"
        description="See games as cards in a grid layout"
        defaultChecked
      />

      <Radio
        name="view-mode"
        label="List View"
        description="View games in a detailed list format"
      />

      <Radio
        name="view-mode"
        label="Compact View"
        description="Condensed list with minimal details"
      />
    </fieldset>
  ),
}

export const PlayerCount: Story = {
  name: 'Real-world Example: Player Count Filter',
  render: () => (
    <fieldset className="space-y-3 max-w-sm">
      <legend className="text-sm font-medium text-gray-900 mb-3">
        Filter by Player Count
      </legend>

      <Radio
        name="players"
        size="sm"
        label="1 Player"
        description="Solo games"
      />

      <Radio
        name="players"
        size="sm"
        label="2 Players"
        description="Perfect for couples"
      />

      <Radio
        name="players"
        size="sm"
        label="3-4 Players"
        description="Small group games"
      />

      <Radio
        name="players"
        size="sm"
        label="5+ Players"
        description="Party games"
      />

      <Radio
        name="players"
        size="sm"
        label="Any Player Count"
        description="Show all games"
        defaultChecked
      />
    </fieldset>
  ),
}

export const SortOptions: Story = {
  name: 'Real-world Example: Sort Options',
  render: () => (
    <fieldset className="space-y-3">
      <legend className="text-base font-medium text-gray-900 mb-3">
        Sort Games By
      </legend>

      <Radio
        name="sort"
        label="Name (A-Z)"
        description="Alphabetical order"
        defaultChecked
      />

      <Radio
        name="sort"
        label="Rating (High to Low)"
        description="Highest rated games first"
      />

      <Radio
        name="sort"
        label="Year Published"
        description="Newest games first"
      />

      <Radio
        name="sort"
        label="Recently Added"
        description="Latest additions to collection"
      />

      <Radio
        name="sort"
        label="Play Count"
        description="Most played games first"
      />
    </fieldset>
  ),
}

export const MultipleGroups: Story = {
  name: 'Multiple Radio Groups',
  render: () => (
    <div className="space-y-8 max-w-lg">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-900 mb-3">
          Difficulty Level
        </legend>
        <Radio name="difficulty" size="sm" label="Beginner" />
        <Radio
          name="difficulty"
          size="sm"
          label="Intermediate"
          defaultChecked
        />
        <Radio name="difficulty" size="sm" label="Advanced" />
        <Radio name="difficulty" size="sm" label="Expert" />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-900 mb-3">
          Game Length
        </legend>
        <Radio name="length" size="sm" label="Quick (< 30 min)" />
        <Radio
          name="length"
          size="sm"
          label="Medium (30-90 min)"
          defaultChecked
        />
        <Radio name="length" size="sm" label="Long (90+ min)" />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-900 mb-3">
          Theme Preference
        </legend>
        <Radio name="theme" size="sm" label="Abstract" />
        <Radio name="theme" size="sm" label="Thematic" />
        <Radio name="theme" size="sm" label="No preference" defaultChecked />
      </fieldset>
    </div>
  ),
}
