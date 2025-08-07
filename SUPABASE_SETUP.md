# Supabase Setup Guide

This guide will help you set up the MeepleGo database schema and import game data from BoardGameGeek.

## Prerequisites

1. A Supabase project created at [supabase.com](https://supabase.com)
2. Your Supabase URL and keys added to `.env.local`
3. Node.js and npm installed

## Step 1: Create Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy and paste the entire contents of `supabase/schema.sql`
5. Click **Run** to execute the schema

This will create:
- ✅ `profiles` table for user data
- ✅ `games` table for BoardGameGeek game data
- ✅ `rankings` table for user ratings and played status
- ✅ `game_lists` table for custom user lists
- ✅ `game_list_items` table for games within lists
- ✅ `awards` table for yearly awards
- ✅ Row Level Security policies
- ✅ Automatic triggers for timestamps
- ✅ Indexes for performance

## Step 2: Deploy Edge Function

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref dsqceuerzoeotrcatxvb
   ```

4. Deploy the edge function:
   ```bash
   supabase functions deploy populate-games
   ```

## Step 3: Test Your Setup

Run the test script to verify everything is working:

```bash
node test-setup.js
```

This will:
- ✅ Test Supabase connection
- ✅ Verify database schema
- ✅ Test BGG edge function connectivity
- ✅ Check BoardGameGeek API access

## Step 4: Import Games from BoardGameGeek

### Test Mode (Recommended First)

Test the BGG API connection:

```bash
curl -X GET "https://dsqceuerzoeotrcatxvb.supabase.co/functions/v1/populate-games?test=true" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

### Import Games

Import the top 1,000 games (recommended for testing):

```bash
curl -X GET "https://dsqceuerzoeotrcatxvb.supabase.co/functions/v1/populate-games?max_games=1000" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

Import more games (up to 10,000):

```bash
curl -X GET "https://dsqceuerzoeotrcatxvb.supabase.co/functions/v1/populate-games?max_games=10000" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

### Import Parameters

- `max_games`: Number of games to import (default: 10000)
- `start_id`: BGG ID to start from (default: 1)
- `test`: Set to `true` for test mode only

## Step 5: Monitor Import Progress

The edge function includes:
- ⏱️ **Rate limiting**: 2-second delays between batches
- 🔄 **Error recovery**: Retries on temporary failures
- 📊 **Progress logging**: Detailed console output
- 🛡️ **Duplicate handling**: Uses `upsert` to avoid duplicates

You can check the Supabase Functions logs to monitor progress:
1. Go to **Functions** in your Supabase dashboard
2. Click on `populate-games`
3. View the **Logs** tab

## Step 6: Verify Import

Check your games table:

```sql
SELECT COUNT(*) FROM games;
SELECT name, year_published, rating FROM games ORDER BY rating DESC LIMIT 10;
```

## Troubleshooting

### Schema Issues
- Make sure all foreign key constraints are satisfied
- Check that RLS policies are correctly applied
- Verify triggers are created successfully

### Edge Function Issues
- Ensure function is deployed: `supabase functions list`
- Check logs for errors: Supabase Dashboard > Functions > Logs
- Verify environment variables are set

### BGG API Issues
- The function includes rate limiting to respect BGG's API
- Some games might not have complete data
- Invalid BGG IDs will be skipped

### Import Performance
- The function processes games in batches of 100
- Expect ~2-5 minutes per 1,000 games
- Monitor Supabase database usage quotas

## Next Steps

After successful import:
1. ✅ Test the development server: `npm run dev`
2. ✅ Create a user account to test authentication
3. ✅ Rate some games to test the ranking system
4. ✅ Create lists and awards

## Database Maintenance

### Update Game Data

Re-run the import function to update existing games:
```bash
curl -X GET "https://dsqceuerzoeotrcatxvb.supabase.co/functions/v1/populate-games?max_games=1000" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

### Cleanup

To reset the games table:
```sql
TRUNCATE games CASCADE;
```

⚠️ **Warning**: This will also delete all rankings, lists, and awards!
