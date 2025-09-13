import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ToggleGroup } from './ToggleGroup'
import {
  Squares2X2Icon,
  ListBulletIcon,
  Bars3Icon,
  Bars2Icon,
  MinusIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'

const meta: Meta<typeof ToggleGroup> = {
  title: 'Controls/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Toggle group component for switching between mutually exclusive options. Supports icons, different sizes, and variants.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: { control: 'select', options: ['default', 'pills', 'cards'] },
    iconOnly: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof ToggleGroup>

const viewModeOptions = [
  { value: 'grid', label: 'Grid', icon: Squares2X2Icon, tooltip: 'Grid view' },
  { value: 'list', label: 'List', icon: ListBulletIcon, tooltip: 'List view' },
]

const densityOptions = [
  {
    value: 'detailed',
    label: 'Detailed',
    icon: Bars3Icon,
    tooltip: 'Detailed cards',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    icon: Bars2Icon,
    tooltip: 'Balanced cards',
  },
  {
    value: 'compact',
    label: 'Compact',
    icon: MinusIcon,
    tooltip: 'Compact cards',
  },
]

const themeOptions = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'system', label: 'System', icon: ComputerDesktopIcon },
]

export const ViewModeToggle: Story = {
  render: (args) => {
    const [value, setValue] = useState('grid')
    return (
      <ToggleGroup
        {...args}
        value={value}
        onChange={setValue}
        options={viewModeOptions}
      />
    )
  },
  args: {
    size: 'md',
    variant: 'default',
    iconOnly: false,
  },
}

export const DensityToggle: Story = {
  render: (args) => {
    const [value, setValue] = useState('balanced')
    return (
      <ToggleGroup
        {...args}
        value={value}
        onChange={setValue}
        options={densityOptions}
      />
    )
  },
  args: {
    size: 'md',
    variant: 'default',
    iconOnly: false,
  },
}

export const IconOnly: Story = {
  render: (args) => {
    const [value, setValue] = useState('grid')
    return (
      <ToggleGroup
        {...args}
        value={value}
        onChange={setValue}
        options={viewModeOptions}
      />
    )
  },
  args: {
    iconOnly: true,
  },
}

export const ThreeOptions: Story = {
  render: (args) => {
    const [value, setValue] = useState('system')
    return (
      <ToggleGroup
        {...args}
        value={value}
        onChange={setValue}
        options={themeOptions}
      />
    )
  },
  args: {
    size: 'md',
  },
}

export const Sizes: Story = {
  render: () => {
    const [small, setSmall] = useState('grid')
    const [medium, setMedium] = useState('list')
    const [large, setLarge] = useState('grid')

    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-2">Small</p>
          <ToggleGroup
            value={small}
            onChange={setSmall}
            options={viewModeOptions}
            size="sm"
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Medium (Default)</p>
          <ToggleGroup
            value={medium}
            onChange={setMedium}
            options={viewModeOptions}
            size="md"
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Large</p>
          <ToggleGroup
            value={large}
            onChange={setLarge}
            options={viewModeOptions}
            size="lg"
          />
        </div>
      </div>
    )
  },
}

export const Variants: Story = {
  render: () => {
    const [default1, setDefault1] = useState('grid')
    const [pills, setPills] = useState('list')
    const [cards, setCards] = useState('grid')

    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-2">Default</p>
          <ToggleGroup
            value={default1}
            onChange={setDefault1}
            options={viewModeOptions}
            variant="default"
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Pills</p>
          <ToggleGroup
            value={pills}
            onChange={setPills}
            options={viewModeOptions}
            variant="pills"
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Cards</p>
          <ToggleGroup
            value={cards}
            onChange={setCards}
            options={viewModeOptions}
            variant="cards"
          />
        </div>
      </div>
    )
  },
}

export const Disabled: Story = {
  render: (args) => {
    const [value, setValue] = useState('grid')
    return (
      <ToggleGroup
        {...args}
        value={value}
        onChange={setValue}
        options={viewModeOptions}
      />
    )
  },
  args: {
    disabled: true,
  },
}

export const RealWorldExamples: Story = {
  render: () => {
    const [viewMode, setViewMode] = useState('grid')
    const [density, setDensity] = useState('balanced')
    const [theme, setTheme] = useState('system')

    return (
      <div className="space-y-8 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-2">View Mode</label>
          <ToggleGroup
            value={viewMode}
            onChange={setViewMode}
            options={viewModeOptions}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Card Density</label>
          <ToggleGroup
            value={density}
            onChange={setDensity}
            options={densityOptions}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Theme Preference
          </label>
          <ToggleGroup
            value={theme}
            onChange={setTheme}
            options={themeOptions}
            iconOnly={true}
          />
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Selected Values:</h4>
          <p className="text-sm text-gray-600">
            View: {viewMode} • Density: {density} • Theme: {theme}
          </p>
        </div>
      </div>
    )
  },
}
