import type { Meta, StoryObj } from '@storybook/react';
import { SearchDropdown } from './SearchDropdown';
import { GroupedSuggestions } from './types';

const meta: Meta<typeof SearchDropdown> = {
  title: 'Components/Features/Filters/SearchDropdown',
  component: SearchDropdown,
  tags: ['autodocs'],
  parameters: { 
    layout: 'padded',
    docs: {
      description: {
        component: 'Dropdown component displaying game search suggestions grouped by match quality.'
      }
    }
  },
  args: {
    query: 'wing',
    activeIndex: 0
  }
};

export default meta;
type Story = StoryObj<typeof SearchDropdown>;

const grouped: GroupedSuggestions = {
  exactMatches: [{ id:1, name:'Wingspan', year_published:2019, rating:8.1 }],
  popular: [{ id:2, name:'Gloomhaven', year_published:2017, rating:8.7 }],
  other: [{ id:3, name:'Wing Leader', year_published:2014, rating:7.0 }]
};
const flat = [...grouped.exactMatches, ...grouped.popular, ...grouped.other];

export const Default: Story = {
  args: {
    grouped,
    flat,
    onHover: ()=>{},
    onSelect: ()=>{}
  }
};
