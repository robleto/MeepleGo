import type { Meta, StoryObj } from '@storybook/react'
import Checkbox from './Checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'Controls/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible checkbox component with support for different sizes, states, labels, and descriptions. Includes indeterminate state support.'
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
    disabled: {
      control: 'boolean',
    },
    indeterminate: {
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
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox size="sm" label="Small checkbox" />
      <Checkbox size="md" label="Medium checkbox (default)" />
      <Checkbox size="lg" label="Large checkbox" />
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox 
        label="Default state" 
        description="This is the default appearance" 
      />
      <Checkbox 
        state="error" 
        label="Error state" 
        description="Something is wrong with this selection"
      />
      <Checkbox 
        state="success" 
        label="Success state" 
        description="This selection is valid"
        defaultChecked
      />
      <Checkbox 
        disabled 
        label="Disabled state" 
        description="This option is not available"
      />
      <Checkbox 
        disabled 
        defaultChecked 
        label="Disabled and checked" 
        description="This option is locked in"
      />
    </div>
  ),
}

export const WithDescriptions: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <Checkbox 
        label="Email notifications" 
        description="Receive email updates about your games and lists"
      />
      <Checkbox 
        label="Public profile" 
        description="Allow other users to see your game collection and reviews"
        defaultChecked
      />
      <Checkbox 
        label="Marketing communications" 
        description="Get notified about new features, board game recommendations, and special offers"
      />
    </div>
  ),
}

export const WithoutLabels: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <Checkbox size="sm" />
        <span className="text-sm">Small standalone checkbox</span>
      </div>
      <div className="flex items-center space-x-3">
        <Checkbox size="md" />
        <span className="text-sm">Medium standalone checkbox</span>
      </div>
      <div className="flex items-center space-x-3">
        <Checkbox size="lg" />
        <span className="text-sm">Large standalone checkbox</span>
      </div>
    </div>
  ),
}

export const IndeterminateState: Story = {
  name: 'Indeterminate State',
  render: () => (
    <div className="space-y-4 max-w-md">
      <Checkbox 
        indeterminate 
        label="Select all items" 
        description="Some items are currently selected"
      />
      <div className="ml-6 space-y-2 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <Checkbox size="sm" defaultChecked />
          <span>Item 1</span>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox size="sm" defaultChecked />
          <span>Item 2</span>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox size="sm" />
          <span>Item 3</span>
        </div>
      </div>
    </div>
  ),
}

export const FormExample: Story = {
  name: 'Real-world Example: Game Preferences',
  render: () => (
    <div className="space-y-6 max-w-md">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Game Preferences</h3>
        
        <div className="space-y-4">
          <Checkbox 
            label="Show owned games only"
            description="Filter your collection to only display games you own"
          />
          
          <Checkbox 
            label="Include expansions"
            description="Show expansion packs alongside base games"
            defaultChecked
          />
          
          <Checkbox 
            label="Hide played games"
            description="Don't show games you've already logged plays for"
          />
          
          <Checkbox 
            label="Notifications"
            description="Get alerts when friends add games or create lists"
            state="success"
            defaultChecked
          />
        </div>
      </div>
      
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Quick Filters</h4>
        <div className="grid grid-cols-2 gap-3">
          <Checkbox label="Strategy Games" size="sm" />
          <Checkbox label="Family Games" size="sm" />
          <Checkbox label="Party Games" size="sm" />
          <Checkbox label="Two-Player" size="sm" />
        </div>
      </div>
    </div>
  ),
}
