import type { Meta, StoryObj } from '@storybook/react'
import { useRef, useState } from 'react'
import OnboardingTooltip from '@/components/Components/OnboardingTooltip'
import { Button } from '@/components/Elements/Button'

const meta = {
  title: 'Components/OnboardingTooltip',
  component: OnboardingTooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    visible: {
      control: 'boolean',
      description: 'Whether the tooltip is visible',
    },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Placement of the tooltip relative to target',
    },
    title: {
      control: 'text',
      description: 'Tooltip title',
    },
    description: {
      control: 'text',
      description: 'Tooltip description text',
    },
  },
} satisfies Meta<typeof OnboardingTooltip>

export default meta
type Story = StoryObj<typeof meta>

// Story with a simple button target
export const Bottom: Story = {
  render: (args) => {
    const targetRef = useRef<HTMLButtonElement>(null)
    const [visible, setVisible] = useState(true)

    return (
      <div style={{ padding: '200px' }}>
        <Button ref={targetRef} onClick={() => setVisible(!visible)}>
          Target Button
        </Button>
        <OnboardingTooltip
          {...args}
          targetRef={targetRef}
          visible={visible}
          title="Rate a Game"
          description="Click the star icons to give this game a rating from 1 to 10."
          placement="bottom"
          onDismiss={() => setVisible(false)}
        />
      </div>
    )
  },
}

export const Top: Story = {
  render: (args) => {
    const targetRef = useRef<HTMLButtonElement>(null)
    const [visible, setVisible] = useState(true)

    return (
      <div style={{ padding: '200px' }}>
        <Button ref={targetRef} onClick={() => setVisible(!visible)}>
          Target Button
        </Button>
        <OnboardingTooltip
          {...args}
          targetRef={targetRef}
          visible={visible}
          title="Your Top Rated Games"
          description="This shows games you've rated 8 or higher."
          placement="top"
          onDismiss={() => setVisible(false)}
        />
      </div>
    )
  },
}

export const Left: Story = {
  render: (args) => {
    const targetRef = useRef<HTMLButtonElement>(null)
    const [visible, setVisible] = useState(true)

    return (
      <div style={{ padding: '200px' }}>
        <Button ref={targetRef} onClick={() => setVisible(!visible)}>
          Target Button
        </Button>
        <OnboardingTooltip
          {...args}
          targetRef={targetRef}
          visible={visible}
          title="Add to List"
          description="Save this game to one of your custom lists."
          placement="left"
          onDismiss={() => setVisible(false)}
        />
      </div>
    )
  },
}

export const Right: Story = {
  render: (args) => {
    const targetRef = useRef<HTMLButtonElement>(null)
    const [visible, setVisible] = useState(true)

    return (
      <div style={{ padding: '200px' }}>
        <Button ref={targetRef} onClick={() => setVisible(!visible)}>
          Target Button
        </Button>
        <OnboardingTooltip
          {...args}
          targetRef={targetRef}
          visible={visible}
          title="Quick Actions"
          description="Access frequently used actions from here."
          placement="right"
          onDismiss={() => setVisible(false)}
        />
      </div>
    )
  },
}

export const WithAction: Story = {
  render: (args) => {
    const targetRef = useRef<HTMLButtonElement>(null)
    const [visible, setVisible] = useState(true)

    return (
      <div style={{ padding: '200px' }}>
        <Button ref={targetRef} onClick={() => setVisible(!visible)}>
          Target Button
        </Button>
        <OnboardingTooltip
          {...args}
          targetRef={targetRef}
          visible={visible}
          title="Create Your First Award"
          description="Personal awards help you celebrate your favorite games from each year."
          placement="bottom"
          action={{
            label: 'Create Award',
            onClick: () => alert('Creating award...'),
          }}
          onDismiss={() => setVisible(false)}
        />
      </div>
    )
  },
}

export const Interactive: Story = {
  render: (args) => {
    const targetRef = useRef<HTMLButtonElement>(null)
    const [visible, setVisible] = useState(false)
    const [placement, setPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom')

    return (
      <div style={{ padding: '200px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <Button onClick={() => setVisible(!visible)}>
            Toggle Tooltip
          </Button>
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as any)}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
            }}
          >
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
        <Button ref={targetRef}>
          Target Button
        </Button>
        <OnboardingTooltip
          {...args}
          targetRef={targetRef}
          visible={visible}
          title="Interactive Example"
          description="Toggle the tooltip and change its placement using the controls above."
          placement={placement}
          onDismiss={() => setVisible(false)}
        />
      </div>
    )
  },
}
