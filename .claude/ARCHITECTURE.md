# MeepleGo Architecture Reference

## Component Inventory (from Storybook)

All components are documented in Storybook. Run `npm run storybook` to browse interactively.

---

### Foundations (`src/components/Foundations/`)

| Component | File | Props | Stories |
|-----------|------|-------|---------|
| `Logo` | `Logo.tsx` | `size` (sm/md/lg), `showText` (bool), `href` (string), `className` | Default, Small, Large, IconOnly, AsLink, Showcase |
| Rating Colors | `ratingColors.ts` | `getRatingSolidClass(n)`, `getRatingSubtleClass(n)` | N/A (utility) |
| Colors | `Colors.stories.tsx` | Documentation only | RatingScale, SystemColors |
| Typography | `Typography.stories.tsx` | Documentation only | Headings, Subhead |
| Spacing | `Spacing.stories.tsx` | Documentation only | SpacingScale |
| Iconography | `Iconography.stories.tsx` | Documentation only | IconographySystem, InContext, IconCircles |

---

### Controls (`src/components/Controls/`)

| Component | File | Key Props | Variants/States |
|-----------|------|-----------|-----------------|
| `TextInput` | `TextInput.tsx` | `size` (sm/md/lg), `state` (default/error/success), `leftIcon`, `rightIcon`, `disabled`, `type` | Sizes, States, WithIcons, InputTypes |
| `Textarea` | `Textarea.tsx` | `size` (sm/md/lg), `state`, `autoResize` (bool), `rows`, `maxHeight`, `maxLength` | Sizes, States, AutoResize, VariousRowSizes, CharacterLimits |
| `Select` | `Select.tsx` | `size` (sm/md/lg), `state`, `leftIcon`, `placeholder`, `disabled` | Sizes, States, WithIcons, WithPlaceholder, GameFilters |
| `Checkbox` | `Checkbox.tsx` | `size` (sm/md/lg), `state`, `label`, `description`, `disabled`, `indeterminate` | Sizes, States, WithDescriptions, IndeterminateState |
| `Radio` | `Radio.tsx` | `size` (sm/md/lg), `state`, `label`, `description`, `name`, `disabled` | Sizes, States, GameViewMode, PlayerCount, SortOptions |
| `Toggle` | `Toggle.tsx` | `size` (sm/md/lg), `state`, `label`, `description`, `labelPosition` (left/right), `checked`, `disabled` | Sizes, States, LabelPositions, GameSettingsForm |
| `ToggleGroup` | `ToggleGroup.tsx` | `value`, `onChange`, `options` (array), `size` (sm/md/lg), `variant` (default/pills/cards), `iconOnly`, `disabled` | ViewModeToggle, DensityToggle, ThreeOptions, Sizes, Variants |
| `SearchInput` | `SearchInput.tsx` | `value`, `onChange`, `placeholder`, `showClearButton`, `disabled`, `autoComplete` | Default, WithValue, Disabled, Sizes |
| `FilterButton` | `FilterButton.tsx` | `onClick`, `activeCount`, `showText`, `disabled`, `variant` (default/primary/secondary), `icon` | Default, WithActiveBadge, IconOnly, Variants, Disabled |

---

### Elements (`src/components/Elements/`)

| Component | File | Key Props | Variants |
|-----------|------|-----------|----------|
| `Button` | `Button.tsx` | `variant` (primary/secondary/ghost/danger/outline), `size` (xs/sm/md/lg), `shape` (default/rounded/pill/square), `leftIcon`, `rightIcon`, `loading`, `disabled` | Primary, Secondary, Ghost, Danger, Outline, WithIcons, Loading |
| `Badge` | `Badge.tsx` | `size` (xs/sm/md/lg), `variant` (default/primary/secondary/success/warning/error/info), `shape` (rounded/pill/square), `subtle`, `icon`, `customColor` | Sizes, Variants, Subtle, Shapes, GameStatusExamples |
| `WinnerBadge` | `Badge.tsx` | `type` (winner/nominee/honorable/special) | WinnerBadges |
| `Chip` | `Chip.tsx` | `variant` (subtle/solid/outline/overlay), `size` (xs/sm/md/lg), `color`, `shape` (rounded/circle/square), `interactive`, `onClick` | Colors, Sizes, Shapes, Interactive, StatusChips |
| `RatingChip` | `Chip.tsx` | `rating` (1-10), `size` (xs/sm/md/lg) | RatingChips with all 10 values |
| `Alert` | `Alert.tsx` | `variant` (success/error/warning/info), `size` (sm/md/lg), `title`, `showIcon`, `dismissible`, `onDismiss` | AllVariants, Sizes, Dismissible, ComplexContent |
| `GameImage` | `GameImage.tsx` | `src`, `alt`, `name`, `variant` (square/thumb), `className` | WithValidImage, WithBrokenImage, ThumbVariant, GameCollection |
| `StatCard` | `StatCard.tsx` | `Icon` (component), `iconBg`, `iconColor`, `value`, `label`, `size` (default/compact/mini), `onClick` | Rankings, Library, Awards, CompactSize, MiniSize, Grid |
| `NavItem` | `NavItem.tsx` | `name`, `href`, `icon` (component), `isActive` | Default, Active, Hover |
| `Overlay` | `Overlay.tsx` | `visible`, `variant` (dark/light/blur/transparent), `position` (fixed/absolute), `clickToClose`, `center`, `zIndex`, `onClose` | Variants, ClickToClose, GameModalExample |
| `RatingPopup` | `RatingPopup.tsx` | `gameId`, `gameName`, `currentRating`, `isOpen`, `position`, `onClose`, `onRatingChange` | Closed, Open, WithCurrentRating, InteractiveDemo |
| `Tooltip` | `Tooltip.tsx` | (see story) | Default |
| `Spinner` | `Spinner.tsx` | (see story) | Default |
| `Tabs` | `Tabs.tsx` | (see story) | Default |
| `VerticalTabs` | `VerticalTabs.tsx` | (see story) | Default |
| `Pagination` | `Pagination.tsx` | (see story) | Default |
| `DateTimePicker` | `DateTimePicker.tsx` | `value`, `onChange`, `label`, `required` | Default, Required |
| `TimePicker` | `TimePicker.tsx` | (see story) | Default |
| `JournalTimelineMarker` | `JournalTimelineMarker.tsx` | `date`, `isLast`, `variant` (date/year), `className` | Default, YearVariant, LastMarker, JournalTimeline |
| `TimelineMarker` | `TimelineMarker.tsx` | `year`, `isLast`, `className` | Default, LastMarker, MultipleMarkers |
| `ScrollToTop` | `ScrollToTop.tsx` | (see story) | Default |
| `Transition` | `Transition.tsx` | (see story) | Default |
| `TextField` | `TextField.tsx` | (legacy, prefer TextInput) | Default |

---

### Components (`src/components/Components/`)

| Component | File | Key Props | Usage |
|-----------|------|-----------|-------|
| `PageLayout` | `PageLayout.tsx` | `children`, `fullWidth` | Wraps all standard pages (max-w-7xl, py-6, bg-gray-50) |
| `Heading` | `Heading.tsx` | `as` (h1-h6), `size`, `align`, `displayFont`, `className` | Page and section headings |
| `SectionHeader` | `SectionHeader.tsx` | `title`, `rightSlot` (ReactNode), `containerClassName`, `titleClassName` | Section title with action slot (buttons, toggles, filters) |
| `GameCard` | `GameCard.tsx` | `game`, `viewMode` (grid/list), `variant` (detailed/balanced/compact), `showSummary`, `showMeta`, `listRank` | Primary game display - grid or list layout |
| `ListCard` | `ListCard.tsx` | `list`, `variant` (create), `onCreateClick`, `createTitle`, `createDescription` | List display with game thumbnails or create-new button |
| `AwardCard` | `AwardCard.tsx` | `title`, `yearSpan`, `description`, `showStats`, `winners`, `nominees`, `icon` | Award category card |
| `AwardShowcase` | `AwardShowcase.tsx` | `id`, `title`, `description`, `games` (array) | Winner + nominees showcase |
| `WinnerCard` | `WinnerCard.tsx` | `game` (GameWithRanking), `className` | Award winner display |
| `AuthLayout` | `AuthLayout.tsx` | `title`, `subtitle`, `footer`, `children` | Wraps login/signup/reset pages |
| `Hero` | `Hero.tsx` | `variant` (default/awards), `title`, `subtitle`, `steps`, `cta` | Hero sections |
| `HomepageView` | `HomepageView.tsx` | `user`, `loading`, `featuredGames`, `userStats`, `phaseResult`, `discoveryLists`, `industryAwards`, `publicLists` | Homepage presentation (phase-aware) |
| `SearchandFilters` | `SearchandFilters.tsx` | `value`, `onChange`, `placeholder`, `filtersCount`, `onOpenFilters`, `onSearch` | Search bar + filter button |
| `SearchDropdown` | `SearchDropdown.tsx` | `grouped`, `flat`, `query`, `activeIndex`, `onHover`, `onSelect` | Search results dropdown |
| `FilterModal` | `FilterModal.tsx` | `open`, `onClose`, sort/filter state props | Full filter controls modal |
| `AddToModal` | `AddToModal.tsx` | `game`, `open`, `onClose`, `onMembershipChange` | Add to library/wishlist |
| `GameDetailModal` | `GameDetailModal.tsx` | `open`, `game` | Full game details |
| `PlayLogEditor` | `PlayLogEditor.tsx` | `gameId`, `gameName`, `autoFocus`, `openForm`, `onCreated`, `onUpdated` | Play logging form |
| `RatingPicker` | `Rankings/RatingPicker.tsx` | `current`, `onSelect`, `onClear`, `onClose`, `size` (sm/md) | 1-10 rating selector |
| `ZeroState` | `ZeroState.tsx` | `icon`, `title`, `description`, `action` ({label, href, onClick}), `variant` (default/compact) | Empty state placeholder |
| `LoadingSkeletons` | `LoadingSkeletons.tsx` | Exports: `GameCardSkeleton`, `ListSkeleton`, `AwardSkeleton`, `RankingSkeleton` | Skeleton loading states |
| `GameSearchSelect` | (in stories/) | `onSelect`, `placeholder`, `autoFocus`, `hero` | Game search with selection |
| `FannedGameImages` | `FannedGameImages.tsx` | Array of game objects | Fanned card image display |

---

### Global (`src/components/Global/`)

| Component | File | Notes |
|-----------|------|-------|
| `Navigation` | `Navigation.tsx` | Top nav - automatically rendered in root layout. Do not manually include. |
| `SiteFooter` | `SiteFooter.tsx` | Footer - automatically rendered in root layout. Do not manually include. |

---

## Routing Map

### Public Pages
| Route | Page File | Description |
|-------|-----------|-------------|
| `/` | `app/page.tsx` -> `HomepageView` | Phase-aware homepage |
| `/games` | `app/games/page.tsx` | Game catalog |
| `/games/[slug]` | `app/games/[slug]/page.tsx` | Game detail |
| `/categories` | `app/categories/page.tsx` | Category listing |
| `/categories/[slug]` | `app/categories/[slug]/page.tsx` | Category detail |
| `/mechanics` | `app/mechanics/page.tsx` | Mechanics listing |
| `/mechanics/[slug]` | `app/mechanics/[slug]/page.tsx` | Mechanic detail |
| `/publishers` | `app/publishers/page.tsx` | Publisher listing |
| `/publishers/[slug]` | `app/publishers/[slug]/page.tsx` | Publisher detail |
| `/awards` | `app/awards/page.tsx` | Awards overview |
| `/awards/industry` | `app/awards/industry/page.tsx` | Industry awards |
| `/awards/[award]` | `app/awards/[award]/page.tsx` | Award detail |
| `/rankings` | `app/rankings/page.tsx` | Leaderboards |
| `/friends` | `app/friends/page.tsx` | Friend discovery |
| `/search` | `app/search/page.tsx` | Search interface |
| `/lists` | `app/lists/page.tsx` | Public lists |
| `/lists/[id]` | `app/lists/[id]/page.tsx` | List detail |
| `/case-studies` | `app/case-studies/page.tsx` | Case studies |
| `/[username]` | `app/[username]/page.tsx` | Public user profile |
| `/[username]/library` | `app/[username]/library/page.tsx` | User's library |
| `/[username]/plays` | `app/[username]/plays/page.tsx` | User's plays |
| `/[username]/rankings` | `app/[username]/rankings/page.tsx` | User's rankings |
| `/[username]/awards` | `app/[username]/awards/page.tsx` | User's awards |
| `/[username]/stats` | `app/[username]/stats/page.tsx` | User's stats |
| `/[username]/lists` | `app/[username]/lists/page.tsx` | User's lists |
| `/[username]/friends` | `app/[username]/friends/page.tsx` | User's friends |
| `/[username]/wishlist` | `app/[username]/wishlist/page.tsx` | User's wishlist |
| `/[username]/activity` | `app/[username]/activity/page.tsx` | User's activity |

### Auth Pages
| Route | Page File |
|-------|-----------|
| `/login` | `app/login/page.tsx` |
| `/signup` | `app/signup/page.tsx` |
| `/reset-password` | `app/reset-password/page.tsx` |
| `/update-password` | `app/update-password/page.tsx` |
| `/auth/callback/handle` | `app/auth/callback/handle/page.tsx` |

### Authenticated Pages (mirror /[username]/ for self)
| Route | Page File |
|-------|-----------|
| `/profile` | `app/profile/page.tsx` |
| `/profile/library` | `app/profile/library/page.tsx` |
| `/profile/plays` | `app/profile/plays/page.tsx` |
| `/profile/rankings` | `app/profile/rankings/page.tsx` |
| `/profile/awards` | `app/profile/awards/page.tsx` |
| `/profile/stats` | `app/profile/stats/page.tsx` |
| `/profile/lists` | `app/profile/lists/page.tsx` |
| `/profile/friends` | `app/profile/friends/page.tsx` |
| `/profile/wishlist` | `app/profile/wishlist/page.tsx` |
| `/profile/activity` | `app/profile/activity/page.tsx` |
| `/library` | `app/library/page.tsx` |
| `/wishlist` | `app/wishlist/page.tsx` |
| `/plays` | `app/plays/page.tsx` |
| `/plays/new` | `app/plays/new/page.tsx` |
| `/settings` | `app/settings/page.tsx` |
| `/import` | `app/import/page.tsx` |
| `/add` | `app/add/page.tsx` |
| `/add-game` | `app/add-game/page.tsx` |
| `/awards/my` | `app/awards/my/page.tsx` |
| `/awards/my/[year]` | `app/awards/my/[year]/page.tsx` |

### Admin Pages
| Route | Page File |
|-------|-----------|
| `/admin/honors-summary` | `app/admin/honors-summary/page.tsx` |
| `/admin/missing-games` | `app/admin/missing-games/page.tsx` |
| `/admin/tagline-progress` | `app/admin/tagline-progress/page.tsx` |

### API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/callback` | GET | OAuth callback |
| `/api/auth/resolve-username` | - | Username resolution |
| `/api/auth/validate-invite` | - | Invite code validation |
| `/api/auth/generate-recovery` | - | Password recovery |
| `/api/games` | GET | Game search/listing |
| `/api/import-bgg` | POST | BoardGameGeek import |
| `/api/play-logs` | GET/POST | Play log CRUD |
| `/api/play-log-stats` | GET | Play statistics |
| `/api/play-log-summary` | GET | Play summary |
| `/api/lists/[id]` | GET/PATCH/DELETE | List CRUD |
| `/api/lists/[id]/reorder` | POST | List item reordering |
| `/api/rankings/reorder` | POST | Ranking reorder |
| `/api/awards/[year]` | GET | Awards by year |
| `/api/awards/[year]/[category]` | GET | Award category |
| `/api/awards/[year]/rebuild` | POST | Rebuild awards |
| `/api/awards/preferences` | GET/POST | Award preferences |
| `/api/missing-game-request` | POST | Request missing game |

---

## Styling Reference

### Tailwind Custom Theme

**Brand Colors**: `brand-DEFAULT` (#096EC2), `brand-light` (#2695E2), `brand-dark` (#074f8a), `brand-ring` (#1d7fd8), `brand-subtle` (#E7F4FF)

**Rating Colors** (1-10): red-400 -> orange-400 -> amber-400 -> yellow-400 -> lime-400 -> green-400 -> emerald-400 -> teal-400 -> cyan-400 -> purple-400

**Font Families**: `font-sans` (Inter), `font-display` (Outfit), `font-prestige` (Fraunces), `font-prestigeAlt` (Playfair Display), `font-poster` (Archivo Black), `font-softdisplay` (Epilogue)

### CSS Design Tokens (globals.css)
```css
/* Colors */
--color-bg: #e7f4ff        --color-surface: #ffffff     --color-surface-alt: #f1f5f9
--color-border: #e2e8f0     --color-border-strong: #cbd5e1
--color-text: #0f172a       --color-text-muted: #64748b  --color-text-subtle: #94a3b8
--color-accent: #2563eb     --color-accent-hover: #1d4ed8
--color-positive: #059669   --color-warning: #d97706     --color-danger: #dc2626

/* Radius */
--radius-xs: 3px   --radius-sm: 6px   --radius-md: 10px   --radius-lg: 16px

/* Shadows */
--shadow-xs   --shadow-sm   --shadow-md   --shadow-lg
```

### Global CSS Classes
```css
.panel                    /* Card container - use data-pad="xs/sm/md/lg/xl" */
.panel--tight             /* Compact padding */
.surface                  /* Bordered surface */
.surface-elevated         /* Elevated surface with shadow */
.ui-btn                   /* Base button */
.ui-btn-primary/secondary/ghost/danger/outline  /* Button variants */
.ui-btn-xs/sm/lg          /* Button sizes */
.ui-btn-rounded/pill/square  /* Button shapes */
.btn-brand                /* Brand blue button */
.btn-brand-outline        /* Brand outline button */
.toast / .toast-success   /* Toast notifications */
.gradient-background      /* Animated blob background */
.heading-display          /* Display font heading */
.scrollbar-hide           /* Hide scrollbars */
.animate-fade-slide       /* Fade + slide up animation */
.animate-pulse-soft       /* Soft brand pulse */
.focus-outline-brand      /* Brand focus ring */
.rating-1 through .rating-10  /* Rating background colors */
```

### Component Styling Pattern
```tsx
import { cn } from '@/utils/helpers'

// Pattern: base -> size -> state -> conditional -> user overrides
className={cn(
  'base-classes',
  sizeClasses[size],
  stateClasses[state],
  disabled && 'opacity-50 cursor-not-allowed',
  className
)}
```

---

## Data Patterns

### Supabase Clients
- **Browser**: `import { supabase } from '@/lib/supabase'`
- **Server**: `import { getSupabaseServerClient } from '@/lib/supabaseServer'`

### Auth Check Pattern
```tsx
'use client'
const [session, setSession] = useState(null)
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session)
  })
}, [])
```

### Page Data Flow
```
page.tsx (auth check, routing)
  -> Content.tsx (useEffect data fetching, useState management)
    -> View.tsx (pure props, renders design system components)
```

### User Phase Detection
```tsx
import { getUserPhase } from '@/lib/userPhase'
const phaseResult = getUserPhase({ accountAgeDays, rankedGamesCount, playLogsCount, awardsCount })
// phaseResult.phase: 1 | 2 | 3
// phaseResult.canShowHighestRanked, canShowSleeperHits, etc.
```

---

## Key Types

All types in `src/types/index.ts`. Supabase-generated types in `src/types/supabase.ts`.

Common types used across components:
- Game objects with `id`, `name`, `slug`, `thumbnail`, `bgg_id`, `min_players`, `max_players`, etc.
- User profiles with `id`, `username`, `display_name`, etc.
- Lists with `id`, `name`, `description`, `game_list_items` (array)
- Play logs with `id`, `game_id`, `played_at`, `duration`, `player_count`, etc.
- Rankings with `game_id`, `rank`, `rating` (1-10)
