import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

interface OverlayProps {
  children?: React.ReactNode
  color?: string
}

export const Overlay = ({ children = 'Overlay', color = 'bg-black/60' }: OverlayProps) => (
  <div className={`fixed inset-0 flex items-center justify-center ${color} z-50`}>
    <div className="p-8 bg-white rounded shadow-lg">{children}</div>
  </div>
)

const meta: Meta<typeof Overlay> = {
  title: 'Design System/Overlay',
  component: Overlay,
  argTypes: {
    children: { control: 'text' },
    color: { control: 'text' },
  },
  args: {
    children: 'Overlay',
    color: 'bg-black/60',
  },
}

export default meta

type Story = StoryObj<typeof Overlay>
export const Default: Story = {}
export const Light: Story = { args: { color: 'bg-white/40' } }
