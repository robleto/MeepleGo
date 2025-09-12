import type { Meta, StoryObj } from '@storybook/react'
import Toggle from './Toggle'

const meta: Meta<typeof Toggle> = {
  title: 'Controls/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A toggle switch component for boolean settings. Provides an alternative to checkboxes with a more modern switch appearance.'
      }
    }
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
    labelPosition: {
      control: 'select',
      options: ['left', 'right'],
    },
    disabled: {
      control: 'boolean',
    },
    checked: {
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
type Story = StoryObj<typeof Toggle>

export const Default: Story = {
  args: {
    label: 'Enable notifications',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Toggle size="sm" label="Small toggle" />
      <Toggle size="md" label="Medium toggle (default)" />
      <Toggle size="lg" label="Large toggle" />
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <Toggle 
        label="Default state" 
        description="This is the default appearance" 
      />
      <Toggle 
        state="error" 
        label="Error state" 
        description="Something is wrong with this setting"
      />
      <Toggle 
        state="success" 
        label="Success state" 
        description="This setting is configured correctly"
        defaultChecked
      />
      <Toggle 
        disabled 
        label="Disabled state" 
        description="This option is not available"
      />
      <Toggle 
        disabled 
        defaultChecked 
        label="Disabled and on" 
        description="This option is locked in the on position"
      />
    </div>
  ),
}

export const LabelPositions: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Label on Right (Default)</h4>
        <div className="space-y-3">
          <Toggle 
            labelPosition="right"
            label="Push notifications" 
            description="Receive notifications on your device"
          />
          <Toggle 
            labelPosition="right"
            label="Email digest" 
            description="Get weekly summaries via email"
            defaultChecked
          />
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Label on Left</h4>
        <div className="space-y-3">
          <Toggle 
            labelPosition="left"
            label="Dark mode" 
            description="Use dark theme throughout the app"
          />
          <Toggle 
            labelPosition="left"
            label="Auto-save" 
            description="Automatically save your changes"
            defaultChecked
          />
        </div>
      </div>
    </div>
  ),
}

export const WithoutLabels: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <Toggle size="sm" />
        <span className="text-sm">Small standalone toggle</span>
      </div>
      <div className="flex items-center space-x-3">
        <Toggle size="md" />
        <span className="text-sm">Medium standalone toggle</span>
      </div>
      <div className="flex items-center space-x-3">
        <Toggle size="lg" />
        <span className="text-sm">Large standalone toggle</span>
      </div>
    </div>
  ),
}

export const CheckedStates: Story = {
  render: () => (
    <div className="space-y-4">
      <Toggle 
        label="Unchecked toggle" 
        description="This toggle is currently off"
        checked={false}
      />
      <Toggle 
        label="Checked toggle" 
        description="This toggle is currently on"
        checked={true}
      />
      <Toggle 
        label="Default checked" 
        description="This toggle defaults to on"
        defaultChecked
      />
    </div>
  ),
}

export const GameSettingsForm: Story = {
  name: 'Real-world Example: Game Settings',
  render: () => (
    <div className="space-y-6 max-w-md">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Game Collection Settings</h3>
        
        <div className="space-y-4">
          <Toggle 
            label="Public Collection"
            description="Allow others to see your game collection"
            defaultChecked
          />
          
          <Toggle 
            label="Show Ratings"
            description="Display your ratings on public games"
            size="sm"
          />
          
          <Toggle 
            label="Auto-track Plays"
            description="Automatically log plays when you rate games"
            state="success"
            defaultChecked
          />
          
          <Toggle 
            label="Expansion Grouping"
            description="Group expansions with their base games"
            defaultChecked
          />
        </div>
      </div>
      
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Notifications</h4>
        <div className="space-y-3">
          <Toggle 
            label="Friend Activity"
            description="Get notified when friends add games"
            size="sm"
          />
          
          <Toggle 
            label="New Releases"
            description="Alerts for games matching your wishlist"
            size="sm"
            defaultChecked
          />
          
          <Toggle 
            label="Weekly Digest"
            description="Summary of collection activity"
            size="sm"
          />
        </div>
      </div>
      
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Advanced</h4>
        <div className="space-y-3">
          <Toggle 
            label="Sync with BGG"
            description="Keep BoardGameGeek in sync"
            labelPosition="left"
            state="error"
          />
          
          <Toggle 
            label="Beta Features"
            description="Try experimental features"
            labelPosition="left"
            size="lg"
          />
        </div>
      </div>
    </div>
  ),
}
