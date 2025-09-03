import type { Meta, StoryObj } from '@storybook/react'
import RatingChip from './elements/RatingChip'

const meta: Meta<typeof RatingChip> = {
  title: 'Design System/RatingChip',
  component: RatingChip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Rating display chip with color-coded 1-10 scale and multiple size variants.'
      }
    }
  },
  argTypes: {
    value: { control: { type: 'number', min: 1, max: 10 } },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    subtle: { control: 'boolean' },
    interactive: { control: 'boolean' },
    fixedCircle: { control: 'boolean' },
  },
  args: {
    value: 8,
    size: 'md',
    subtle: true,
    interactive: false,
  },
}

export default meta

type Story = StoryObj<typeof RatingChip>

export const Default: Story = {}
export const SubtleVsSolid: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <RatingChip {...args} subtle value={8} />
      <RatingChip {...args} subtle={false} value={8} />
    </div>
  ),
}
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <RatingChip {...args} size="xs" value={7} />
      <RatingChip {...args} size="sm" value={7} />
      <RatingChip {...args} size="md" value={7} />
      <RatingChip {...args} size="lg" value={7} />
    </div>
  ),
}
