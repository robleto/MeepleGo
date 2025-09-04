import { TrophyIcon } from '@heroicons/react/24/outline'
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

interface WinnerBadgeProps {
  text?: string
  color?: string
  icon?: React.ReactNode
}

export const WinnerBadge = ({ text = 'Winner', color = 'bg-yellow-400', icon = <TrophyIcon className="w-4 h-4" /> }: WinnerBadgeProps) => (
  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-gray-900 ${color}`}>
    {icon}
    {text}
  </span>
)

const meta: Meta<typeof WinnerBadge> = {
  title: 'Design System/Components/Winner Badge',
  component: WinnerBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Badge component for displaying award winners with customizable text, color, and icon.'
      }
    }
  },
  argTypes: {
    text: { control: 'text' },
    color: { control: 'text' },
  },
  args: {
    text: 'Winner',
    color: 'bg-yellow-400',
  },
}
export default meta

type Story = StoryObj<typeof WinnerBadge>

export const Default: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <WinnerBadge text="Winner" color="bg-yellow-400" />
      <WinnerBadge text="Nominee" color="bg-blue-400" />
      <WinnerBadge text="Honorable Mention" color="bg-green-400" />
      <WinnerBadge text="Special Award" color="bg-purple-400" />
    </div>
  )
}
