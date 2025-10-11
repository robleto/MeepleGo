# Lighthouse Performance Remediation Plan · October 2025

**Audit source:** Google Lighthouse (mobile emulation) — overall performance score **57**

| Metric | Current | Target | Notes |
| --- | --- | --- | --- |
| First Contentful Paint (FCP) | 2.5 s | ≤ 1.8 s | Slow font & CSS delivery, hero render cost |
| Time to Interactive (TTI) | 8.4 s | ≤ 5.0 s | Heavy JS on main thread, client components everywhere |
| Speed Index | 3.7 s | ≤ 2.4 s | Same underlying causes as FCP/LCP |
| Total Blocking Time (TBT) | 1,160 ms | ≤ 200 ms | Long-running tasks from hydration bundles & third‑party code |
| Largest Contentful Paint (LCP) | 3.3 s | ≤ 2.5 s | Hero text + potential imagery blocked by fonts & layout scripts |
| Cumulative Layout Shift (CLS) | 0.057 | ≤ 0.05 | Acceptable, but watch during refactors |

---

## Root-Cause Hypotheses

1. **Render-blocking resources (1.26 s savings)**
   - Adobe Typekit stylesheet + custom fonts load synchronously, delaying first paint.
   - Global CSS bundle is large because Tailwind safelist + legacy styles are shipped to every page.
2. **Excess JS hydrate cost (0.94 s savings)**
   - Many top-level UI pieces (`Hero`, navigation, footers, large list wrappers) are marked `'use client'`, even when they are static.
   - Third-party libraries (GSAP, dnd-kit, Heroicons) are included in the initial bundle.
3. **Offscreen media & LCP**
   - Hero component likely contributes the LCP yet ships icons, CTA handlers, and list markup before paint.
   - Some images still use `<img>` instead of `next/image` (check lists, awards, ranking thumbnails).
4. **Third-party code & analytics**
   - Sentry + Umami + optional extras all attach immediately after interactive. Combined they add 310 ms of main-thread blocking in Lighthouse.
5. **DOM & data payloads**
   - Homepage renders the entire marketing content + list previews up front (~1,862 DOM nodes).
   - API responses and serialized props add to transfer (89 requests, 2.2 MB).
6. **Build tooling gaps**
   - No automated bundle analysis or Lighthouse gating in CI, so regressions ship unnoticed.

---

## Action Plan (proposed GitHub issue checklist)

### P0 · Render path & LCP stabilization

- [x] Replace Adobe Typekit fallback with `next/font` self-hosted fonts (Inter, Outfit, etc.) and `font-display: swap`.
- [x] Inline critical hero styles or rely on Tailwind utilities only; remove global marketing CSS.
- [x] Convert `Hero` and other static marketing sections to **server components**; expose callbacks via lighter client islands only when needed.
- [x] Audit hero image/content: ensure LCP element uses `<Image priority />` or plain text without blocking assets.
- [x] Add `<link rel="preload">` for the LCP asset when necessary (background illustration, hero image).

### P1 · Bundle & JS execution trimming

- [ ] Introduce webpack/analyze via `next.config.js` (`bundle-analyzer`) and capture baseline artifact sizes.
- [ ] Tree-shake icons and shared libs — switch to `@heroicons/react/20/solid` per-use imports or custom SVGs.
- [ ] Dynamically import heavy libraries (`@dnd-kit`, GSAP) in components that actually need them.
- [ ] Remove `'use client'` from components that can render on the server (navigation, footers, headings, hero, marketing sections).
- [ ] Split dashboard-sized bundles with route-level code splitting where applicable.

### P1 · Media & image discipline

- [ ] Replace remaining `<img>` tags with `next/image`, enforce `loading="lazy"` for below-the-fold assets.
- [ ] Add `sizes` metadata to responsive images to prevent over-fetching.
- [ ] Consider generating modern formats (WebP/AVIF) for hero/marketing imagery.

### P2 · Third-party governance & JS idle work

- [ ] Gate Sentry Replay & traces using environment-based sampling (already partially in place; lower production sample rate to 5%).
- [ ] Move Umami + optional analytics to `strategy="idle"` or `lazyOnload` when applicable.
- [ ] Evaluate deferring non-critical third-party scripts until after first interaction.

### P2 · DOM & data hygiene

- [ ] Lazy render secondary marketing sections (fold details, testimonials, etc.) behind `IntersectionObserver` or route-level streaming.
- [ ] Reduce DOM depth in hero and list components by flattening wrappers.
- [ ] Paginate or virtualize large list renders on landing pages when sample data grows.

### P3 · Tooling & regression prevention

- [ ] Wire up `@lhci/cli` in GitHub Actions with performance budgets (FCP ≤ 1.8 s, LCP ≤ 2.5 s, TBT ≤ 200 ms).
- [ ] Add `next build --profile` (or `turbo build -- --profile`) job to capture main-thread task timings.
- [ ] Track bundle size budgets via `next-plugin-cerbo` or `webpack-bundle-analyzer` artifact uploaded on every PR.
- [ ] Document performance budgets and expectations in `docs/performance/README.md` (to be created).

---

## Measurement & Acceptance Criteria

- Re-run Lighthouse (mobile, CI) after each milestone; fail CI if score < 85.
- Record before/after metrics in this doc or linked issue comment thread.
- Collect `next build --analyze` reports for both `/` and key authenticated routes.
- Integrate Web Vitals (`web-vitals` package or Next.js `reportWebVitals`) to monitor real-user data post-deploy.

**Success definition:**

- Performance score ≥ 85 on desktop and mobile audits.
- TBT under 200 ms on mobile emulation.
- LCP consistently < 2.5 s for hero element.
- No regression in accessibility or SEO scores (> 95).

---

## Issue Template Snippet

```md
### Summary
- Lighthouse mobile score: 57 (Oct 2025)
- Major blockers: render-blocking fonts/CSS, heavy hydration bundle, offscreen media loading, third-party script cost.

### Goals
- Raise mobile performance score to ≥ 85.
- Reduce TBT to < 200 ms, LCP to < 2.5 s, FCP to < 1.8 s.

### Tasks
- [ ] P0: Rework font strategy with `next/font`, convert hero to server component, preload LCP asset.
- [ ] P1: Add bundle analyzer, remove unused JS via dynamic imports and client/server split.
- [ ] P1: Audit and fix offscreen images (use `next/image`, lazy loading, correct `sizes`).
- [ ] P2: Tune third-party script loading (Sentry/Umami) and sampling.
- [ ] P2: Trim DOM depth and lazy render below-the-fold marketing sections.
- [ ] P3: Add Lighthouse CI + bundle budget enforcement in GitHub Actions.

### Acceptance Criteria
- Lighthouse CI passes with score ≥ 85.
- Metrics: FCP ≤ 1.8 s, LCP ≤ 2.5 s, TBT ≤ 200 ms, CLS ≤ 0.05.
- Document improvements and before/after metrics in `/docs/performance/`.
```

---

### Next Steps

1. Open GitHub issue using snippet above and reference this plan.
2. Create branch `perf/lighthouse-2025-10` to begin implementation work.
3. Prioritize P0 items for the first PR; schedule follow-up PRs for P1/P2/P3 tasks.
