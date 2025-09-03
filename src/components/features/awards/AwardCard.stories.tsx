import type { Meta, StoryObj } from '@storybook/react';
import { AwardCard } from './AwardCard';

const meta: Meta<typeof AwardCard> = {
  title: 'Components/Features/Awards/AwardCard',
  component: AwardCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: { 
      description: { 
        component: 'Award summary card with optional stats. The circular icon style is standardized in the Design System (planned IconCircle token component).' 
      } 
    }
  }
};

export default meta;
type Story = StoryObj<typeof AwardCard>;

export const Default: Story = {
  render: () => (
    <div className="max-w-sm">
      <AwardCard
        title="Game of the Year"
        description="Best overall game as voted by users."
        yearSpan="2024"
        winners={1}
        nominees={5}
        showStats={true}
      />
    </div>
  ),
};

export const WithoutStats: Story = {
  render: () => (
    <div className="max-w-sm">
      <AwardCard
        title="Innovation Award"
        description="Recognizing standout creativity and mechanisms."
        yearSpan="2024"
        winners={1}
        nominees={4}
        showStats={false}
      />
    </div>
  ),
};

export const WithCustomIcon: Story = {
  render: () => (
    <div className="max-w-sm">
      <AwardCard
        title="Art & Presentation"
        description="Outstanding visual and graphic presentation."
        yearSpan="2024"
        winners={1}
        nominees={6}
        showStats={true}
        icon={<span className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white font-bold text-lg">A</span>}
        circleBgClass="bg-transparent"
        circleBorderClass="border-none"
      />
    </div>
  ),
};