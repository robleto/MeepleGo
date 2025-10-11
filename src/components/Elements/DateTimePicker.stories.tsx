import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import DateTimePicker from './DateTimePicker'

const meta: Meta<typeof DateTimePicker> = {
  title: 'Elements/DateTimePicker',
  component: DateTimePicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An accessible, styled date and time picker with calendar popover and time inputs. Emits a local YYYY-MM-DDTHH:MM string.',
      },
    },
  },
  argTypes: {
    label: { control: 'text' },
    required: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof DateTimePicker>

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = React.useState(() => {
      const d = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const yyyy = d.getFullYear()
      const mm = pad(d.getMonth() + 1)
      const dd = pad(d.getDate())
      const hh = pad(d.getHours())
      const mi = pad(d.getMinutes())
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
    })
    return (
      <div className="w-[320px]">
        <DateTimePicker {...args} value={value} onChange={setValue} label={args.label ?? 'Date & Time'} />
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Value: {value}</div>
      </div>
    )
  },
}

export const Required: Story = {
  ...Default,
  args: { required: true, label: 'When did you play?' },
}
