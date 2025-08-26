# 🎯 MeepleGo Database Setup Instructions

## ✅ Current Status:

- ✅ Supabase project linked: `dsqceuerzoeotrcatxvb`
- ✅ Edge function deployed: `populate-games`
- ⏳ Database schema needs to be applied

## 🚀 Quick Setup Steps:

### Step 1: Apply Database Schema

1. Go to: https://supabase.com/dashboard/project/dsqceuerzoeotrcatxvb/sql
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql` and paste it
4. Click "Run" to execute the schema

### Step 2: Test the Setup

After applying the schema, run:

```bash
node test-bgg-import.js
```

### Step 3: Import Games (Optional)

To import a small sample of games:

```bash
# This will import ~100 games for testing
curl -X POST "https://dsqceuerzoeotrcatxvb.supabase.co/functions/v1/populate-games?start_id=1&max_games=100" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

To import the full BGG top games (will take a while):

```bash
# This will import ~10,000 games (takes ~30 minutes)
curl -X POST "https://dsqceuerzoeotrcatxvb.supabase.co/functions/v1/populate-games?start_id=1&max_games=10000" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 📋 Database Tables Created:

- `games` - Board game information from BGG
- `profiles` - User profiles
- `rankings` - User ratings and played status
- `game_lists` - Custom user lists
- `game_list_items` - Games in lists
- `awards` - Yearly user awards

## 🔧 Edge Functions:

- `populate-games` - Imports games from BoardGameGeek API

## 🌐 Useful Links:

- **Supabase Dashboard**: https://supabase.com/dashboard/project/dsqceuerzoeotrcatxvb
- **SQL Editor**: https://supabase.com/dashboard/project/dsqceuerzoeotrcatxvb/sql
- **Functions**: https://supabase.com/dashboard/project/dsqceuerzoeotrcatxvb/functions
- **Database**: https://supabase.com/dashboard/project/dsqceuerzoeotrcatxvb/database/tables

## 🆘 Troubleshooting:

- If tables don't exist: Run the schema SQL in the Supabase SQL Editor
- If function fails: Check the function logs in the Supabase dashboard
- If import is slow: BGG API has rate limits, this is normal

## 🎉 Next Steps:

Once the database is set up, you can:

1. Add authentication to your app
2. Connect real data instead of mock data
3. Test the full import process
4. Start using the app with real BGG game data!
