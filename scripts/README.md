# Scripts Directory

This directory contains all utility scripts for the MeepleGo project, organized by purpose.

## 📂 Directory Structure

### `/scripts/database/`
Database-related utilities and migrations:
- `add-game-columns.js` - Adds new columns to games table
- `add-summary-column.js` - Adds summary column specifically  
- `apply-schema.js` - Applies database schema
- `check-tables.js` - Checks database table status
- `debug-games.js` - Debug and inspect games in database
- `test-setup.js` - Tests database setup
- `*.sql` - SQL migration files

### `/scripts/bgg-testing/`
BoardGameGeek API testing and parsing:
- `test-edge-function-logic.js` - **ACTIVE** - Tests parsing logic with current schema
- `test-summary-extraction.js` - Tests summary extraction specifically
- `test-advanced-parsing.js` - Tests advanced parsing features
- `test-single-game.js` - Tests parsing a single game
- `test-hot-games.js` - Tests hot games API endpoint

### `/scripts/archive/`
Old/unused scripts kept for reference:
- `analyze-bgg-xml.js` - Early XML analysis
- `test-bgg-api.js` - Early API testing
- `test-bgg-import.js` - Old import testing
- `test-import-verbose.sh` - Old verbose import script

## 🚀 Active Scripts (Root Level)

- `run-bgg-import.sh` - **Main import script** - Triggers BGG hot games import

## 📋 Usage

### To test current parsing logic:
```bash
node scripts/bgg-testing/test-edge-function-logic.js
```

### To debug database:
```bash
node scripts/database/debug-games.js
```

### To run main import:
```bash
./run-bgg-import.sh
```

## 🧹 Organization Rules

- **Root level**: Only actively used production scripts
- **scripts/database/**: Database utilities and migrations
- **scripts/bgg-testing/**: BGG API testing and development
- **scripts/archive/**: Old scripts kept for reference only
