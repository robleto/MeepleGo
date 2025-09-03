import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

interface AlertProps {
  variant: 'success' | 'error' | 'warning' | 'info'
  children: React.ReactNode
}

const Alert = ({ variant, children }: AlertProps) => {
  const variants = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800', 
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800'
  }
  
  return (
    <div className={`p-4 rounded font-semibold ${variants[variant]}`}>
      {children}
    </div>
  )
}

const meta: Meta<typeof Alert> = {
  title: 'Design System/Alerts',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Alert component for displaying status messages with semantic color variants.'
      }
    }
  },
  argTypes: {
    variant: { control: 'select', options: ['success', 'error', 'warning', 'info'] }
  }
}
export default meta

type Story = StoryObj<typeof Alert>

export const Default: Story = {
  args: {
    variant: 'info',
    children: 'This is an info alert message'
  }
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Alert variant="success">Operation completed successfully</Alert>
      <Alert variant="error">An error occurred</Alert>
      <Alert variant="warning">Please review this warning</Alert>
      <Alert variant="info">Here's some helpful information</Alert>
    </div>
  )
}
