import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import GameSearchSelect from './GameSearchSelect';
import { FilterModal } from './FilterModal';

const meta: Meta = {
  title: 'Archived/Features/Filters/Composite',
  tags: ['autodocs'],
  parameters: { 
    layout: 'padded',
    docs: { 
      description: { 
        component: 'Combines GameSearchSelect, Filter button (modal) and simple state wiring to mirror real usage.' 
      } 
    }
  }
};

export default meta;
type Story = StoryObj;

export const Composite: Story = {
  render: () => {
    const [sortBy, setSortBy] = useState<any>('name');
    const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('asc');
    const [groupBy, setGroupBy] = useState<any>('year_published');
    const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
    const [filterType, setFilterType] = useState('none');
    const [filterValue, setFilterValue] = useState('all');
    const [open, setOpen] = useState(false);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <GameSearchSelect 
            onSelect={(game) => console.log('Selected:', game)}
            placeholder="Search for games..."
          />
          <button onClick={()=> setOpen(true)} className="px-5 py-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium">Filters</button>
        </div>
        <div className="text-xs text-gray-500">Sort: {sortBy} {sortOrder} • Group: {groupBy || 'none'} • View: {viewMode} • Filter: {filterType !== 'none' ? `${filterType}=${filterValue}` : 'none'}</div>
        <FilterModal
          open={open}
          onClose={()=> setOpen(false)}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filterType={filterType}
          setFilterType={setFilterType}
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          uniqueYears={[2024,2023,2022]}
          uniquePublishers={['Publisher A','Publisher B']}
          uniquePlayerCounts={[1,2,3,4]}
          uniqueCategories={['Strategy','Family']}
          uniqueMechanics={['Deck Building','Worker Placement']}
        />
      </div>
    );
  }
};
