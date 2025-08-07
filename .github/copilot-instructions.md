# MeepleGo - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Next.js 15 board game collection management app called MeepleGo, inspired by the Reawarding project structure.

## Tech Stack & Conventions

- **Framework**: Next.js 15 with App Router, TypeScript
- **Styling**: Tailwind CSS v3.4 with custom color system for ratings (1-10 scale)
- **Database**: Supabase with Row Level Security
- **Components**: Functional components with hooks
- **State**: React state, no external state management yet
- **Animations**: GSAP for complex animations
- **Drag & Drop**: @dnd-kit for sortable lists and awards

## Rating System

The app uses a 1-10 rating system with specific colors:
- 1: red-600 (Awful)
- 2: orange-600 (Bad) 
- 3: amber-600 (Poor)
- 4: yellow-600 (Below Average)
- 5: lime-600 (Average)
- 6: green-600 (Above Average)
- 7: emerald-600 (Good)
- 8: teal-600 (Very Good)
- 9: cyan-600 (Great)
- 10: sky-600 (Masterpiece)

## Project Structure

- `/src/app/` - Next.js App Router pages
- `/src/components/` - Reusable components
- `/src/lib/` - Utilities and configurations (Supabase client)
- `/src/types/` - TypeScript type definitions
- `/src/utils/` - Helper functions

## Key Features

1. **Awards**: Yearly awards with drag-and-drop nominations/winners
2. **Rankings**: 1-10 rating system with "Played It" status
3. **Games**: Collection view with grid/list modes, filtering
4. **Lists**: Custom user lists with drag-and-drop ordering
5. **Profile**: User settings and statistics

## Database Schema

- `games` - Master game list
- `profiles` - User profiles  
- `rankings` - User ratings and played status
- `lists` - User-created lists
- `list_items` - Games in lists with ordering
- `awards` - Yearly awards with nominees/winners

## Code Patterns

- Use TypeScript strictly
- Prefer server components when possible
- Use client components for interactivity
- Follow Tailwind utility-first approach
- Use custom hooks for complex logic
- Implement proper error handling
- Use Supabase RLS for security

## Component Guidelines

- Props should be typed with interfaces
- Use proper semantic HTML
- Implement loading and error states
- Make components responsive
- Use proper ARIA labels for accessibility
- Implement proper keyboard navigation
