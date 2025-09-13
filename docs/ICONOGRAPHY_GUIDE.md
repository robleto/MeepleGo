# MeepleGo Iconography Guide

## 🎯 Standard Icon System

Consistent iconography using Heroicons (24/outline) across all components.

### Core Actions & States

| Concept         | Icon             | Usage                          | Notes                           |
| --------------- | ---------------- | ------------------------------ | ------------------------------- |
| **Played**      | `PlayIcon`       | Played status, game logs       | Filled triangle pointing right  |
| **Library/Own** | `BookOpenIcon`   | Collection/Library membership  | Open book for "owned/collected" |
| **Wishlist**    | `HeartIcon`      | Wishlist membership            | Heart for "want to have"        |
| **Lists**       | `ListBulletIcon` | Custom lists, list management  | Bullet points for lists         |
| **Games**       | `CubeIcon`       | Games section, game references | 3D cube represents board games  |
| **Awards**      | `TrophyIcon`     | Awards, winners, achievements  | Classic trophy                  |

### Navigation & UI

| Concept       | Icon                  | Usage                       | Notes                          |
| ------------- | --------------------- | --------------------------- | ------------------------------ |
| **Bookmark**  | `BookmarkIcon`        | Collection management, save | Only for collection indicators |
| **Search**    | `MagnifyingGlassIcon` | Search functionality        | Standard magnifying glass      |
| **Filter**    | `FunnelIcon`          | Filtering options           | Funnel shape                   |
| **Close**     | `XMarkIcon`           | Modal close, cancel         | X mark                         |
| **Grid View** | `Squares2X2Icon`      | Grid layout toggle          | 2x2 grid                       |
| **List View** | `ListBulletIcon`      | List layout toggle          | Same as Lists                  |

### Metadata & Info

| Concept     | Icon            | Usage                    | Notes                      |
| ----------- | --------------- | ------------------------ | -------------------------- |
| **Players** | `UserGroupIcon` | Player count             | Group of people            |
| **Time**    | `ClockIcon`     | Playing time             | Clock face                 |
| **Year**    | `CalendarIcon`  | Publication year         | Calendar                   |
| **Rating**  | N/A             | Use RatingChip component | Numbers in colored circles |

### States & Special

| Concept     | Icon            | Usage          | Notes                |
| ----------- | --------------- | -------------- | -------------------- |
| **Winner**  | `TrophyIcon`    | Award winners  | Same as Awards       |
| **Nominee** | `StarIcon`      | Award nominees | Star for recognition |
| **Loading** | `ArrowPathIcon` | Loading states | Rotating arrow       |

## 🎨 Color Associations

- **Green**: Library/Collection (`BookOpenIcon`)
- **Pink**: Wishlist (`HeartIcon`)
- **Amber/Gold**: Awards/Winners (`TrophyIcon`)
- **Blue**: Played status (`PlayIcon`)
- **Gray**: Neutral actions

## 📏 Size Standards

- **Small**: `h-3 w-3` (12px) - Compact displays
- **Medium**: `h-4 w-4` (16px) - Standard UI
- **Large**: `h-5 w-5` (20px) - Prominent elements
- **XL**: `h-6 w-6` (24px) - Headers, heroes

## ✅ Current Implementation

This system is already mostly implemented across:

- GameCard components ✅
- Navigation ✅
- Filter modals ✅
- Award components ✅
- List management ✅

## 🔄 Migration Notes

- Replace any inconsistent icon usage with the above standards
- BookmarkIcon should only be used for collection management
- PlayIcon represents "played" status universally
- CubeIcon represents "games" as a concept
