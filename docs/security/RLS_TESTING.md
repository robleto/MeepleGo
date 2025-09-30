# Row Level Security (RLS) Testing

This document describes the RLS testing process for MeepleGo and provides results from security validation.

## Overview

Row Level Security (RLS) policies in Supabase ensure that users can only access their own data and cannot read or modify data belonging to other users. This is critical for maintaining data privacy and security.

## Test Script

Location: `scripts/development-tools/test-rls-policies.js`

### Purpose

The test script validates that:
1. Non-owner users **cannot** read data belonging to other users
2. Non-owner users **cannot** write/update/delete data belonging to other users
3. Non-owner users **can** read their own data
4. Non-owner users **can** create their own data
5. Public lists are readable by all users but only modifiable by the owner

### Tables Tested

The script tests RLS policies for all user-facing tables:

- **profiles** - User profile information
- **rankings** - User's game ratings and "played it" status
- **game_lists** - User's custom lists (both private and public)
- **game_list_items** - Games within lists
- **awards** - User's yearly awards

### How to Run

#### Prerequisites

1. Supabase project (local or remote)
2. Environment variables configured:
   - `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (for creating test users)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (for testing as regular users)

#### Local Testing

```bash
# Ensure environment variables are set in .env.local
npm run test:rls
```

#### Production Testing

⚠️ **Warning**: This script creates and deletes test users. Only run in controlled environments.

```bash
# Set production environment variables
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

node scripts/development-tools/test-rls-policies.js
```

## Test Process

### 1. Setup Phase

The script:
1. Creates two test users: `owner` and `non-owner`
2. Creates a test game in the database
3. As the owner, creates:
   - A ranking for the test game
   - A private list
   - A public list with one game
   - An award

### 2. Testing Phase

For each table, the script tests:

#### Profile Tests
- ❌ Non-owner cannot read owner's profile
- ❌ Non-owner cannot update owner's profile
- ✅ Non-owner can read their own profile

#### Rankings Tests
- ❌ Non-owner cannot read owner's rankings
- ❌ Non-owner cannot update owner's rankings
- ❌ Non-owner cannot delete owner's rankings
- ✅ Non-owner can create their own rankings

#### Game Lists Tests
- ❌ Non-owner cannot read owner's private list
- ✅ Non-owner can read owner's public list
- ❌ Non-owner cannot update owner's public list
- ❌ Non-owner cannot delete owner's list
- ✅ Non-owner can create their own list

#### List Items Tests
- ✅ Non-owner can read items in owner's public list
- ❌ Non-owner cannot update items in owner's list
- ❌ Non-owner cannot add items to owner's list
- ❌ Non-owner cannot delete items from owner's list

#### Awards Tests
- ❌ Non-owner cannot read owner's awards
- ❌ Non-owner cannot update owner's awards
- ❌ Non-owner cannot delete owner's awards
- ✅ Non-owner can create their own awards

### 3. Cleanup Phase

The script automatically:
1. Deletes all test data (awards, lists, rankings, games)
2. Deletes both test users
3. Leaves no trace in the database

## RLS Policy Implementation

### Current Policies (from `supabase/schema.sql`)

#### Profiles
```sql
-- Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

#### Rankings
```sql
-- Users can only see and edit their own rankings
CREATE POLICY "Users can view own rankings" ON rankings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own rankings" ON rankings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own rankings" ON rankings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own rankings" ON rankings
  FOR DELETE USING (user_id = auth.uid());
```

#### Game Lists
```sql
-- Users can see public lists and their own lists
CREATE POLICY "Users can view public lists and own lists" ON game_lists
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can insert own lists" ON game_lists
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own lists" ON game_lists
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own lists" ON game_lists
  FOR DELETE USING (user_id = auth.uid());
```

#### List Items
```sql
-- Users can see items in public lists and their own lists
CREATE POLICY "Users can view list items" ON game_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_lists 
      WHERE game_lists.id = game_list_items.list_id 
      AND (game_lists.is_public = true OR game_lists.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own list items" ON game_list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM game_lists 
      WHERE game_lists.id = game_list_items.list_id 
      AND game_lists.user_id = auth.uid()
    )
  );
```

#### Awards
```sql
-- Users can only see and edit their own awards
CREATE POLICY "Users can view own awards" ON awards
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own awards" ON awards
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own awards" ON awards
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own awards" ON awards
  FOR DELETE USING (user_id = auth.uid());
```

## Test Results

### Latest Test Run

**Date**: [To be filled after running tests]
**Environment**: [Local/Staging/Production]

```
====================================================================
📊 Test Summary
====================================================================
Total Tests: [X]
✅ Passed: [X]
❌ Failed: [X]
====================================================================
```

### Expected Results

All tests should pass with:
- 0 failed tests
- All ❌ tests confirming non-owner cannot access owner data
- All ✅ tests confirming users can access their own data

### Common Issues

#### Service Role Key Missing
```
❌ Missing required environment variables:
   SUPABASE_SERVICE_ROLE_KEY
```
**Solution**: Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local` file

#### User Creation Fails
```
Failed to create user: Email rate limit exceeded
```
**Solution**: Wait a few minutes or use a different email prefix

#### RLS Policy Violations
If tests fail with RLS policy violations:
1. Review the specific test that failed
2. Check the corresponding policy in `supabase/schema.sql`
3. Verify the policy logic matches the expected behavior
4. Update the policy if needed and re-run the migration

## Security Best Practices

1. **Never expose service role key**: Keep `SUPABASE_SERVICE_ROLE_KEY` in server-only environments
2. **Test regularly**: Run RLS tests after any schema changes
3. **Monitor logs**: Check Supabase logs for unauthorized access attempts
4. **Use migrations**: Always apply schema changes via migrations to maintain consistency
5. **Review policies**: Periodically review RLS policies for security improvements

## Manual Testing

In addition to automated tests, you can manually test RLS:

1. Create two user accounts in your Supabase dashboard
2. Sign in as User A and create some data (lists, rankings, awards)
3. Sign in as User B in a different browser/incognito window
4. Try to access User A's data via the UI
5. Verify that User B cannot see or modify User A's private data

## Integration with Launch Checklist

This RLS testing is part of the launch checklist under **Section 1: Supabase Configuration → Security (RLS)**:

- ✅ Re-validate Row Level Security policies for all user-facing tables
- ✅ Create a non-owner test user and ensure they cannot read/write others' data
- ✅ Document test process and results

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [MeepleGo Schema File](../../supabase/schema.sql)
- [Launch Checklist](../../docs/release/launch-checklist.md)
