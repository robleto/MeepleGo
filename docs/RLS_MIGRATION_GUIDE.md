# RLS Migration Application Guide

This guide walks you through applying the RLS validation migrations to your Supabase database.

## Overview

Two migrations need to be applied:
1. **20250901000000_create_play_logs.sql** - Creates the play_logs table with RLS policies
2. **20250902000000_cleanup_duplicate_rls_policies.sql** - Removes duplicate/conflicting policies

## Prerequisites

- [ ] Supabase project access with database admin privileges
- [ ] Database backup created
- [ ] Test environment available (recommended)
- [ ] Access to Supabase dashboard or CLI

## Pre-Migration Checklist

### 1. Create Database Backup
```sql
-- Via Supabase Dashboard:
-- Settings > Database > Backups > Create Backup

-- Or document current state:
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

### 2. Verify Current State
```sql
-- Check if play_logs table already exists
SELECT EXISTS (
  SELECT 1 FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'play_logs'
) as play_logs_exists;

-- Check existing RLS policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('game_lists', 'game_list_items', 'rankings')
ORDER BY tablename, cmd;
```

### 3. Check for Active Sessions
```sql
-- See if any users are currently connected
SELECT COUNT(*) as active_connections 
FROM pg_stat_activity 
WHERE datname = current_database()
  AND state = 'active'
  AND usename != 'postgres';
```

## Migration Steps

### Method 1: Via Supabase Dashboard (Recommended)

1. **Navigate to SQL Editor**
   - Open your Supabase project dashboard
   - Go to "SQL Editor" in the left sidebar

2. **Apply Migration 1: Create play_logs**
   - Click "New Query"
   - Copy contents of `supabase/migrations/20250901000000_create_play_logs.sql`
   - Paste into editor
   - Click "Run"
   - Wait for "Success" message

3. **Verify Migration 1**
   ```sql
   -- Should return true
   SELECT EXISTS (
     SELECT 1 FROM pg_tables 
     WHERE schemaname = 'public' AND tablename = 'play_logs'
   ) as table_exists;
   
   -- Should return 4 (SELECT, INSERT, UPDATE, DELETE policies)
   SELECT COUNT(*) as policy_count
   FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'play_logs';
   ```

4. **Apply Migration 2: Cleanup Policies**
   - Click "New Query"
   - Copy contents of `supabase/migrations/20250902000000_cleanup_duplicate_rls_policies.sql`
   - Paste into editor
   - Click "Run"
   - Wait for "Success" message

5. **Verify Migration 2**
   ```sql
   -- Should NOT contain "Select own lists" or "Select items in own lists"
   SELECT tablename, policyname
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN ('game_lists', 'game_list_items', 'rankings')
   ORDER BY tablename, policyname;
   ```

### Method 2: Via Supabase CLI

```bash
# Ensure you're in the project directory
cd /path/to/MeepleGo

# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push

# Verify
supabase db diff
```

### Method 3: Via psql (Advanced)

```bash
# Connect to your database
psql "postgresql://postgres:[password]@[host]:[port]/postgres"

# Apply migrations
\i supabase/migrations/20250901000000_create_play_logs.sql
\i supabase/migrations/20250902000000_cleanup_duplicate_rls_policies.sql

# Verify
\dt play_logs
\dp play_logs
```

## Post-Migration Validation

### 1. Run Validation Tests

Copy and run queries from `docs/RLS_VALIDATION_TESTS.sql` in your SQL editor.

Key tests to verify:

```sql
-- 1. Verify play_logs table exists with RLS enabled
SELECT 
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname = 'play_logs';

-- 2. Verify play_logs has all 4 policies
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'play_logs'
ORDER BY cmd;

-- Expected output:
-- policyname                              | cmd
-- ----------------------------------------|--------
-- Users can delete own play logs          | DELETE
-- Users can insert own play logs          | INSERT
-- Users can view own and public play logs | SELECT
-- Users can update own play logs          | UPDATE

-- 3. Verify duplicate policies are removed
SELECT COUNT(*) as should_be_zero
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN (
    'Select own lists',
    'Select items in own lists',
    'Select own rankings',
    'Upsert own rankings'
  );
```

### 2. Test with User Accounts

Create a test play log entry via your API:

```bash
# Test POST /api/play-logs
curl -X POST https://your-project.supabase.co/rest/v1/play_logs \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": "some-game-uuid",
    "played_at": "2024-09-30T10:00:00Z",
    "is_public": true,
    "notes": "Test play log"
  }'

# Test GET /api/play-logs
curl https://your-project.supabase.co/rest/v1/play_logs \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

### 3. Monitor for Errors

Check your logs for RLS-related errors:

```sql
-- Via Supabase Dashboard:
-- Logs > Postgres Logs
-- Look for: "permission denied" or "policy violation"
```

## Rollback Procedure

If you need to rollback:

### Rollback Migration 2 (Policy Cleanup)

```sql
-- Recreate the dropped policies if needed
-- (Not recommended as they were duplicates/conflicting)

-- game_lists
CREATE POLICY "Select own lists" ON public.game_lists
  FOR SELECT USING ( auth.uid() = user_id );

-- game_list_items
CREATE POLICY "Select items in own lists" ON public.game_list_items
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM public.game_lists gl WHERE gl.id = list_id)
  );

-- rankings
CREATE POLICY "Select own rankings" ON public.rankings
  FOR SELECT USING ( auth.uid() = user_id );

CREATE POLICY "Upsert own rankings" ON public.rankings
  FOR INSERT WITH CHECK ( auth.uid() = user_id );
```

### Rollback Migration 1 (play_logs Creation)

```sql
-- ⚠️ WARNING: This will delete all play log data!

-- Drop the table (cascades to policies)
DROP TABLE IF EXISTS public.play_logs CASCADE;
```

## Troubleshooting

### Issue: "permission denied for table play_logs"

**Solution:** Verify RLS policies are active
```sql
SELECT * FROM pg_policies WHERE tablename = 'play_logs';
```

### Issue: "table play_logs already exists"

**Solution:** Migration is idempotent, safe to run again. Or the table was created manually.
```sql
-- Check if table has RLS enabled
SELECT relrowsecurity FROM pg_class WHERE relname = 'play_logs';
```

### Issue: "policy already exists"

**Solution:** Migrations use `IF NOT EXISTS` checks, this is expected and safe to ignore.

### Issue: API returns 403 Forbidden

**Causes:**
1. RLS policy is too restrictive
2. User token is invalid
3. User ID doesn't match policy expectations

**Debug:**
```sql
-- Test policy as specific user
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM play_logs;
```

## Success Criteria

Migration is successful when:
- [x] play_logs table exists
- [x] play_logs has 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)
- [x] RLS is enabled on play_logs
- [x] Duplicate policies removed from game_lists, game_list_items, rankings
- [x] All validation tests pass
- [x] API endpoints work correctly
- [x] No permission errors in logs

## Support

If you encounter issues:
1. Check this troubleshooting section
2. Review `docs/RLS_VALIDATION_REPORT.md`
3. Test with `docs/RLS_VALIDATION_TESTS.sql`
4. Check Supabase logs for detailed error messages
5. Open a GitHub issue with error details

---

**Migration Author:** GitHub Copilot  
**Date:** 2024-09-30  
**Version:** 1.0  
**Status:** Ready for Production
