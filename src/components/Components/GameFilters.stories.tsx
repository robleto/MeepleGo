import type { Meta, StoryObj } from '@storybook/react';
import GameFilters from './GameFilters';
import React, { useState } from 'react';

const meta: Meta<typeof GameFilters> = {
  title: 'Components/GameFilters',
  component: GameFilters,
  tags: ['autodocs'],
  parameters: { 
    layout: 'padded',
    docs: {
      description: {
        component: 'Main game filters component with search, view mode controls, and filter modal.'
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof GameFilters>;

export const Default: Story = {
  render: () => {
    const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [sortBy, setSortBy] = useState<any>('name');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('asc');
  const [groupBy, setGroupBy] = useState<any>('year_published');

    return (
      <div className="max-w-4xl mx-auto">
        <GameFilters
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          total={150}
        />
      </div>
    );
  }
};

export const WithActiveFilters: Story = {
  render: () => {
    const [viewMode, setViewMode] = useState<'grid'|'list'>('list');
  const [sortBy, setSortBy] = useState<any>('year_published');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc');
  const [groupBy, setGroupBy] = useState<any>('publisher');

    return (
      <div className="max-w-4xl mx-auto">
        <GameFilters
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          total={42}
        />
      </div>
    );
  }
};
