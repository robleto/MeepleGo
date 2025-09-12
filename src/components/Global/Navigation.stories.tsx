import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Navigation from './Navigation';
import NavItem from '../Elements/NavItem';
import { TrophyIcon, CubeIcon, ListBulletIcon, PlayIcon } from '@heroicons/react/24/outline';

const meta: Meta<typeof Navigation> = {
  title: 'Global/Header',
  component: Navigation,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main site navigation with responsive design and router integration.'
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
};
export default meta

type Story = StoryObj<typeof Navigation>

export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-0 m-0">
      <Navigation />
    </div>
  )
}

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-0 m-0">
      <Navigation />
    </div>
  )
}

// Removed NavItemShowcase - excessive documentation content
// NavItem has its own stories file for atomic component demos
