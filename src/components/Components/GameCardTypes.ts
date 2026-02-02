import type { GameWithRanking } from '@/types'
import type { SleepinessClassification } from '@/utils/sleepinessClassification'

export type GameCardVariant = 'detailed' | 'balanced' | 'compact'

// Metadata configuration for what to display below the card image
export interface GameCardMetadata {
  // Default elements (on by default)
  showTitle?: boolean
  showYear?: boolean
  showPlayerCount?: boolean
  showPlaytime?: boolean
  showTagline?: boolean

  // Custom elements (off by default)
  delta?: number | null
  averageRating?: number | null
  customSubtext?: string | null
  sleepinessClassification?: SleepinessClassification | null
  userRanking?: number | null
}

export interface GameCardProps {
  game: GameWithRanking & {
    list_membership?: { library: boolean; wishlist: boolean }
    tagline?: string | null // optional short blurb
  }
  viewMode: 'grid' | 'list'
  onMembershipChange?: (
    gameId: string,
    change: { library?: boolean; wishlist?: boolean }
  ) => void
  className?: string
  hideWinnerBadge?: boolean
  variant?: GameCardVariant
  showSummary?: boolean
  emphasizeMeta?: boolean
  titleClassName?: string
  allowWinnerBadgeInListView?: boolean
  listRank?: number | null
  // Optional list context actions for list pages
  showDragHandle?: boolean
  dragHandleProps?: {
    attributes?: any
    listeners?: any
    setActivatorNodeRef?: (el: HTMLElement | null) => void
  }
  onRemoveFromCurrentList?: () => void
  // Controls object-fit for grid image (default cover for tighter layouts)
  imageFit?: 'cover' | 'contain'
  // Metadata configuration - what to show below the image
  metadata?: GameCardMetadata
  // Legacy props (deprecated, use metadata instead)
  showMeta?: boolean
  delta?: number | null
}

export interface GameCardRenderProps
  extends Omit<
    GameCardProps,
    'viewMode' | 'metadata' | 'showMeta' | 'delta'
  > {
  metaConfig: GameCardMetadata
}
