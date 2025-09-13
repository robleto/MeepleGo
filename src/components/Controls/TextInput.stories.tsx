import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  MagnifyingGlassIcon,
  UserIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import TextInput from './TextInput'

const meta: Meta<typeof TextInput> = {
  title: 'Controls/Text Input',
  component: TextInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile text input component with support for different sizes, states, and icons. Supports all standard HTML input attributes.',
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
    placeholder: {
      control: 'text',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof TextInput>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="block text-sm font-medium mb-1">Small</label>
        <TextInput size="sm" placeholder="Small input" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Medium (Default)
        </label>
        <TextInput size="md" placeholder="Medium input" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Large</label>
        <TextInput size="lg" placeholder="Large input" />
      </div>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="block text-sm font-medium mb-1">Default</label>
        <TextInput placeholder="Default state" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-red-700">
          Error
        </label>
        <TextInput state="error" placeholder="Error state" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-green-700">
          Success
        </label>
        <TextInput state="success" placeholder="Success state" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-400">
          Disabled
        </label>
        <TextInput disabled placeholder="Disabled state" />
      </div>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="block text-sm font-medium mb-1">Left Icon</label>
        <TextInput leftIcon={<MagnifyingGlassIcon />} placeholder="Search..." />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Right Icon</label>
        <TextInput rightIcon={<UserIcon />} placeholder="Username" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Error with Icon
        </label>
        <TextInput
          state="error"
          leftIcon={<ExclamationCircleIcon />}
          placeholder="Invalid input"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Success with Icon
        </label>
        <TextInput
          state="success"
          rightIcon={<CheckCircleIcon />}
          placeholder="Valid input"
          value="john@example.com"
          readOnly
        />
      </div>
    </div>
  ),
}

export const InputTypes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <TextInput type="email" placeholder="email@example.com" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <TextInput type="password" placeholder="Enter password" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Number</label>
        <TextInput type="number" placeholder="Enter number" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">URL</label>
        <TextInput type="url" placeholder="https://example.com" />
      </div>
    </div>
  ),
}
