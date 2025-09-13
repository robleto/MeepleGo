import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FilterButton } from './FilterButton'
import {
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

const meta: Meta<typeof FilterButton> = {
  title: 'Controls/FilterButton',
  component: FilterButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Filter button with optional badge count for active filters. Supports different variants and icons.',
      },
    },
  },
  argTypes: {
    activeCount: { control: 'number' },
    showText: { control: 'boolean' },
    disabled: { control: 'boolean' },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary'],
    },
  },
}

export default meta
type Story = StoryObj<typeof FilterButton>

export const Default: Story = {
  args: {
    onClick: () => console.log('Filter clicked'),
    activeCount: 0,
    showText: true,
  },
}

export const WithActiveBadge: Story = {
  args: {
    onClick: () => console.log('Filter clicked'),
    activeCount: 3,
    showText: true,
  },
}

export const IconOnly: Story = {
  args: {
    onClick: () => console.log('Filter clicked'),
    activeCount: 0,
    showText: false,
  },
}

export const IconOnlyWithBadge: Story = {
  args: {
    onClick: () => console.log('Filter clicked'),
    activeCount: 5,
    showText: false,
  },
}

export const CustomIcon: Story = {
  args: {
    onClick: () => console.log('Adjustments clicked'),
    icon: AdjustmentsHorizontalIcon,
    children: 'Settings',
    activeCount: 2,
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <FilterButton onClick={() => {}} variant="default">
        Default
      </FilterButton>
      <FilterButton onClick={() => {}} variant="primary" activeCount={2}>
        Primary
      </FilterButton>
      <FilterButton onClick={() => {}} variant="secondary">
        Secondary
      </FilterButton>
    </div>
  ),
}

export const BadgeNumbers: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <FilterButton onClick={() => {}} activeCount={1} />
      <FilterButton onClick={() => {}} activeCount={9} />
      <FilterButton onClick={() => {}} activeCount={42} />
      <FilterButton onClick={() => {}} activeCount={99} />
      <FilterButton onClick={() => {}} activeCount={150} />
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    onClick: () => console.log('Should not fire'),
    activeCount: 3,
    disabled: true,
  },
}

export const CustomContent: Story = {
  render: () => (
    <div className="flex gap-4">
      <FilterButton
        onClick={() => {}}
        icon={MagnifyingGlassIcon}
        activeCount={1}
      >
        Search Filters
      </FilterButton>
      <FilterButton
        onClick={() => {}}
        icon={AdjustmentsHorizontalIcon}
        variant="primary"
      >
        Advanced
      </FilterButton>
    </div>
  ),
}

export const ResponsiveText: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Text shows on sm+ screens, hidden on mobile (resize window to test)
      </p>
      <div className="flex gap-4">
        <FilterButton onClick={() => {}} activeCount={3} showText={true} />
        <FilterButton onClick={() => {}} activeCount={0} showText={false} />
      </div>
    </div>
  ),
}
