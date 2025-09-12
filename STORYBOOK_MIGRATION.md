# Storybook Migration

This document tracks the migration from legacy scattered story locations (`src/components/features/*`, `src/components/shared/*`) to a curated component library structure under:

- `src/components/Components/`
- `src/components/Elements/`
- `src/components/Foundations/`

## Goals
- Eliminate Storybook indexing noise caused by empty placeholder story files.
- Improve discoverability via focused category groupings.
- Separate active, documented UI primitives from archived legacy feature-specific components.

## Changes Performed (Phase 1)
| Action | Path |
|--------|------|
| Archived (empty) | `src/components/shared/Alert.stories.tsx` |
| Archived (empty) | `src/components/shared/Chip.stories.tsx` |
| Archived (empty) | `src/components/features/awards/AwardCard.stories.tsx` |

Archived files relocated to:
`src/components/_archived/legacy-stories/`

## Story Globs Update
`.storybook/main.ts` updated to limit story search to:
```
../src/components/Components/**/*.stories.@(js|jsx|mjs|ts|tsx)
../src/components/Elements/**/*.stories.@(js|jsx|mjs|ts|tsx)
../src/components/Foundations/**/*.stories.@(js|jsx|mjs|ts|tsx)
../src/design-system/**/*.stories.@(js|jsx|mjs|ts|tsx)
../src/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)
```
Legacy `features` and `shared` root folders are intentionally excluded (except where refactored components are moved into the new structure).

## New / Restored Stories
| Component | Location | Notes |
|-----------|----------|-------|
| Hero | `src/components/Components/Hero.stories.tsx` | New multi-variant hero (default + awards). |
| Alert | `src/components/Elements/Alert.stories.tsx` | Comprehensive variants (info/success/warning/error), sizes, dismissible. |
| Chip | `src/components/Elements/Chip.stories.tsx` | Variants, colors, sizes, shapes, rating chips, overlay examples. |

## Follow‑Up Candidates
Components that may warrant refactored stories (audit required):
- List / Card primitives (ListCard, GameCard, FannedGameImages)
- Form controls under `shared/Controls` (promote into `Elements/` with consistent APIs)
- Layout primitives (Navigation, SiteFooter) → potentially `Components/` or a new `Layout/` group.

## Next Steps (Suggested)
1. Refactor any still‑used legacy feature stories into proper component stories (one per atomic concept).
2. Remove remaining empty or obsolete story files after confirming no runtime imports rely on them.
3. Add visual regression coverage (Chromatic already listed) once baseline approved.
4. Introduce MDX docs pages for design tokens & theming (`Foundations/`).
5. Enforce lint rule to disallow empty story files.
 6. (Optional) Establish Chromatic baseline: run `npm run chromatic` after merging this migration to capture initial snapshots.

## Verification Checklist
- [x] Empty legacy stories archived
- [x] Storybook config narrowed
- [x] New stories authored for Alert, Chip, Hero
- [ ] Remaining legacy story set reviewed (pending audit)

---
This document will evolve as additional components are migrated.
