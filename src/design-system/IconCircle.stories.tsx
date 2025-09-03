import type { Meta, StoryObj } from '@storybook/react'
// Updated path after design-system refactor (moved into elements/)
import { IconCircle, ICON_CIRCLE_TONES, ICON_CIRCLE_SIZES } from './elements/IconCircle'
import { TrophyIcon } from '@heroicons/react/24/outline'

const meta: Meta<typeof IconCircle> = {
  title: 'Design System/IconCircle',
  component: IconCircle,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Standardized circular icon backgrounds with semantic color tones and consistent sizing.'
      }
    }
  },
  argTypes: {
    size: { control: 'select', options: ICON_CIRCLE_SIZES },
    tone: { control: 'select', options: ICON_CIRCLE_TONES },
  }
};

export default meta;

type Story = StoryObj<typeof IconCircle>

export const Default: Story = {
  args: {
    size: 'md',
    tone: 'neutral',
    children: <TrophyIcon className="w-7 h-7" />
  }
}

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
  {ICON_CIRCLE_TONES.map(t => (
        <div key={t} className="text-center space-y-1">
          <IconCircle tone={t} size="md"><TrophyIcon className="w-6 h-6" /></IconCircle>
          <div className="text-[11px] text-gray-500">{t}</div>
        </div>
      ))}
    </div>
  )
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <IconCircle size="sm"><TrophyIcon className="w-5 h-5" /></IconCircle>
      <IconCircle size="md"><TrophyIcon className="w-6 h-6" /></IconCircle>
      <IconCircle size="lg"><TrophyIcon className="w-8 h-8" /></IconCircle>
    </div>
  )
}
