import type { Meta, StoryObj } from '@storybook/react';
import GameFilters from './GameFilters';
import React, { useState } from 'react';

const meta: Meta<typeof GameFilters> = {
  title: 'Archived/Features/Filters/GameFilters',
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
    const [cardVariant, setCardVariant] = useState<'compact'|'balanced'|'detailed'>('balanced');
    const [sortBy, setSortBy] = useState<any>('name');
    const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('asc');
    const [groupBy, setGroupBy] = useState<any>('year_published');
    const [filterType, setFilterType] = useState<'none'|'year'|'publisher'|'players'|'category'|'mechanic'|'game'|'award'>('none');
    const [filterValue, setFilterValue] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    return (
      <div className="max-w-4xl mx-auto">
        <GameFilters
          viewMode={viewMode}
          setViewMode={setViewMode}
          cardVariant={cardVariant}
          setCardVariant={setCardVariant}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          filterType={filterType}
          setFilterType={setFilterType}
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          uniqueYears={[2025, 2024, 2023, 2022, 2021]}
          uniquePublishers={['Publisher A', 'Publisher B', 'Publisher C']}
          uniquePlayerCounts={[1, 2, 3, 4, 5, 6]}
          uniqueCategories={['Strategy', 'Family', 'Thematic', 'Abstract']}
          uniqueMechanics={['Deck Building', 'Worker Placement', 'Engine Building']}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          gamesCount={150}
          filteredGamesCount={150}
          hasMore={true}
          loading={false}
          error={null}
        />
      </div>
    );
  }
};

export const WithActiveFilters: Story = {
  render: () => {
    const [viewMode, setViewMode] = useState<'grid'|'list'>('list');
    const [cardVariant, setCardVariant] = useState<'compact'|'balanced'|'detailed'>('compact');
    const [sortBy, setSortBy] = useState<any>('year_published');
    const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc');
    const [groupBy, setGroupBy] = useState<any>('publisher');
    const [filterType, setFilterType] = useState<'none'|'year'|'publisher'|'players'|'category'|'mechanic'|'game'|'award'>('year');
    const [filterValue, setFilterValue] = useState('2024');
    const [searchTerm, setSearchTerm] = useState('wingspan');

    return (
      <div className="max-w-4xl mx-auto">
        <GameFilters
          viewMode={viewMode}
          setViewMode={setViewMode}
          cardVariant={cardVariant}
          setCardVariant={setCardVariant}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          filterType={filterType}
          setFilterType={setFilterType}
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          uniqueYears={[2025, 2024, 2023, 2022, 2021]}
          uniquePublishers={['Stonemaier Games', 'Jamey Stegmaier', 'Publisher C']}
          uniquePlayerCounts={[1, 2, 3, 4, 5]}
          uniqueCategories={['Strategy', 'Animals', 'Economic']}
          uniqueMechanics={['Engine Building', 'Card Drafting', 'Set Collection']}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          gamesCount={42}
          filteredGamesCount={42}
          hasMore={false}
          loading={false}
          error={null}
        />
      </div>
    );
  }
};
