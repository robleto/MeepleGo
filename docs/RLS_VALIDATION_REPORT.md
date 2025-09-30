# Row Level Security (RLS) Validation Report

**Date:** 2024-09-30
**Purpose:** Re-validation of all Row Level Security policies for user-facing tables

## Executive Summary

This report documents the validation of RLS policies across all user-facing tables in the MeepleGo database. The validation identified one critical issue: the `play_logs` table is missing RLS policies entirely.

## Tables with RLS Enabled

### 1. profiles
**Location:** `supabase/schema.sql` (lines 173-187)
**RLS Status:** ✅ ENABLED

**Policies:**
- ✅ `Users can view own profile` (SELECT) - USING (auth.uid() = id)
- ✅ `Users can update own profile` (UPDATE) - USING (auth.uid() = id)
- ✅ `Users can insert own profile` (INSERT) - WITH CHECK (auth.uid() = id)

**Validation:** PASSED
- Users can only access their own profile data
- No policy bypass identified
- Properly uses auth.uid() to match profile id
- Missing DELETE policy is intentional (handled by cascade from auth.users)

---

### 2. rankings
**Location:** `supabase/schema.sql` (lines 174, 189-200) + `supabase/migrations/20250809183000_lists_rls_policies.sql`
**RLS Status:** ✅ ENABLED

**Policies from schema.sql:**
- ✅ `Users can view own rankings` (SELECT) - USING (user_id = auth.uid())
- ✅ `Users can insert own rankings` (INSERT) - WITH CHECK (user_id = auth.uid())
- ✅ `Users can update own rankings` (UPDATE) - USING (user_id = auth.uid())
- ✅ `Users can delete own rankings` (DELETE) - USING (user_id = auth.uid())

**Additional Policies from migration (20250809183000):**
- ✅ `Select own rankings` (SELECT) - USING (auth.uid() = user_id)
- ✅ `Upsert own rankings` (INSERT) - WITH CHECK (auth.uid() = user_id)
- ✅ `Update own rankings` (UPDATE) - USING & WITH CHECK (auth.uid() = user_id)

**Validation:** PASSED with NOTE
- Users can only access their own rankings
- No policy bypass identified
- **NOTE:** Duplicate policies exist between schema.sql and migration file - this is redundant but not harmful

---

### 3. game_lists
**Location:** `supabase/schema.sql` (lines 175, 202-213) + `supabase/migrations/20250809183000_lists_rls_policies.sql`
**RLS Status:** ✅ ENABLED

**Policies from schema.sql:**
- ✅ `Users can view public lists and own lists` (SELECT) - USING (is_public = true OR user_id = auth.uid())
- ✅ `Users can insert own lists` (INSERT) - WITH CHECK (user_id = auth.uid())
- ✅ `Users can update own lists` (UPDATE) - USING (user_id = auth.uid())
- ✅ `Users can delete own lists` (DELETE) - USING (user_id = auth.uid())

**Additional Policies from migration (20250809183000):**
- ✅ `Select own lists` (SELECT) - USING (auth.uid() = user_id)
- ✅ `Insert own lists` (INSERT) - WITH CHECK (auth.uid() = user_id)
- ✅ `Update own lists` (UPDATE) - USING & WITH CHECK (auth.uid() = user_id)
- ✅ `Delete own lists` (DELETE) - USING (auth.uid() = user_id)

**Validation:** PASSED with NOTE
- Users can view public lists from all users
- Users can only modify their own lists
- No policy bypass identified
- **NOTE:** Conflict between schema.sql SELECT policy (allows public lists) and migration SELECT policy (own only). Migration policy is more restrictive and will be applied if both exist. The schema.sql version is the desired behavior for viewing public lists.

**RECOMMENDATION:** The migration policy "Select own lists" should be dropped or modified to match schema.sql's public viewing capability.

---

### 4. game_list_items
**Location:** `supabase/schema.sql` (lines 176, 215-232) + `supabase/migrations/20250809183000_lists_rls_policies.sql`
**RLS Status:** ✅ ENABLED

**Policies from schema.sql:**
- ✅ `Users can view list items` (SELECT) - Uses EXISTS to check parent list is public or owned
- ✅ `Users can manage own list items` (ALL) - Uses EXISTS to check parent list ownership

**Additional Policies from migration (20250809183000):**
- ✅ `Select items in own lists` (SELECT) - Subquery to check list ownership
- ✅ `Insert items in own lists` (INSERT) - Subquery to check list ownership
- ✅ `Delete items in own lists` (DELETE) - Subquery to check list ownership

**Validation:** PASSED with NOTE
- Users can view items in public lists and their own lists
- Users can only modify items in their own lists
- Properly uses EXISTS subquery for ownership check
- **NOTE:** Similar to game_lists, migration SELECT policy is more restrictive than schema.sql (doesn't allow viewing public list items). Schema.sql policy is preferred for public list viewing.

**RECOMMENDATION:** Migration policy should be dropped in favor of schema.sql policies.

---

### 5. awards
**Location:** `supabase/schema.sql` (lines 177, 234-245)
**RLS Status:** ✅ ENABLED

**Policies:**
- ✅ `Users can view own awards` (SELECT) - USING (user_id = auth.uid())
- ✅ `Users can insert own awards` (INSERT) - WITH CHECK (user_id = auth.uid())
- ✅ `Users can update own awards` (UPDATE) - USING (user_id = auth.uid())
- ✅ `Users can delete own awards` (DELETE) - USING (user_id = auth.uid())

**Validation:** PASSED
- Users can only access their own awards
- Complete CRUD coverage
- No policy bypass identified
- Monitoring endpoint exists at `/api/awards/schema-check`

---

### 6. categories (Taxonomy)
**Location:** `supabase/migrations/20250810100000_taxonomy_normalization.sql` (lines 128-140)
**RLS Status:** ✅ ENABLED

**Policies:**
- ✅ `Read categories` (SELECT) - USING (true) - Public read-only

**Validation:** PASSED
- Taxonomy data is read-only and publicly accessible
- No INSERT/UPDATE/DELETE policies (service role only)
- Appropriate for reference data

---

### 7. mechanics (Taxonomy)
**Location:** `supabase/migrations/20250810100000_taxonomy_normalization.sql` (lines 129-143)
**RLS Status:** ✅ ENABLED

**Policies:**
- ✅ `Read mechanics` (SELECT) - USING (true) - Public read-only

**Validation:** PASSED
- Taxonomy data is read-only and publicly accessible
- No INSERT/UPDATE/DELETE policies (service role only)
- Appropriate for reference data

---

### 8. publishers (Taxonomy)
**Location:** `supabase/migrations/20250810100000_taxonomy_normalization.sql` (lines 130-147)
**RLS Status:** ✅ ENABLED

**Policies:**
- ✅ `Read publishers` (SELECT) - USING (true) - Public read-only

**Validation:** PASSED
- Taxonomy data is read-only and publicly accessible
- No INSERT/UPDATE/DELETE policies (service role only)
- Appropriate for reference data

---

### 9. game_categories (Junction)
**Location:** `supabase/migrations/20250810100000_taxonomy_normalization.sql` (lines 132-151)
**RLS Status:** ✅ ENABLED

**Policies:**
- ✅ `Read game_categories` (SELECT) - USING (true) - Public read-only

**Validation:** PASSED
- Junction data is read-only and publicly accessible
- No INSERT/UPDATE/DELETE policies (service role only)
- Appropriate for reference data

---

### 10. game_mechanics (Junction)
**Location:** `supabase/migrations/20250810100000_taxonomy_normalization.sql` (lines 133-155)
**RLS Status:** ✅ ENABLED

**Policies:**
- ✅ `Read game_mechanics` (SELECT) - USING (true) - Public read-only

**Validation:** PASSED
- Junction data is read-only and publicly accessible
- No INSERT/UPDATE/DELETE policies (service role only)
- Appropriate for reference data

---

### 11. game_publishers (Junction)
**Location:** `supabase/migrations/20250810100000_taxonomy_normalization.sql` (lines 134-159)
**RLS Status:** ✅ ENABLED

**Policies:**
- ✅ `Read game_publishers` (SELECT) - USING (true) - Public read-only

**Validation:** PASSED
- Junction data is read-only and publicly accessible
- No INSERT/UPDATE/DELETE policies (service role only)
- Appropriate for reference data

---

### 12. play_logs ⚠️ CRITICAL ISSUE
**Location:** Table referenced in `src/types/supabase.ts` and `src/app/api/play-logs/route.ts`
**RLS Status:** ❌ **MISSING - TABLE DOES NOT HAVE RLS ENABLED**

**Expected Schema (from types):**
```typescript
{
  id: string
  user_id: string
  game_id: string
  played_at: string
  rating: number | null
  player_count: number | null
  duration_minutes: number | null
  location: string | null
  notes: string | null
  tags: string[] | null
  is_public: boolean
  created_at: string
  updated_at: string
}
```

**Current Policies:** NONE - This is a critical security issue

**Required Policies:**
1. SELECT: Users should see their own logs + public logs from others
2. INSERT: Users can only insert logs with their own user_id
3. UPDATE: Users can only update their own logs
4. DELETE: Users can only delete their own logs

**API Route Behavior (src/app/api/play-logs/route.ts):**
- GET: Attempts to filter by user_id and is_public (relies on RLS)
- POST: Sets user_id from auth (requires RLS validation)
- PATCH: Checks ownership before update (but RLS should be primary defense)
- DELETE: Deletes by id (relies on RLS for ownership check)

**Validation:** ❌ FAILED
- **CRITICAL:** Table exists in application but has no RLS protection
- Application code assumes RLS exists but it's missing
- Users could potentially access/modify other users' play logs without RLS
- Migration file referenced in README.md (20250901_create_play_logs.sql) is missing

---

### 13. games
**Location:** `supabase/schema.sql` (lines 22-49)
**RLS Status:** ✅ NOT ENABLED (intentional)

**Policies:** NONE (public read, service role write only)

**Validation:** PASSED
- Games table is intentionally public for all users to read
- Write operations restricted to service role via API routes
- Appropriate for reference/catalog data
- No RLS needed as per design (comment in schema.sql line 247-248)

---

## Summary of Findings

### Critical Issues
1. **play_logs table missing RLS entirely** - This is a security vulnerability

### Policy Conflicts (Non-critical)
2. **Duplicate policies** between schema.sql and migration files for:
   - rankings (duplicate but identical)
   - game_lists (conflict: schema allows public view, migration restricts to own only)
   - game_list_items (conflict: schema allows public list items view, migration restricts to own only)

### Recommendations

1. **IMMEDIATE ACTION REQUIRED:** Create migration to add RLS policies for play_logs table
2. **CLEANUP:** Resolve policy conflicts between schema.sql and migration files
3. **DOCUMENTATION:** Update schema.sql to document which policies are canonical
4. **TESTING:** Add automated tests to verify RLS policies work as expected

## Action Items

- [ ] Create migration file for play_logs RLS policies
- [ ] Apply play_logs RLS migration to database
- [ ] Test play_logs RLS policies thoroughly
- [ ] Resolve policy conflicts for game_lists (favor public viewing)
- [ ] Resolve policy conflicts for game_list_items (favor public viewing)
- [ ] Consider removing duplicate rankings policies from migration
- [ ] Document RLS policy management strategy (schema.sql vs migrations)
- [ ] Add RLS policy tests to CI/CD pipeline
