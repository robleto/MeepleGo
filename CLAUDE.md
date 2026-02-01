# MeepleGo - Claude Code Instructions

## Critical Rules

1. **ALWAYS check `src/components/` before creating any UI element.** The design system has 54+ Storybook-documented components. Use them.
2. **NEVER write raw HTML/Tailwind for elements that already exist as components.** See `.claude/ARCHITECTURE.md` for the full component inventory.
3. **Use `cn()` from `src/utils/helpers.ts`** for all conditional class merging (not manual string concatenation).
4. **Follow the existing page composition pattern**: thin `page.tsx` -> Content component (data) -> View component (presentation).
5. **Read the Storybook stories** for any component before using it. Stories show all variants, props, and real-world usage examples.

## Project Overview

MeepleGo is a board game collection management platform. Next.js 16 App Router + Supabase + Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 16.1.5 (App Router)
- **React**: 19.1.1
- **Database/Auth**: Supabase (supabase-js 2.53.0, SSR 0.6.1)
- **Styling**: Tailwind CSS 3.4.17 + `clsx` + `tailwind-merge`
- **Icons**: @heroicons/react 2.2.0
- **Animation**: GSAP 3.13.0
- **Drag & Drop**: @dnd-kit
- **Search**: fuse.js 7.1.0
- **Testing**: Vitest + Playwright + Storybook 10.2.0
- **Error Tracking**: Sentry

## Directory Structure

```
src/
├── app/                     # Next.js App Router pages & API routes
│   ├── [username]/          # Public user profiles
│   ├── profile/             # Authenticated user profile
│   ├── api/                 # API routes
│   ├── games/               # Game catalog
│   ├── awards/              # Awards system
│   ├── lists/               # User lists
│   ├── plays/               # Play logging
│   └── ...                  # Other routes
├── components/              # Component library (ALWAYS USE THESE)
│   ├── Foundations/          # Design tokens, Logo, colors, typography
│   ├── Controls/            # Form controls (TextInput, Select, Toggle, etc.)
│   ├── Elements/            # Atomic UI (Button, Badge, Chip, Alert, etc.)
│   ├── Components/          # Composite components (GameCard, PageLayout, etc.)
│   ├── Global/              # Navigation, SiteFooter
│   └── Profile/             # Profile-specific components
├── hooks/                   # Custom React hooks
├── lib/                     # Business logic (Supabase, analytics, userPhase)
├── types/                   # TypeScript types (index.ts, supabase.ts)
├── utils/                   # Pure utilities (helpers, search, filters)
└── stories/                 # Storybook docs & page-level stories
```

## Component Hierarchy (Use This Order)

Before building any UI, check components in this order:

### 1. Foundations (`src/components/Foundations/`)
- `Logo` - App logo (size: sm/md/lg, showText, href)
- `ratingColors.ts` - Rating 1-10 color classes (`getRatingSolidClass`, `getRatingSubtleClass`)

### 2. Controls (`src/components/Controls/`)
- `TextInput` - Text field (size, state, icons)
- `Textarea` - Multi-line input (autoResize, maxHeight)
- `Select` - Dropdown select (size, state, leftIcon)
- `Checkbox` - Checkbox (size, state, indeterminate, description)
- `Radio` - Radio button (size, state, description)
- `Toggle` - Switch toggle (size, state, labelPosition)
- `ToggleGroup` - Segmented control (variant: default/pills/cards)
- `SearchInput` - Search field with clear button
- `FilterButton` - Filter trigger with active count badge

### 3. Elements (`src/components/Elements/`)
- `Button` - Buttons (variant: primary/secondary/ghost/danger/outline, size, shape, loading)
- `Badge` - Status badges (variant, size, shape, subtle)
- `Chip` / `RatingChip` - Tags and rating pills (color, size, variant: subtle/solid/outline/overlay)
- `Alert` - Alerts (variant: success/error/warning/info, dismissible)
- `GameImage` - Game box art with fallback (variant: square/thumb)
- `StatCard` - Stat display (Icon, value, label, size: default/compact/mini)
- `NavItem` - Navigation link (name, href, icon, isActive)
- `Overlay` - Modal backdrop (variant: dark/light/blur)
- `RatingPopup` - Rating selector popup
- `Tooltip` - Hover tooltip
- `Spinner` - Loading spinner
- `Tabs` / `VerticalTabs` - Tab navigation
- `Pagination` - Page navigation
- `DateTimePicker` / `TimePicker` - Date/time inputs
- `JournalTimelineMarker` / `TimelineMarker` - Timeline UI
- `ScrollToTop` - Scroll to top button
- `Transition` - Animation wrapper
- `TextField` - Legacy text field

### 4. Components (`src/components/Components/`)
- `PageLayout` - Standard page wrapper (max-w-7xl, padding, bg-gray-50)
- `Heading` - Page/section headings (as, size, displayFont)
- `SectionHeader` - Section title with rightSlot for actions
- `GameCard` - Game display (viewMode: grid/list, variant: detailed/balanced/compact)
- `ListCard` - List display (variant: create for new list button)
- `AwardCard` - Award category card
- `AwardShowcase` - Winner + nominees display
- `WinnerCard` - Award winner game card
- `AuthLayout` - Auth page wrapper (login, signup, reset)
- `Hero` - Hero sections (variant: default/awards)
- `HomepageView` - Homepage presentation (phase-aware)
- `SearchandFilters` - Search bar + filter button combo
- `SearchDropdown` - Search results dropdown
- `FilterModal` - Filter controls modal
- `AddToModal` - Add game to library/wishlist modal
- `GameDetailModal` - Full game details modal
- `PlayLogEditor` - Play logging form
- `RatingPicker` - 1-10 rating selector
- `ZeroState` - Empty state placeholder (icon, title, description, action)
- `LoadingSkeletons` - Skeleton loading states (GameCardSkeleton, ListSkeleton, etc.)
- `FannedGameImages` - Fanned card display
- `GameSearchSelect` - Game search with selection

### 5. Global (`src/components/Global/`)
- `Navigation` - Top nav bar (automatically in root layout)
- `SiteFooter` - Footer (automatically in root layout)

## Styling Rules

### Design Tokens (use CSS variables)
```
--color-bg: #e7f4ff          --color-surface: #ffffff
--color-text: #0f172a        --color-text-muted: #64748b
--color-accent: #2563eb      --color-border: #e2e8f0
--radius-sm: 6px             --radius-md: 10px             --radius-lg: 16px
--shadow-sm, --shadow-md, --shadow-lg
```

### Brand Colors
- `brand-DEFAULT: #096EC2` (primary blue)
- `brand-light: #2695E2` (hover)
- `brand-dark: #074f8a` (pressed)
- `brand-subtle: #E7F4FF` (backgrounds)

### Font Families
- `font-sans` (Inter) - body text
- `font-display` (Outfit) - headings, display text
- `font-prestige` (Fraunces) - awards/premium
- `font-poster` (Archivo Black) - large display

### CSS Component Classes (in globals.css)
- `.panel` - Card container with padding (use data-pad="xs/sm/md/lg/xl")
- `.surface` / `.surface-elevated` - Background surfaces
- `.ui-btn` + `.ui-btn-primary/secondary/ghost/danger/outline` - Button styles
- `.btn-brand` / `.btn-brand-outline` - Brand-colored buttons
- `.toast` / `.toast-success` - Toast notifications
- `.gradient-background` + `.blob-*` - Animated gradient backgrounds

### Rating Colors
Always use `getRatingSolidClass(n)` or `getRatingSubtleClass(n)` from `src/components/Foundations/ratingColors.ts`. Never hardcode rating colors.

## Page Composition Pattern

```
src/app/[route]/page.tsx          # Thin wrapper: auth check + delegate
  -> src/app/[route]/Content.tsx  # Data fetching + state management (or inline)
    -> src/components/.../View.tsx # Pure presentation (props only)
      -> Components, Elements, Controls from the design system
```

### Key Patterns
- **Auth check**: `supabase.auth.getSession()` in useEffect or server component
- **Server client**: `getSupabaseServerClient()` from `src/lib/supabaseServer.ts`
- **Browser client**: `supabase` from `src/lib/supabase.ts`
- **Loading state**: Use `LoadingSkeletons` components, not custom spinners
- **Empty state**: Use `ZeroState` component, not custom empty messages
- **Page wrapper**: Wrap content in `PageLayout` (except full-viewport pages like onboarding)

## User Phase System

Users progress through phases based on activity. Check `src/lib/userPhase.ts`:
- **Phase 1** (New): < 10 ranked, < 3 plays, < 7 days
- **Phase 2** (Returning): >= 10 ranked OR >= 3 plays OR >= 7 days
- **Phase 3** (Power): >= 25 ranked OR >= 10 plays

Use `phaseResult.canShow*` flags for conditional feature rendering.

## Import Aliases

- `@/*` maps to `./src/*` (e.g., `import { cn } from '@/utils/helpers'`)

## Dark Mode

Currently disabled (tracked in GitHub Issue #27). CSS variables are defined but commented out. Do not implement dark mode unless specifically requested.

## Testing

- **Unit tests**: Vitest (`vitest.config.ts`)
- **E2E tests**: Playwright (`playwright.config.ts`)
- **Component docs**: Storybook 10 (`.storybook/`)
- Run: `npm test`, `npx playwright test`, `npm run storybook`
