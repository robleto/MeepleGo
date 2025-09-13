import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SearchInput, FilterButton, ToggleGroup } from '../Controls'
import {
  Squares2X2Icon,
  ListBulletIcon,
  Bars3Icon,
  Bars2Icon,
  MinusIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'

const meta: Meta = {
  title: 'Components/SearchandFilters Breakdown',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Atomic breakdown of the SearchandFilters component showing how it's built from individual Controls components for consistency across the design system.",
      },
    },
  },
}

export default meta
type Story = StoryObj

const viewModeOptions = [
  { value: 'grid', label: 'Grid', icon: Squares2X2Icon, tooltip: 'Grid view' },
  { value: 'list', label: 'List', icon: ListBulletIcon, tooltip: 'List view' },
]

const densityOptions = [
  { value: 'detailed', label: 'Detailed', icon: Bars3Icon },
  { value: 'balanced', label: 'Balanced', icon: Bars2Icon },
  { value: 'compact', label: 'Compact', icon: MinusIcon },
]

export const AtomicComponents: Story = {
  render: () => {
    const [searchValue, setSearchValue] = useState('')
    const [viewMode, setViewMode] = useState('grid')
    const [density, setDensity] = useState('balanced')

    return (
      <div className="space-y-8 max-w-4xl">
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Atomic Component Breakdown
          </h2>
          <p className="text-gray-600 mb-6">
            SearchandFilters is built from these reusable atomic components from
            our Controls library:
          </p>
        </div>

        {/* Individual Components */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* SearchInput */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">SearchInput</h3>
              <p className="text-sm text-gray-500">
                Rounded search with integrated button
              </p>
            </div>
            <SearchInput
              value={searchValue}
              onChange={setSearchValue}
              placeholder="Search for games"
              showClearButton={true}
              onSearchClick={() => console.log('Search:', searchValue)}
            />
            <div className="text-xs text-gray-400 font-mono">
              Controls/SearchInput
            </div>
          </div>

          {/* FilterButton */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">FilterButton</h3>
              <p className="text-sm text-gray-500">
                Button with optional active badge
              </p>
            </div>
            <FilterButton
              onClick={() => console.log('Filters clicked')}
              activeCount={3}
              showText={true}
            />
            <div className="text-xs text-gray-400 font-mono">
              Controls/FilterButton
            </div>
          </div>

          {/* ToggleGroup - View Mode */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">ToggleGroup</h3>
              <p className="text-sm text-gray-500">
                Icon toggle for view modes
              </p>
            </div>
            <ToggleGroup
              value={viewMode}
              onChange={setViewMode}
              options={viewModeOptions}
              iconOnly={true}
            />
            <div className="text-xs text-gray-400 font-mono">
              Controls/ToggleGroup
            </div>
          </div>
        </div>

        {/* Combined Layout */}
        <div className="border-t pt-8">
          <div className="mb-6">
            <h3 className="font-medium text-lg mb-2">Combined Layout</h3>
            <p className="text-sm text-gray-500">
              How these components work together in SearchandFilters:
            </p>
          </div>

          {/* Reconstructed SearchandFilters Layout */}
          <div className="flex items-center justify-center gap-4">
            {/* Search */}
            <div className="w-full max-w-md">
              <SearchInput
                value={searchValue}
                onChange={setSearchValue}
                placeholder="Search for games"
                showClearButton={true}
                onSearchClick={() => {
                  if (searchValue) {
                    setSearchValue('')
                  }
                }}
              />
            </div>

            {/* Filter Button */}
            <FilterButton
              onClick={() => console.log('Open filter modal')}
              activeCount={2}
            />
          </div>

          {/* Additional Controls (that would be in modal) */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-4">Modal Controls (ToggleGroups)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  View Mode
                </label>
                <ToggleGroup
                  value={viewMode}
                  onChange={setViewMode}
                  options={viewModeOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Card Density
                </label>
                <ToggleGroup
                  value={density}
                  onChange={setDensity}
                  options={densityOptions}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
}

export const StyleVariations: Story = {
  render: () => {
    return (
      <div className="space-y-8 max-w-4xl">
        <div>
          <h2 className="text-xl font-semibold mb-2">Style Variations</h2>
          <p className="text-gray-600">
            Each atomic component supports variations for different use cases:
          </p>
        </div>

        {/* SearchInput Variations */}
        <div className="space-y-4">
          <h3 className="font-medium">SearchInput Styles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Default (empty)</p>
              <SearchInput
                value=""
                onChange={() => {}}
                placeholder="Search for games"
              />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">With clear button</p>
              <SearchInput
                value="wingspan"
                onChange={() => {}}
                showClearButton={true}
              />
            </div>
          </div>
        </div>

        {/* FilterButton Variations */}
        <div className="space-y-4">
          <h3 className="font-medium">FilterButton Styles</h3>
          <div className="flex gap-4 flex-wrap">
            <FilterButton onClick={() => {}} />
            <FilterButton onClick={() => {}} activeCount={1} />
            <FilterButton onClick={() => {}} activeCount={5} />
            <FilterButton onClick={() => {}} showText={false} activeCount={2} />
          </div>
        </div>

        {/* ToggleGroup Variations */}
        <div className="space-y-4">
          <h3 className="font-medium">ToggleGroup Styles</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 mb-2">With labels</p>
              <ToggleGroup
                value="grid"
                onChange={() => {}}
                options={viewModeOptions}
              />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Icon only</p>
              <ToggleGroup
                value="balanced"
                onChange={() => {}}
                options={densityOptions}
                iconOnly={true}
              />
            </div>
          </div>
        </div>
      </div>
    )
  },
}

export const ConsistencyBenefits: Story = {
  render: () => {
    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-xl font-semibold mb-2">Design System Benefits</h2>
          <p className="text-gray-600">
            Building SearchandFilters from atomic components ensures
            consistency:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-medium text-green-700">
              ✅ Consistent Styling
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Same rounded corners (rounded-full)</li>
              <li>• Consistent border colors</li>
              <li>• Unified hover/focus states</li>
              <li>• Matching typography scale</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-blue-700">
              🔄 Reusable Everywhere
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• SearchInput in nav, modals, pages</li>
              <li>• FilterButton in lists, tables</li>
              <li>• ToggleGroup in settings, preferences</li>
              <li>• Easy to maintain and update</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-purple-700">
              ⚡ Development Speed
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Pre-built accessibility features</li>
              <li>• Tested interaction patterns</li>
              <li>• TypeScript support built-in</li>
              <li>• Storybook documentation</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-orange-700">
              🎨 Design Flexibility
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Multiple size variants</li>
              <li>• Icon customization</li>
              <li>• Disabled states included</li>
              <li>• Responsive behavior built-in</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Atomic Design Principle
          </h4>
          <p className="text-blue-700 text-sm">
            SearchandFilters demonstrates how complex interfaces are built from
            simple, reusable components. Each atomic component (SearchInput,
            FilterButton, ToggleGroup) can be composed into larger molecules and
            organisms while maintaining consistency.
          </p>
        </div>
      </div>
    )
  },
}
