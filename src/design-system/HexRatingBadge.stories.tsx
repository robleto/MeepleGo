import type { Meta, StoryObj } from '@storybook/react';
import HexRatingBadge from './elements/HexRatingBadge';

const meta: Meta<typeof HexRatingBadge> = {
  title: 'Design System/HexRatingBadge',
  component: HexRatingBadge,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'number', description: 'Rating value (1-10)' },
    size: { 
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Size of the badge'
    },
    tone: {
      control: 'select', 
      options: ['solid', 'subtle'],
      description: 'Visual style tone'
    },
    className: { control: 'text' },
    title: { control: 'text', description: 'Custom tooltip title' },
  },
};
export default meta;

type Story = StoryObj<typeof HexRatingBadge>;

export const Default: Story = {
  args: {
    value: 8,
    size: 'md',
    tone: 'solid',
  },
};

export const AllRatings: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, null].map((rating) => (
        <div key={rating || 'null'} className="text-center">
          <HexRatingBadge value={rating} size="md" />
          <div className="text-xs mt-1 text-gray-600">{rating || 'Unrated'}</div>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <div className="text-center">
        <HexRatingBadge value={8} size="xs" />
        <div className="text-xs mt-1">xs</div>
      </div>
      <div className="text-center">
        <HexRatingBadge value={8} size="sm" />
        <div className="text-xs mt-1">sm</div>
      </div>
      <div className="text-center">
        <HexRatingBadge value={8} size="md" />
        <div className="text-xs mt-1">md</div>
      </div>
      <div className="text-center">
        <HexRatingBadge value={8} size="lg" />
        <div className="text-xs mt-1">lg</div>
      </div>
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <div className="text-center">
        <HexRatingBadge value={8} size="md" tone="solid" />
        <div className="text-xs mt-1">solid</div>
      </div>
      <div className="text-center">
        <HexRatingBadge value={8} size="md" tone="subtle" />
        <div className="text-xs mt-1">subtle</div>
      </div>
    </div>
  ),
};
