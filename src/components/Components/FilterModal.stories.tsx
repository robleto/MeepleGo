import type { Meta, StoryObj } from '@storybook/react';
import { FilterModal } from './FilterModal';
import React, { useState } from 'react';

const meta: Meta<typeof FilterModal> = {
  title: 'Components/FilterModal',
  component: FilterModal,
  tags: ['autodocs'],
  parameters: { 
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Modal containing game collection filtering options including sort, group, and filter controls.'
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof FilterModal>;

export const Default: Story = {
  render: () => {
    const [open] = useState(true);
    const [sortBy, setSortBy] = useState<any>('name');
    const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('asc');
    const [groupBy, setGroupBy] = useState<any>('year_published');
    const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
    const [cardVariant, setCardVariant] = useState<'detailed'|'balanced'|'compact'>('balanced');
    const [filterType, setFilterType] = useState('none');
    const [filterValue, setFilterValue] = useState('all');
    return (
      <FilterModal
        open={open}
        onClose={()=>{}}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
        cardVariant={cardVariant}
        setCardVariant={setCardVariant}
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
    );
  }
};
