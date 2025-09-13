import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SearchInput } from './SearchInput'
import { useState } from 'react'

const meta: Meta<typeof SearchInput> = {
  title: 'Controls/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Airbnb-style search input with integrated round search/clear button. Includes focus states, backdrop blur, and accessibility features for autocomplete scenarios.',
      },
    },
  },
  argTypes: {
    value: { control: 'text' },
    placeholder: { control: 'text' },
    showClearButton: { control: 'boolean' },
    disabled: { control: 'boolean' },
    autoComplete: {
      control: 'select',
      options: ['list', 'none', 'inline', 'both'],
    },
  },
}

export default meta
type Story = StoryObj<typeof SearchInput>

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value || '')
    return (
      <div className="max-w-md mx-auto">
        <SearchInput
          {...args}
          value={value}
          onChange={setValue}
          onSearchClick={() => console.log('Search clicked:', value)}
        />
      </div>
    )
  },
  args: {
    placeholder: 'Search for games',
    showClearButton: true,
  },
}

export const WithValue: Story = {
  render: (args) => {
    const [value, setValue] = useState('wingspan')
    return (
      <div className="max-w-md mx-auto">
        <SearchInput
          {...args}
          value={value}
          onChange={setValue}
          onSearchClick={() => {
            console.log('Search action:', value)
            setValue('') // Clear on search
          }}
        />
      </div>
    )
  },
  args: {
    placeholder: 'Search for games',
    showClearButton: true,
  },
}

export const Disabled: Story = {
  render: (args) => {
    const [value, setValue] = useState('')
    return (
      <div className="max-w-md mx-auto">
        <SearchInput {...args} value={value} onChange={setValue} />
      </div>
    )
  },
  args: {
    placeholder: 'Search disabled',
    disabled: true,
  },
}

export const WithAutocomplete: Story = {
  render: (args) => {
    const [value, setValue] = useState('')
    return (
      <div className="max-w-md mx-auto">
        <SearchInput
          {...args}
          value={value}
          onChange={setValue}
          onKeyDown={(e) => {
            console.log('Key pressed:', e.key)
          }}
          onFocus={() => console.log('Input focused - show suggestions')}
        />
      </div>
    )
  },
  args: {
    placeholder: 'Type to see autocomplete',
    autoComplete: 'list',
    ariaExpanded: false,
    ariaControls: 'suggestions-list',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="max-w-xs mx-auto">
        <p className="text-sm font-medium mb-2 text-center">Small (max-w-xs)</p>
        <SearchInput value="" onChange={() => {}} placeholder="Small search" />
      </div>

      <div className="max-w-md mx-auto">
        <p className="text-sm font-medium mb-2 text-center">
          Medium (max-w-md)
        </p>
        <SearchInput value="" onChange={() => {}} placeholder="Medium search" />
      </div>

      <div className="max-w-lg mx-auto">
        <p className="text-sm font-medium mb-2 text-center">Large (max-w-lg)</p>
        <SearchInput value="" onChange={() => {}} placeholder="Large search" />
      </div>
    </div>
  ),
}

export const SearchStates: Story = {
  render: () => {
    const [emptyValue, setEmptyValue] = useState('')
    const [filledValue, setFilledValue] = useState('board games')

    return (
      <div className="space-y-6 max-w-md mx-auto">
        <div>
          <p className="text-sm font-medium mb-2">Empty State (Search Icon)</p>
          <SearchInput
            value={emptyValue}
            onChange={setEmptyValue}
            placeholder="Search for games"
            showClearButton={true}
            onSearchClick={() => console.log('Search clicked')}
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Filled State (Clear Icon)</p>
          <SearchInput
            value={filledValue}
            onChange={setFilledValue}
            placeholder="Search for games"
            showClearButton={true}
            onSearchClick={() => setFilledValue('')}
          />
        </div>
      </div>
    )
  },
}
