## MeepleGo UI / Design Elevation Plan

Goal: Evolve from functional MVP to a refined, brand-cohesive experience with the calm polish of premium consumer apps (inspiration: Airbnb typography rhythm, linear.app surface clarity, Notion restraint).

### Pillars

1. Typography hierarchy: confident but quiet. Reduce weight reliance; increase spatial rhythm; consistent optical sizes.
2. Color usage: accent sparingly. Let content (covers, ratings) provide color — UI chrome stays neutral & airy.
3. Surfaces & depth: subtle layered cards, soft radii, cohesive shadow scale tokens.
4. Motion: micro (buttons, hover elevation, modal entry) and purposeful (drag / log panel) with consistent easing (cubic-bezier(0.4,0.1,0.2,1)).
5. Density: reduce cramped clusters; introduce breathing room scales (4 / 8 / 12 / 16 / 24 / 40).

### Token System (implemented)

CSS vars for surfaces, borders, radii, shadows, semantic colors (see globals.css additions). Next: extract as TypeScript design-tokens.ts for programmatic usage.

### Immediate Iteration Targets

1. Navigation: lighten background (translucent blur), reduce hard borders, introduce active pill style.
2. GameCard: adopt new surface tokens, refine spacing, integrate aspect-ratio skeleton, soften rating chip styles; winner badge minimal icon + label on hover.
3. Lists / grids: standardize gutters (1.25rem) and card min width; add responsive masonry option (phase 2).
4. Headings: complete migration to Heading component with scale map (xs / sm / base / md / lg / xl / display) and line-height tokens.
5. Forms: convert ad‑hoc inputs to unified field wrapper (label size, description, error, focus ring color). Include subtle inset background in dark mode.
6. Toast system: global provider stack (success / error / info) replacing inline ad-hoc toasts.
7. Log panel: refined theming: frosted surface, improved rating pill hover, motion transition parity mobile/desktop.

### Near Term Enhancements

- Image pipeline: consistent 8px rounded corners + subtle inner shadow.
- Game detail modal: two-column layout (cover left, meta + actions right) w/ vertical rhythm; sticky rating bar.
- Awards pages: prestige typographic variant toggle; reduce color noise; accent serif only in primary award name.
- Dark mode tuning: adjust contrast for mid surfaces (avoid pure #1e293b blocks).
- Accessibility: larger touch targets (min 40px) and focus outlines unified via token.

### Component Refinement Queue

| Component      | Status       | Planned Upgrade                                                  |
| -------------- | ------------ | ---------------------------------------------------------------- |
| Navigation     | MVP          | Blur + translucent + active pill + icon size normalization       |
| GameCard       | Functional   | Tokenized spacing, reduced shadows, hover lift + overlay actions |
| Heading        | Partial      | Responsive scale + letter-spacing adjustments per size           |
| GameLogQuick   | New          | Frosted panel + progress bar on batch save                       |
| Forms (global) | Inconsistent | Field wrapper + validation states                                |
| Toasts         | Ad hoc       | Central provider + queue + accessible announcements              |

### Visual Language Decisions

- Radii: xs=3, sm=6, md=10, lg=16 (cards use md, large modals use lg, small pills use sm).
- Shadows: only xs / sm / md / lg; no arbitrary utilities.
- Primary accent Blue 600; use Blue 500 hover in dark; avoid gradients except in marketing surfaces.
- Rating chips remain colored but desaturate backgrounds slightly for legibility (future refinement: pastel palette tokenization).

### Implementation Phasing

1. Tokens + primitives (DONE initial)
2. Global Providers (toasts, maybe theme/typography toggle)
3. Navigation refactor
4. Unified buttons & fields
5. Card & modal refinement
6. Typography finalization + lint rule
7. Image pipeline polish
8. Motion pass (timing/ease unification)

### Risks / Mitigation

- Font payload: prune unused display variants; implement dynamic optional font loading for prestige set.
- Over iteration: lock tokens before mass refactors; create codemod for button class migrations.

### Success Metrics

- CLS stable (image placeholders).
- Reduced DOM depth in key grids.
- Consistent heading vertical rhythm (design audit script).
- Accessibility: Lighthouse accessibility >= 95.

---

Use this doc as a living artifact; update as tokens or priorities evolve.
