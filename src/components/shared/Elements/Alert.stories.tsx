import type { Meta, StoryObj } from '@storybook/react'
import { Alert } from './Alert'
import { useState } from 'react'

const meta: Meta<typeof Alert> = {
  title: 'Elements/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Alert component for displaying status messages with semantic color variants, icons, and optional dismissal.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: 'info',
    children: 'This is an informational alert message.',
  },
}

export const WithTitle: Story = {
  args: {
    variant: 'success',
    title: 'Success!',
    children: 'Your operation completed successfully.',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert variant="success">
        Operation completed successfully! Your changes have been saved.
      </Alert>
      <Alert variant="error">
        An error occurred while processing your request. Please try again.
      </Alert>
      <Alert variant="warning">
        Please review this warning before continuing with the action.
      </Alert>
      <Alert variant="info">
        Here's some helpful information about this feature.
      </Alert>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert variant="info" size="sm">
        Small alert message
      </Alert>
      <Alert variant="info" size="md">
        Medium alert message (default)
      </Alert>
      <Alert variant="info" size="lg">
        Large alert message with more content
      </Alert>
    </div>
  ),
}

export const WithTitles: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert variant="success" title="Success" size="sm">
        Small alert with title
      </Alert>
      <Alert variant="warning" title="Warning" size="md">
        Medium alert with title and longer content that wraps to multiple lines
      </Alert>
      <Alert variant="error" title="Error Details" size="lg">
        Large alert with title and detailed error message
      </Alert>
    </div>
  ),
}

export const WithoutIcons: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert variant="success" showIcon={false}>
        Success message without icon
      </Alert>
      <Alert variant="error" title="Error" showIcon={false}>
        Error message without icon
      </Alert>
    </div>
  ),
}

export const Dismissible: Story = {
  render: () => {
    const [alerts, setAlerts] = useState([
      { id: 1, variant: 'success' as const, message: 'Task completed successfully!' },
      { id: 2, variant: 'warning' as const, message: 'Please save your work before continuing.' },
      { id: 3, variant: 'info' as const, message: 'New features are now available.' },
    ])

    const dismissAlert = (id: number) => {
      setAlerts(alerts.filter(alert => alert.id !== id))
    }

    return (
      <div className="space-y-3 w-96">
        {alerts.map(alert => (
          <Alert
            key={alert.id}
            variant={alert.variant}
            dismissible
            onDismiss={() => dismissAlert(alert.id)}
          >
            {alert.message}
          </Alert>
        ))}
        {alerts.length === 0 && (
          <p className="text-gray-500 text-center py-4">All alerts dismissed!</p>
        )}
      </div>
    )
  },
}

export const ComplexContent: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert variant="warning" title="Update Available" dismissible>
        <div className="mt-2">
          <p className="text-sm">
            A new version of the application is available. 
            <a href="#" className="font-medium underline hover:no-underline">
              View changelog
            </a>
          </p>
          <div className="mt-3">
            <div className="flex">
              <button
                type="button"
                className="bg-yellow-100 px-2 py-1.5 rounded-md text-xs font-medium text-yellow-800 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Update now
              </button>
              <button
                type="button"
                className="ml-3 bg-transparent px-2 py-1.5 rounded-md text-xs font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Remind me later
              </button>
            </div>
          </div>
        </div>
      </Alert>
    </div>
  ),
}
