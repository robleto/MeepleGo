# Modal Positioning Fix for Navigation-Triggered Modals

## Problem
Modals triggered from the navigation "+" button were positioned too high and getting cut off at the top of the viewport. This was because they were using standard vertical centering (`items-center justify-center`) which didn't account for the navigation bar height.

## Solution
Added a `fromNav` prop to modal components that adjusts their positioning when triggered from the navigation bar.

### Changes Made

#### 1. FilterModal Component
- Added `fromNav?: boolean` prop to `FilterModalProps` interface
- Added conditional positioning logic:
  ```tsx
  const modalClasses = fromNav 
    ? "items-start pt-20" // More top padding when from nav
    : "items-center"
  ```
- Updated modal container to use dynamic classes and reduced max height from `90vh` to `80vh`

#### 2. GameDetailModal Component  
- Added `fromNav?: boolean` prop to `GameDetailModalProps` interface
- Added conditional positioning logic similar to FilterModal
- Adjusted modal height calculation for better spacing when triggered from nav

#### 3. CreateListModal Component
- Added `fromNav?: boolean` prop to `CreateListModalProps` interface
- Added conditional positioning logic similar to other modals

#### 4. Navigation Component
- Updated `CreateListModal` usage to pass `fromNav={true}`
- PlayLogModal already had good positioning with `items-end sm:items-center`

### Implementation Details

The positioning strategy uses:
- `items-start pt-20` for nav-triggered modals (positions from top with 5rem padding)
- `items-center` for standard modals (vertically centered)
- Reduced max height to `80vh` for nav-triggered modals to ensure they fit properly

### Usage

When opening modals from navigation components, pass the `fromNav` prop:

```tsx
<FilterModal 
  fromNav={true}
  // other props...
/>

<GameDetailModal 
  fromNav={true}
  // other props...
/>

<CreateListModal 
  fromNav={true}
  // other props...
/>
```

This ensures proper positioning that accounts for the navigation bar height and prevents modals from being cut off at the top of the viewport.
