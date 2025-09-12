import type { Meta, StoryObj } from '@storybook/react';
import Heading from './Heading';

const meta: Meta<typeof Heading> = {
  title: 'Archived/Shared/Heading',
  component: Heading,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Configurable heading component with semantic HTML and display font options.'
      }
    }
  },
  argTypes: {
    as: { control: 'text' },
    size: { control: 'text' },
    align: { control: 'text' },
    displayFont: { control: 'boolean' },
    className: { control: 'text' },
    children: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof Heading>;

export const Default: Story = {
  args: {
    as: 'h1',
    size: 'display',
    align: 'left',
    displayFont: true,
    children: 'MeepleGo Heading',
  },
};

export const SubHead: Story = {
  args: {
    as: 'h2',
    size: 'display',
    align: 'left',
    displayFont: false,
    className: 'heading-display text-2xl font-normal tracking-wide text-gray-700 dark:text-gray-300 mb-1',
    children: 'My Lists',
  },
};
