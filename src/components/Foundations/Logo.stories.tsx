import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Logo from './Logo'

const meta: Meta<typeof Logo> = {
  title: 'Foundations/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The MeepleGo brand logo component with consistent styling across different sizes and contexts. Can be used with or without text, and as a clickable link or static element.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the logo',
    },
    showText: {
      control: { type: 'boolean' },
      description: 'Whether to show the MeepleGo text alongside the icon',
    },
    href: {
      control: { type: 'text' },
      description: 'Optional href to make the logo a link',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
}

export default meta
type Story = StoryObj<typeof Logo>

export const Default: Story = {
  args: {},
}

export const Small: Story = {
  args: {
    size: 'sm',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
  },
}

export const IconOnly: Story = {
  args: {
    showText: false,
  },
}

export const IconOnlySmall: Story = {
  args: {
    size: 'sm',
    showText: false,
  },
}

export const IconOnlyLarge: Story = {
  args: {
    size: 'lg',
    showText: false,
  },
}

export const AsLink: Story = {
  args: {
    href: '/',
  },
}

export const Showcase: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">With Text</h3>
        <div className="flex items-center gap-6">
          <Logo size="sm" />
          <Logo size="md" />
          <Logo size="lg" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Logo Mark Only</h3>
        <div className="flex items-center gap-6">
          <Logo size="sm" showText={false} />
          <Logo size="md" showText={false} />
          <Logo size="lg" showText={false} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">As Links</h3>
        <div className="flex items-center gap-6">
          <Logo size="sm" href="/" />
          <Logo size="md" href="/" />
          <Logo size="lg" href="/" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dark Theme Preview</h3>
        <div className="dark bg-gray-900 p-4 rounded-lg">
          <div className="flex items-center gap-6">
            <Logo size="sm" />
            <Logo size="md" />
            <Logo size="lg" />
          </div>
        </div>
      </div>
    </div>
  ),
}
