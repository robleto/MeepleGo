import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AwardCard } from './AwardCard'
import {
  TrophyIcon,
  StarIcon,
  LightBulbIcon,
  HeartIcon,
} from '@heroicons/react/24/outline'

const meta: Meta<typeof AwardCard> = {
  title: 'Components/AwardCard',
  component: AwardCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Award summary card component displaying award categories with optional statistics. Features the distinctive IconCircle treatment with proper Heroicons for a polished, professional appearance.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof AwardCard>

export const Default: Story = {
  args: {
    title: 'Best Strategy Game',
    yearSpan: '2024',
    description: 'Outstanding strategic gameplay and depth',
    // No icon prop - uses default IconCircle with TrophyIcon
  },
}

export const WithStats: Story = {
  args: {
    title: "People's Choice",
    yearSpan: '2024',
    description: 'Most popular game voted by the community',
    showStats: true,
    winners: 3,
    nominees: 8,
    // No icon prop - shows default IconCircle treatment
  },
}

export const Innovation: Story = {
  args: {
    title: 'Most Innovative',
    yearSpan: '2024',
    description: 'Revolutionary mechanics and creative design',
    showStats: true,
    winners: 2,
    nominees: 5,
    // No icon prop - shows default IconCircle treatment
  },
}

export const Artwork: Story = {
  args: {
    title: 'Best Artwork',
    yearSpan: '2024',
    description: 'Exceptional visual design and illustration',
    showStats: true,
    winners: 1,
    nominees: 12,
    // No icon prop - uses default IconCircle treatment
  },
}

export const Accessibility: Story = {
  args: {
    title: 'Most Accessible',
    yearSpan: '2024',
    description: 'Excellence in inclusive game design',
    showStats: true,
    winners: 1,
    nominees: 6,
    // No icon prop - uses default IconCircle treatment
  },
}

export const CardCollection: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
      <AwardCard
        title="Best Strategy Game"
        yearSpan="2024"
        description="Outstanding strategic gameplay"
        showStats={true}
        winners={1}
        nominees={8}
      />
      <AwardCard
        title="Best Family Game"
        yearSpan="2024"
        description="Perfect for family game nights"
        showStats={true}
        winners={1}
        nominees={10}
      />
      <AwardCard
        title="Best Solo Game"
        yearSpan="2024"
        description="Exceptional single-player experience"
        showStats={true}
        winners={1}
        nominees={7}
      />
      <AwardCard
        title="Best Cooperative Game"
        yearSpan="2024"
        description="Outstanding teamwork mechanics"
        showStats={true}
        winners={1}
        nominees={9}
      />
      <AwardCard
        title="Best Thematic Game"
        yearSpan="2024"
        description="Immersive theme integration"
        showStats={true}
        winners={1}
        nominees={11}
      />
      <AwardCard
        title="Most Innovative"
        yearSpan="2024"
        description="Revolutionary game mechanics"
        showStats={true}
        winners={1}
        nominees={5}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
}
