import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import OnboardingModal from '@/components/Components/OnboardingModal'
import { Button } from '@/components/Elements/Button'

const meta = {
  title: 'Components/OnboardingModal',
  component: OnboardingModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    visible: {
      control: 'boolean',
      description: 'Whether the modal is visible',
    },
    onClose: {
      action: 'closed',
      description: 'Callback when modal is closed',
    },
    onComplete: {
      action: 'completed',
      description: 'Callback when onboarding is completed',
    },
  },
} satisfies Meta<typeof OnboardingModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    visible: true,
  },
  decorators: [
    (Story) => (
      <div>
        <Story />
      </div>
    ),
  ],
}

export const Interactive: Story = {
  render: (args) => {
    const [visible, setVisible] = useState(false)
    
    return (
      <div>
        <Button onClick={() => setVisible(true)}>
          Show Onboarding Modal
        </Button>
        <OnboardingModal
          {...args}
          visible={visible}
          onClose={() => {
            setVisible(false)
            args.onClose?.()
          }}
          onComplete={() => {
            setVisible(false)
            args.onComplete?.()
          }}
        />
      </div>
    )
  },
}

export const ClosedByDefault: Story = {
  args: {
    visible: false,
  },
  decorators: [
    (Story) => (
      <div>
        <p className="text-sm text-gray-500 mb-4">
          The modal is closed by default. Toggle the "visible" control to show it.
        </p>
        <Story />
      </div>
    ),
  ],
}
