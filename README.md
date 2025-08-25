# MeepleGo

A comprehensive board game collection manager built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## 📂 Project Organization

- **`/src/`** – Next.js application source code
- **`/docs/`** – Project and data pipeline documentation
- **`/database/`** – SQL schema (`supabase-schema.sql`) and migrations
- **`/data/`** – Data workspace
  - `raw/` (gitignored) large imported or debug artifacts
  - `derived/` (gitignored) normalized/intermediate artifacts
  - `examples/` small sampled JSON files committed for reference/tests
- **`/scripts/`** – Organized automation & utilities
  - `maintenance/` recurring hygiene & enrichment tasks
  - `audit/` validation / diagnostic scripts (was test-* helpers)
  - `legacy/` historical one‑off scripts retained for reference
- **`/supabase/`** – Supabase generated types / edge functions
- **`/public/`** – Static assets

Legacy ad-hoc root scripts and large JSON artifacts have been relocated into the structure above for clarity.

## Features

### 🏠 **Home Dashboard**
- Quick overview of your collection statistics
- Easy access to all main features
- Getting started guide for new users

### 🏆 **Awards System**
- Create yearly awards with custom categories
- Drag-and-drop nomination and winner selection
- Track your "Best Of" games by year
- Default categories: Best Game, Best Strategy, Best Party Game, etc.

### 📊 **Rankings & Ratings**
- Rate games from 1-10 with color-coded system
- Track "Played It" status for your collection
- Personal ranking leaderboard
- Detailed rating statistics and insights

### 🎲 **Games Collection**
- Grid and list view modes
- Advanced filtering and search
- Hover actions for quick rating and status updates
- Detailed game information with BGG integration

### 📝 **Custom Lists**
- Create unlimited custom lists (e.g., "Top 10 Party Games")
- Reorder games with drag-and-drop
- Add personal notes and custom organization
- Share lists with friends

### 👤 **Profile Management**
- Personal gaming statistics
- Customizable preferences
- Privacy controls
- Collection insights

## Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript
- **Styling**: Tailwind CSS v3.4 with custom design system
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth
- **Animations**: GSAP
- **Drag & Drop**: @dnd-kit
- **Icons**: Heroicons
- **Code Quality**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd MeepleGo

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# BGG API (optional, for game data import)
BGG_API_BASE_URL=https://boardgamegeek.com/xmlapi2
```

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the contents of `supabase-schema.sql` to create the database schema
4. The schema includes:
   - Tables: games, profiles, rankings, lists, list_items, awards
   - Row Level Security policies
   - Sample data for development
   - Proper indexes for performance

### 4. Development

```bash
# Start the development server
npm run dev

# Open http://localhost:3000 in your browser
```

### 5. Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run type-check
```

## Project Structure (Key Directories)

```
src/
  app/            # App Router routes & layouts
  components/     # Reusable UI components
  lib/            # Clients & singletons (e.g. Supabase)
  types/          # Shared TypeScript types
  utils/          # Pure utilities & helpers
scripts/
  maintenance/    # Current hygiene & enrichment scripts
  audit/          # Data validation / diagnostic scripts
  legacy/         # Historical one-offs (not for active use)
data/
  raw/            # Large imports (ignored)
  derived/        # Intermediate outputs (ignored)
  examples/       # Small committed samples
database/
  supabase-schema.sql  # Canonical schema
  migrations/          # (If present) migration files
docs/                 # Additional project & pipeline docs
```

## Database Schema

### Tables

- **games**: Master list of all board games
- **profiles**: User profiles and preferences  
- **rankings**: User ratings and played status for games
- **lists**: User-created custom lists
- **list_items**: Games within lists with notes and ordering
- **awards**: Yearly awards with nominations and winners

### Key Features

- Row Level Security (RLS) for data privacy
- Automatic timestamp updates
- Optimized indexes for performance
- Sample data included for development

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Roadmap

- [ ] BoardGameGeek API integration for game data
- [ ] Advanced search and filtering
- [ ] Drag-and-drop for awards and lists
- [ ] Social features (friends, sharing)
- [ ] Mobile app (React Native)
- [ ] Statistics and analytics dashboard
- [ ] Import/export functionality
- [ ] Game recommendations
- [ ] Collection value tracking

## License

MIT License - see LICENSE file for details.

## Support

For questions and support, please open an issue on GitHub.

---

Built with ❤️ by Greg Robleto
