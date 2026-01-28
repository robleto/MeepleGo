# Pre-Ship Integration Test Guide

## Test 1: Guest Onboarding Flow

### Setup
1. Open app in incognito/private browsing mode
2. Clear localStorage if needed: `localStorage.clear()`

### Test Steps

**Step 1: First Visit - Onboarding Modal**
- [ ] Visit homepage as new user
- [ ] OnboardingModal should appear automatically
- [ ] Verify 4 steps with progress dots
- [ ] Step 1: Welcome message with "Get Started" button
- [ ] Step 2: Rating explanation with visual example
- [ ] Step 3: List management explanation
- [ ] Step 4: Explore features
- [ ] Click "Skip Tour" - modal closes
- [ ] Refresh page - onboarding should NOT show again (already completed)

**Step 2: Guest Rating Activity**
- [ ] Browse to /games page
- [ ] Click on a game card to open GameDetailModal
- [ ] Rate a game (1-10 scale)
- [ ] Verify rating is saved (refresh, rating persists)
- [ ] Rate 2 more games (total: 3 ratings)
- [ ] After 3rd rating, SignupPrompt modal should appear
- [ ] Verify prompt shows "3 ratings" count
- [ ] Click outside or "Not now" to dismiss

**Step 3: Guest List Activity**
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Browse to /games page
- [ ] Click bookmark icon on 5+ games to add to library
- [ ] After 5th game, SignupPrompt should appear
- [ ] Verify prompt shows "5 list items" count

**Step 4: Guest Data Migration**
- [ ] Have 3+ ratings and/or 5+ list items as guest
- [ ] SignupPrompt appears
- [ ] Click "Create Account" button
- [ ] Verify redirect to `/signup?migrate=true`
- [ ] Verify green banner shows guest data counts
- [ ] Fill out signup form with valid email/password/invite code
- [ ] Submit form
- [ ] Verify confirmation message about email verification
- [ ] Check email inbox
- [ ] Click email confirmation link
- [ ] Verify redirect completes successfully
- [ ] Check /rankings page - guest ratings should be migrated
- [ ] Check /library page - guest library items should be migrated
- [ ] Verify localStorage guest session is cleared

---

## Test 2: Loading Skeletons

### Games Page
- [ ] Navigate to /games while logged out
- [ ] Verify 12 GameCardSkeleton components in grid layout
- [ ] Change to list view (in FilterModal)
- [ ] Refresh page
- [ ] Verify skeletons render in list layout

### Rankings Page
- [ ] Navigate to /rankings while logged in with no ratings
- [ ] Should show ZeroState (not skeleton)
- [ ] Add 1+ ratings
- [ ] Refresh page
- [ ] Verify 8 RankingSkeleton components appear briefly during load

### Lists Page
- [ ] Navigate to /lists while logged in
- [ ] Verify 6 ListSkeleton components in grid layout
- [ ] Skeletons should show while lists are loading

---

## Test 3: Zero States

### Rankings Zero State
- [ ] Log in as user with no ratings
- [ ] Navigate to /rankings
- [ ] Verify ZeroState with:
  - Star icon
  - "You haven't rated any games yet" title
  - Description about rating 1-10
  - "Browse Games to Rate" button
  - Button links to /games

### Library Zero State
- [ ] Navigate to /library with no games in library
- [ ] Verify ListExplorer shows:
  - "Your library is empty" title
  - "Add games by bookmarking them." message

### Wishlist Zero State
- [ ] Navigate to /wishlist with no games in wishlist
- [ ] Verify similar empty state message

### Lists Zero State
- [ ] Log in as new user with no custom lists
- [ ] Navigate to /lists
- [ ] Verify default lists (Library, Wishlist) appear
- [ ] Verify "Create New List" button is visible

---

## Test 4: Mobile Modal Behavior

### GameDetailModal on Mobile
- [ ] Open Chrome DevTools
- [ ] Set device to iPhone 13 Pro (390x844)
- [ ] Click on a game card
- [ ] Verify modal is:
  - Full screen height (h-[100dvh])
  - No rounded corners (rounded-none)
  - Fills entire viewport
- [ ] Switch to desktop viewport (1920x1080)
- [ ] Click on a game card
- [ ] Verify modal is:
  - Centered with max-width
  - Rounded corners (md:rounded-2xl)
  - Not full height

### FilterModal on Mobile
- [ ] Set device to mobile (390x844)
- [ ] Open filter modal from games page
- [ ] Verify modal is:
  - Full screen height (h-[100dvh])
  - No rounded corners
  - Fills entire viewport
- [ ] Switch to desktop
- [ ] Open filter modal
- [ ] Verify modal is:
  - Centered with max-width
  - Rounded corners
  - Max height 80vh

---

## Test 5: Storybook Coverage

### Verify New Stories
- [ ] Run `npm run storybook`
- [ ] Navigate to Components → ZeroState
  - [ ] Verify 8 variants render
  - [ ] Test Rankings variant
  - [ ] Test Wishlist variant
  - [ ] Test Library variant

- [ ] Navigate to Components → Rankings → RatingPicker
  - [ ] Verify 7 variants + interactive example
  - [ ] Test hover states on rating numbers
  - [ ] Test interactive rating selection

- [ ] Navigate to Elements → StatCard
  - [ ] Verify 13 variants render
  - [ ] Test different icon backgrounds
  - [ ] Test grid layouts

- [ ] Navigate to Components → SectionHeader
  - [ ] Verify 9 variants render
  - [ ] Test with actions
  - [ ] Test with filters
  - [ ] Test custom styling

- [ ] Navigate to Components → LoadingSkeletons
  - [ ] Verify GameCardSkeleton (grid + list variants)
  - [ ] Verify ListSkeleton
  - [ ] Verify AwardSkeleton
  - [ ] Verify RankingSkeleton
  - [ ] Test page layout examples

---

## Expected Results Summary

✅ **Onboarding**: New users see welcome flow once, can skip
✅ **Guest Conversion**: Signup prompt after 3 ratings OR 5 list items
✅ **Migration**: Guest data transfers to account on email confirmation
✅ **Skeletons**: All major pages show proper loading states
✅ **Zero States**: Empty pages guide users to take action
✅ **Mobile**: Modals are full-screen on mobile, centered on desktop
✅ **Storybook**: 60+ documented component variants

---

## Regression Checks

- [ ] Existing features still work (rating, lists, awards, filtering)
- [ ] No console errors during normal usage
- [ ] No broken TypeScript compilation
- [ ] Guest session doesn't interfere with authenticated users
- [ ] Migration doesn't create duplicates
- [ ] Onboarding state persists correctly
