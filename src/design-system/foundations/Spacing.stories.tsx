import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Foundations/Spacing',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Spacing system showing Tailwind spacing scale used for consistent layout throughout MeepleGo.'
      }
    }
  }
}
export default meta

export const SpacingScale: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Tailwind Spacing Scale</h3>
      {[
        { value: 1, rem: '0.25rem', px: '4px' },
        { value: 2, rem: '0.5rem', px: '8px' },
        { value: 4, rem: '1rem', px: '16px' },
        { value: 6, rem: '1.5rem', px: '24px' },
        { value: 8, rem: '2rem', px: '32px' },
        { value: 12, rem: '3rem', px: '48px' },
        { value: 16, rem: '4rem', px: '64px' },
        { value: 24, rem: '6rem', px: '96px' }
      ].map(({ value, rem, px }) => (
        <div key={value} className="flex items-center gap-4">
          <div className={`h-4 bg-blue-500 rounded`} style={{ width: rem }} />
          <div className="text-sm font-mono min-w-[4rem]">w-{value}</div>
          <div className="text-xs text-gray-600">{rem} ({px})</div>
        </div>
      ))}
    </div>
  )
}
