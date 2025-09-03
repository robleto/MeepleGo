import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import NavItem from './NavItem';
import { TrophyIcon, CubeIcon } from '@heroicons/react/24/outline';

const meta: Meta<typeof NavItem> = {
  title: 'Components/Shared/NavItem',
  component: NavItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Atomic navigation item component extracted from Navigation with proper state management.'
      }
    },
    backgrounds: {
      default: 'site',
      values: [
        {
          name: 'site',
          value: '#E7F4FF',
        },
        {
          name: 'dark',
          value: '#0f172a',
        },
      ],
    },
  },
  argTypes: {
    isActive: {
      control: 'boolean',
      description: 'Whether the nav item is currently active',
    },
    name: {
      control: 'text',
      description: 'The display name of the navigation item',
    },
    href: {
      control: 'text',
      description: 'The URL the nav item links to',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NavItem>;

export const Default: Story = {
  args: {
    name: 'Games',
    href: '/games',
    icon: CubeIcon,
    isActive: false,
  },
};

export const Active: Story = {
  args: {
    name: 'Awards',
    href: '/awards',
    icon: TrophyIcon,
    isActive: true,
  },
};

export const Hover: Story = {
  args: {
    name: 'Games',
    href: '/games',
    icon: CubeIcon,
    isActive: false,
  },
  parameters: {
    pseudo: {
      hover: true,
    },
  },
};

// Story showcasing all states in a grid
export const AllStates = () => (
  <div className="flex gap-4 p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Default State</h3>
      <NavItem name="Games" href="/games" icon={CubeIcon} isActive={false} />
      <NavItem name="Awards" href="/awards" icon={TrophyIcon} isActive={false} />
    </div>

    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Active State</h3>
      <NavItem name="Games" href="/games" icon={CubeIcon} isActive={true} />
      <NavItem name="Awards" href="/awards" icon={TrophyIcon} isActive={false} />
    </div>

    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Hover State (hover over items)</h3>
      <NavItem name="Games" href="/games" icon={CubeIcon} isActive={false} />
      <NavItem name="Awards" href="/awards" icon={TrophyIcon} isActive={false} />
    </div>
  </div>
);
