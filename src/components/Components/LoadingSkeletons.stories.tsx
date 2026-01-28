import type { Meta, StoryObj } from '@storybook/react'
import {
  GameCardSkeleton,
  ListSkeleton,
  AwardSkeleton,
  RankingSkeleton,
} from './LoadingSkeletons'

const meta = {
  title: 'Components/LoadingSkeletons',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Loading skeleton components that match the dimensions and layout of actual content cards. Used to provide visual feedback during data fetching. All skeletons use the animate-pulse utility for a shimmer effect.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta

export default meta

// GameCard Grid Skeleton
export const GameCardGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    <GameCardSkeleton variant="grid" count={8} />
  </div>
)

// GameCard List Skeleton
export const GameCardList = () => (
  <div className="space-y-3">
    <GameCardSkeleton variant="list" count={5} />
  </div>
)

// Single GameCard Grid
export const SingleGameCardGrid = () => (
  <div className="max-w-sm">
    <GameCardSkeleton variant="grid" count={1} />
  </div>
)

// Single GameCard List
export const SingleGameCardList = () => (
  <div className="max-w-2xl">
    <GameCardSkeleton variant="list" count={1} />
  </div>
)

// List Cards Grid
export const ListCardsGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    <ListSkeleton count={8} />
  </div>
)

// Single List Card
export const SingleListCard = () => (
  <div className="max-w-sm">
    <ListSkeleton count={1} />
  </div>
)

// Award Cards Grid
export const AwardCardsGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <AwardSkeleton count={6} />
  </div>
)

// Single Award Card
export const SingleAwardCard = () => (
  <div className="max-w-sm">
    <AwardSkeleton count={1} />
  </div>
)

// Rankings List
export const RankingsList = () => (
  <div className="space-y-2 max-w-4xl">
    <RankingSkeleton count={10} />
  </div>
)

// Single Ranking
export const SingleRanking = () => (
  <div className="max-w-4xl">
    <RankingSkeleton count={1} />
  </div>
)

// Mixed Layout (Homepage)
export const HomepageExample = () => (
  <div className="max-w-6xl space-y-12">
    {/* Recent rankings */}
    <div>
      <div className="h-8 bg-gray-200 rounded w-48 mb-5 animate-pulse" />
      <div className="space-y-2">
        <RankingSkeleton count={3} />
      </div>
    </div>

    {/* Lists */}
    <div>
      <div className="h-8 bg-gray-200 rounded w-32 mb-5 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ListSkeleton count={4} />
      </div>
    </div>

    {/* Games */}
    <div>
      <div className="h-8 bg-gray-200 rounded w-40 mb-5 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GameCardSkeleton variant="grid" count={4} />
      </div>
    </div>
  </div>
)

// Awards Page Example
export const AwardsPageExample = () => (
  <div className="max-w-6xl space-y-12">
    {/* Page header */}
    <div className="text-center space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-64 mx-auto" />
      <div className="h-4 bg-gray-200 rounded w-96 mx-auto" />
    </div>

    {/* Industry Awards */}
    <div>
      <div className="h-8 bg-gray-200 rounded w-48 mb-5 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AwardSkeleton count={6} />
      </div>
    </div>

    {/* Personal Awards */}
    <div>
      <div className="h-8 bg-gray-200 rounded w-48 mb-5 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AwardSkeleton count={3} />
      </div>
    </div>
  </div>
)

// Library Page Example
export const LibraryPageExample = () => (
  <div className="max-w-6xl space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-32" />
      <div className="flex gap-2">
        <div className="h-10 w-32 bg-gray-200 rounded-md" />
        <div className="h-10 w-10 bg-gray-200 rounded-md" />
      </div>
    </div>

    {/* Content */}
    <div className="space-y-3">
      <GameCardSkeleton variant="list" count={12} />
    </div>
  </div>
)
