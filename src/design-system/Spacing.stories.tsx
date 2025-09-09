import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Spacing',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Spacing system and layout guidelines for consistent component spacing.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<Meta>

const SpacingExample = ({ size, label }: { size: string, label: string }) => (
  <div className="flex items-center gap-4">
    <div className={`bg-blue-500 ${size}`}></div>
    <code className="text-sm font-mono">{label}</code>
  </div>
)

export const SpacingScale: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Tailwind Spacing Scale</h2>
        <p className="text-gray-600 mb-6">Standard spacing values used throughout the application.</p>
      </div>
      
      <div className="space-y-3">
        <SpacingExample size="w-1 h-1" label="1 (4px)" />
        <SpacingExample size="w-2 h-2" label="2 (8px)" />
        <SpacingExample size="w-3 h-3" label="3 (12px)" />
        <SpacingExample size="w-4 h-4" label="4 (16px)" />
        <SpacingExample size="w-5 h-5" label="5 (20px)" />
        <SpacingExample size="w-6 h-6" label="6 (24px)" />
        <SpacingExample size="w-8 h-8" label="8 (32px)" />
        <SpacingExample size="w-10 h-10" label="10 (40px)" />
        <SpacingExample size="w-12 h-12" label="12 (48px)" />
        <SpacingExample size="w-16 h-16" label="16 (64px)" />
      </div>
    </div>
  ),
}