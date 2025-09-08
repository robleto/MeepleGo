import type { Meta, StoryObj } from '@storybook/react'
import RatingChip from './RatingChip'

const meta: Meta<typeof RatingChip> = {
  title: 'Design System/Elements/RatingChip',
  component: RatingChip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['subtle', 'solid', 'overlay'],
    },
    shape: {
      control: 'select',
      options: ['rounded', 'circle', 'square'],
    },
    value: {
      control: { type: 'number', min: 1, max: 10, step: 0.1 },
    },
    showEmptyAsStar: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 8.5,
  },
}

export const AllRatings: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 10 }, (_, i) => (
        <RatingChip key={i + 1} value={i + 1} />
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <RatingChip value={8.5} size="xs" />
      <RatingChip value={8.5} size="sm" />
      <RatingChip value={8.5} size="md" />
      <RatingChip value={8.5} size="lg" />
    </div>
  ),
}

export const SubtleVariant: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 10 }, (_, i) => (
        <RatingChip key={i + 1} value={i + 1} variant="subtle" />
      ))}
    </div>
  ),
}

export const Interactive: Story = {
  args: {
    value: 7.2,
    interactive: true,
  },
}

export const NoRating: Story = {
  args: {
    value: null,
  },
}

export const EmptyWithStar: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Empty Rating States</h3>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <RatingChip value={null} />
          <p className="text-xs text-gray-500 mt-1">Default (dash)</p>
        </div>
        <div className="text-center">
          <RatingChip value={null} showEmptyAsStar={true} />
          <p className="text-xs text-gray-500 mt-1">Star variant</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Different sizes with star:</span>
        <RatingChip value={null} showEmptyAsStar={true} size="xs" />
        <RatingChip value={null} showEmptyAsStar={true} size="sm" />
        <RatingChip value={null} showEmptyAsStar={true} size="md" />
        <RatingChip value={null} showEmptyAsStar={true} size="lg" />
      </div>
    </div>
  ),
}

export const FixedCircle: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Normal:</span>
      <RatingChip value={9.1} />
      <span className="text-sm text-gray-600 ml-4">Fixed Circle:</span>
      <RatingChip value={9.1} shape="circle" />
    </div>
  ),
}

export const RatingScale: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">MeepleGo Rating Scale</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Solid Style</h4>
          {[
            { rating: 10, label: 'Masterpiece' },
            { rating: 9, label: 'Great' },
            { rating: 8, label: 'Very Good' },
            { rating: 7, label: 'Good' },
            { rating: 6, label: 'Above Average' },
            { rating: 5, label: 'Average' },
            { rating: 4, label: 'Below Average' },
            { rating: 3, label: 'Poor' },
            { rating: 2, label: 'Bad' },
            { rating: 1, label: 'Awful' },
          ].map(({ rating, label }) => (
            <div key={rating} className="flex items-center gap-2 py-1">
              <RatingChip value={rating} />
              <span className="text-sm text-gray-600">{label}</span>
            </div>
          ))}
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">Subtle Style</h4>
          {[
            { rating: 10, label: 'Masterpiece' },
            { rating: 9, label: 'Great' },
            { rating: 8, label: 'Very Good' },
            { rating: 7, label: 'Good' },
            { rating: 6, label: 'Above Average' },
            { rating: 5, label: 'Average' },
            { rating: 4, label: 'Below Average' },
            { rating: 3, label: 'Poor' },
            { rating: 2, label: 'Bad' },
            { rating: 1, label: 'Awful' },
          ].map(({ rating, label }) => (
            <div key={rating} className="flex items-center gap-2 py-1">
              <RatingChip value={rating} variant="subtle" />
              <span className="text-sm text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
}
