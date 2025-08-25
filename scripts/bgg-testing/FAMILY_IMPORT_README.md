# BGG Family Data Import

This directory contains scripts to import family data from BoardGameGeek for all games in your database.

## What are BGG Families?

BGG families group games by various characteristics like:
- **Game Series**: "Game: Catan", "Game: Gloomhaven"
- **Components**: "Components: Miniatures", "Components: Dice"
- **Mechanisms**: "Mechanism: Worker Placement", "Mechanism: Deck Building"
- **Themes**: "Theme: Medieval", "Theme: Space Exploration"
- **Categories**: "Category: Strategy Games", "Category: Party Games"
- **Digital Platforms**: "Digital Implementations: Steam", "Digital Implementations: Board Game Arena"

## Scripts Overview

### 1. Database Migration
```bash
# Option A: Run migration script
node scripts/database/apply-families-migration.js

# Option B: Manual SQL (in Supabase dashboard)
# Copy and run scripts/database/add-families-column.sql
```

### 2. Test Family Data Structure
```bash
node scripts/bgg-testing/test-family-data.js
```

### 3. Import Family Data
```bash
node scripts/bgg-testing/import-family-data.js
```

### 4. Verify Import Results
```bash
node scripts/bgg-testing/test-family-import.js
```

## Import Features

### ✅ Comprehensive Error Handling
- **Rate limiting**: Respects BGG API limits with exponential backoff
- **Retry logic**: Automatically retries failed requests up to 5 times
- **Timeout protection**: 30-second timeout per request
- **Progress saving**: Can resume from interruptions

### ✅ Efficient Processing
- **Batch processing**: Processes 20 games per API request (BGG maximum)
- **Database batching**: Updates database in efficient batches
- **Smart filtering**: Can skip games that already have family data
- **Progress tracking**: Real-time progress display and ETA

### ✅ Data Quality
- **Validation**: Ensures data integrity before database updates
- **Detailed logging**: Comprehensive logs of all operations
- **Failure tracking**: Saves failed games to separate file for analysis
- **Statistics**: Detailed import statistics and coverage metrics

## Usage Instructions

### Step 1: Environment Setup
Ensure your environment variables are set:
```bash
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### Step 2: Database Migration
Add the families column to your games table:
```bash
cd /path/to/MeepleGo
node scripts/database/apply-families-migration.js
```

### Step 3: Run Import
Start the family data import:
```bash
node scripts/bgg-testing/import-family-data.js
```

The script will:
1. Check your database schema
2. Count total games to process
3. Ask if you want to skip games with existing family data
4. Ask if you want to resume from previous progress
5. Process games in batches with progress reporting

### Step 4: Monitor Progress
The script displays real-time progress:
```
📊 Progress Report:
   Total Games: 5000
   Processed: 1250 (25.0%)
   Successful: 1240
   Failed: 10
   Families Found: 15680
   API Requests: 63
   Time Elapsed: 420s
   Est. Remaining: 1260s
   Rate: 2.98 games/sec
```

### Step 5: Handle Interruptions
If interrupted (Ctrl+C), the script:
- Saves current progress
- Can be resumed later from the same point
- Shows graceful shutdown message

### Step 6: Verify Results
After completion, verify the import:
```bash
node scripts/bgg-testing/test-family-import.js
```

## Performance Estimates

For a database with **5,000 games**:
- **Time**: ~45-60 minutes
- **API Requests**: ~250 requests
- **Rate**: ~2-3 games per second
- **Expected Families**: ~20,000-30,000 family connections

The BGG API allows ~20 requests per minute, so the script automatically throttles to respect this limit.

## Troubleshooting

### Common Issues

1. **Missing environment variables**
   ```
   ❌ Missing Supabase environment variables
   ```
   **Solution**: Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Database schema not updated**
   ```
   ❌ The "families" column does not exist
   ```
   **Solution**: Run the database migration first

3. **BGG API rate limiting**
   ```
   ❌ HTTP 429: Too Many Requests
   ```
   **Solution**: Script automatically handles this with exponential backoff

4. **Network timeouts**
   ```
   ❌ API request failed: timeout
   ```
   **Solution**: Script automatically retries failed requests

### Recovery Options

- **Resume interrupted import**: Run the script again, it will offer to resume
- **Retry failed games**: Check `family-import-failures.json` for failed games
- **Manual verification**: Use the test script to check data quality
- **Incremental updates**: Run periodically for new games

## Data Structure

The families are stored as JSONB in the database:
```json
[
  {"id": 59218, "name": "Category: Dungeon Crawler"},
  {"id": 25158, "name": "Components: Miniatures"},
  {"id": 45610, "name": "Game: Gloomhaven"}
]
```

This allows for efficient queries:
```sql
-- Find all games in the Catan family
SELECT * FROM games 
WHERE families @> '[{"name": "Game: Catan"}]';

-- Find games with miniatures
SELECT * FROM games 
WHERE families @> '[{"name": "Components: Miniatures"}]';
```
