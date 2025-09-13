import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import SearchandFilters, { SearchandFiltersProps } from './SearchandFilters'
import React, { useState } from 'react'

const meta: Meta<typeof SearchandFilters> = {
	title: 'Components/SearchandFilters',
	component: SearchandFilters,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'Unified search input with filters trigger. Debounced uncontrolled mode or fully controlled via value/onChange. Filter badge indicates active filters. Designed to pair with FilterModal.',
			},
		},
	},
	argTypes: {
		value: { control: 'text', description: 'Controlled input value' },
		placeholder: { control: 'text' },
		filtersCount: { control: 'number' },
		onOpenFilters: { action: 'open-filters' },
		onChange: { action: 'change' },
		onSearch: { action: 'search' },
	},
}

export default meta
type Story = StoryObj<typeof SearchandFilters>

export const Uncontrolled: Story = {
	args: {
		placeholder: 'Search games…',
		filtersCount: 0,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Uncontrolled usage: internal state with debounce (300ms default). Type to see onChange fire after debounce; Enter triggers onSearch.',
			},
		},
	},
}

export const WithFiltersBadge: Story = {
	args: {
		placeholder: 'Search ranked games…',
		filtersCount: 3,
	},
	parameters: {
		docs: {
			description: {
				story: 'Shows active filters badge when filtersCount > 0.',
			},
		},
	},
}

export const Controlled: Story = {
	render: (args) => {
		const ControlledExample: React.FC = () => {
			const [val, setVal] = useState('spirit')
			return (
				<div className="space-y-4 max-w-xl">
					<SearchandFilters
						{...(args as SearchandFiltersProps)}
						value={val}
						onChange={(v) => setVal(v)}
						onSearch={(v) => console.log('search', v)}
						filtersCount={2}
					/>
					<div className="text-xs font-mono text-gray-600">
						value: <span className="font-semibold">{val}</span>
					</div>
				</div>
			)
		}
		return <ControlledExample />
	},
	args: {
		placeholder: 'Controlled search…',
	},
	parameters: {
		docs: {
			description: {
				story:
					'Fully controlled mode. Parent manages value and responds instantly to typing without debounce.',
			},
		},
	},
}

export const DarkMode: Story = {
	args: {
		placeholder: 'Dark mode search…',
		filtersCount: 1,
	},
	decorators: [
		(Story) => (
			<div className="dark bg-gray-900 p-6 min-h-40">
				<Story />
			</div>
		),
	],
	parameters: {
		backgrounds: { default: 'dark' },
		docs: {
			description: {
				story: 'Dark mode appearance, ensuring contrast and focus states are accessible.',
			},
		},
	},
}

