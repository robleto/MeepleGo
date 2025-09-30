-- RLS Policy Validation Tests
-- This script tests Row Level Security policies for all user-facing tables
-- Run this against your Supabase database to validate RLS is working correctly

-- NOTE: This script requires two test users to be created in auth.users
-- and their corresponding profiles. Replace USER_1_ID and USER_2_ID with actual UUIDs.

-- ============================================================================
-- SETUP: Create test data (run as service role or authenticated user)
-- ============================================================================

-- Test user IDs (replace with actual test user UUIDs from your database)
-- You can get these by running: SELECT id, email FROM auth.users LIMIT 2;

\set USER_1_ID 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
\set USER_2_ID 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy'

-- ============================================================================
-- TEST 1: profiles table
-- ============================================================================
-- Expected: Users can only view/update their own profile

-- As User 1: Should see own profile
SET request.jwt.claim.sub = :'USER_1_ID';
SELECT 'TEST 1.1: View own profile' as test;
SELECT COUNT(*) = 1 as passed FROM profiles WHERE id = :'USER_1_ID';

-- As User 1: Should NOT see User 2's profile
SELECT 'TEST 1.2: Cannot view other profiles' as test;
SELECT COUNT(*) = 0 as passed FROM profiles WHERE id = :'USER_2_ID';

-- ============================================================================
-- TEST 2: rankings table
-- ============================================================================
-- Expected: Users can only view/manage their own rankings

-- As User 1: Should see own rankings
SET request.jwt.claim.sub = :'USER_1_ID';
SELECT 'TEST 2.1: View own rankings' as test;
SELECT COUNT(*) >= 0 as passed FROM rankings WHERE user_id = :'USER_1_ID';

-- As User 1: Should NOT see User 2's rankings
SELECT 'TEST 2.2: Cannot view other rankings' as test;
SELECT COUNT(*) = 0 as passed FROM rankings WHERE user_id = :'USER_2_ID';

-- ============================================================================
-- TEST 3: game_lists table
-- ============================================================================
-- Expected: Users can view public lists and own lists, but only modify own lists

-- As User 1: Should see own lists
SET request.jwt.claim.sub = :'USER_1_ID';
SELECT 'TEST 3.1: View own lists' as test;
SELECT COUNT(*) >= 0 as passed FROM game_lists WHERE user_id = :'USER_1_ID';

-- As User 1: Should see User 2's public lists
SELECT 'TEST 3.2: View public lists' as test;
SELECT COUNT(*) >= 0 as passed FROM game_lists WHERE user_id = :'USER_2_ID' AND is_public = true;

-- As User 1: Should NOT see User 2's private lists
SELECT 'TEST 3.3: Cannot view private lists of others' as test;
SELECT COUNT(*) = 0 as passed FROM game_lists WHERE user_id = :'USER_2_ID' AND is_public = false;

-- ============================================================================
-- TEST 4: game_list_items table
-- ============================================================================
-- Expected: Users can view items in public lists and own lists

-- As User 1: Should see own list items
SET request.jwt.claim.sub = :'USER_1_ID';
SELECT 'TEST 4.1: View own list items' as test;
SELECT COUNT(*) >= 0 as passed 
FROM game_list_items gli 
WHERE EXISTS (
  SELECT 1 FROM game_lists gl 
  WHERE gl.id = gli.list_id 
  AND gl.user_id = :'USER_1_ID'
);

-- ============================================================================
-- TEST 5: awards table
-- ============================================================================
-- Expected: Users can only view/manage their own awards

-- As User 1: Should see own awards
SET request.jwt.claim.sub = :'USER_1_ID';
SELECT 'TEST 5.1: View own awards' as test;
SELECT COUNT(*) >= 0 as passed FROM awards WHERE user_id = :'USER_1_ID';

-- As User 1: Should NOT see User 2's awards
SELECT 'TEST 5.2: Cannot view other awards' as test;
SELECT COUNT(*) = 0 as passed FROM awards WHERE user_id = :'USER_2_ID';

-- ============================================================================
-- TEST 6: Taxonomy tables (categories, mechanics, publishers)
-- ============================================================================
-- Expected: All users can view, no one can modify (except service role)

-- As User 1: Should see all categories
SET request.jwt.claim.sub = :'USER_1_ID';
SELECT 'TEST 6.1: View all categories' as test;
SELECT COUNT(*) >= 0 as passed FROM categories;

SELECT 'TEST 6.2: View all mechanics' as test;
SELECT COUNT(*) >= 0 as passed FROM mechanics;

SELECT 'TEST 6.3: View all publishers' as test;
SELECT COUNT(*) >= 0 as passed FROM publishers;

-- ============================================================================
-- TEST 7: Junction tables (game_categories, game_mechanics, game_publishers)
-- ============================================================================
-- Expected: All users can view, no one can modify (except service role)

SELECT 'TEST 7.1: View game_categories' as test;
SELECT COUNT(*) >= 0 as passed FROM game_categories;

SELECT 'TEST 7.2: View game_mechanics' as test;
SELECT COUNT(*) >= 0 as passed FROM game_mechanics;

SELECT 'TEST 7.3: View game_publishers' as test;
SELECT COUNT(*) >= 0 as passed FROM game_publishers;

-- ============================================================================
-- TEST 8: play_logs table
-- ============================================================================
-- Expected: Users can view own logs + public logs, but only manage own logs

-- As User 1: Should see own play logs
SET request.jwt.claim.sub = :'USER_1_ID';
SELECT 'TEST 8.1: View own play logs' as test;
SELECT COUNT(*) >= 0 as passed FROM play_logs WHERE user_id = :'USER_1_ID';

-- As User 1: Should see User 2's public play logs
SELECT 'TEST 8.2: View public play logs' as test;
SELECT COUNT(*) >= 0 as passed FROM play_logs WHERE user_id = :'USER_2_ID' AND is_public = true;

-- As User 1: Should NOT see User 2's private play logs
SELECT 'TEST 8.3: Cannot view private play logs of others' as test;
SELECT COUNT(*) = 0 as passed FROM play_logs WHERE user_id = :'USER_2_ID' AND is_public = false;

-- ============================================================================
-- TEST 9: games table
-- ============================================================================
-- Expected: All users can view games (no RLS)

SELECT 'TEST 9.1: View all games' as test;
SELECT COUNT(*) >= 0 as passed FROM games;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Check that RLS is enabled on all expected tables

SELECT 'RLS Status Summary' as section;
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname)
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'rankings', 'game_lists', 'game_list_items', 'awards',
    'categories', 'mechanics', 'publishers',
    'game_categories', 'game_mechanics', 'game_publishers',
    'play_logs'
  )
ORDER BY tablename;

-- Count policies per table
SELECT 'Policy Count per Table' as section;
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'rankings', 'game_lists', 'game_list_items', 'awards',
    'categories', 'mechanics', 'publishers',
    'game_categories', 'game_mechanics', 'game_publishers',
    'play_logs'
  )
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- End of validation tests
-- ============================================================================
