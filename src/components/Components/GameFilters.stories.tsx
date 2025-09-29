import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import SearchandFilters from './SearchandFilters'
import React, { useState } from 'react'

const meta: Meta<typeof SearchandFilters> = {
  title: 'Components/Deprecated/GameFilters (Legacy Story) ',
  component: SearchandFilters,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Main game filters component with search, view mode controls, and filter modal.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof SearchandFilters>

export const Default: Story = {
  render: () => {
    return (
      <div className="max-w-4xl mx-auto">
        <SearchandFilters value={''} onChange={() => {}} filtersCount={0} />
      </div>
    )
  },
}

export const WithActiveFilters: Story = {
  render: () => {
    return (
      <div className="max-w-4xl mx-auto">
        <SearchandFilters
          value={'sample'}
          onChange={() => {}}
          filtersCount={3}
        />
      </div>
    )
  },
}
