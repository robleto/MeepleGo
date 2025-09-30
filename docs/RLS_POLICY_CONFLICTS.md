# RLS Policy Conflicts and Recommendations

## Overview

During the RLS validation, we identified conflicts between policies defined in `supabase/schema.sql` and those in migration files. This document explains these conflicts and provides recommendations for resolution.

## Policy Conflicts

### 1. game_lists SELECT Policies

**Conflict:**
- **schema.sql** (line 203-204): Allows viewing public lists AND own lists
  ```sql
  CREATE POLICY "Users can view public lists and own lists" ON game_lists
    FOR SELECT USING (is_public = true OR user_id = auth.uid());
  ```

- **Migration 20250809183000** (line 13-14): Only allows viewing own lists
  ```sql
  CREATE POLICY "Select own lists" ON public.game_lists
    FOR SELECT USING ( auth.uid() = user_id );
  ```

**Impact:**
When both policies exist, PostgreSQL will evaluate them with OR logic. However, this creates confusion about the intended behavior.

**Recommendation:**
Keep the schema.sql policy as it provides better functionality (public list viewing). Drop the migration policy.

**Action:**
```sql
DROP POLICY IF EXISTS "Select own lists" ON public.game_lists;
```

---

### 2. game_list_items SELECT Policies

**Conflict:**
- **schema.sql** (line 216-223): Allows viewing items in public lists AND own lists
  ```sql
  CREATE POLICY "Users can view list items" ON game_list_items
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM game_lists 
        WHERE game_lists.id = game_list_items.list_id 
        AND (game_lists.is_public = true OR game_lists.user_id = auth.uid())
      )
    );
  ```

- **Migration 20250809183000** (line 42-44): Only allows viewing items in own lists
  ```sql
  CREATE POLICY "Select items in own lists" ON public.game_list_items
    FOR SELECT USING (
      auth.uid() = (SELECT user_id FROM public.game_lists gl WHERE gl.id = list_id)
    );
  ```

**Impact:**
Similar to game_lists, this creates ambiguity about whether public list items should be viewable.

**Recommendation:**
Keep the schema.sql policy as it enables the feature of viewing public lists with their items. Drop the migration policy.

**Action:**
```sql
DROP POLICY IF EXISTS "Select items in own lists" ON public.game_list_items;
```

---

### 3. rankings Duplicate Policies

**Issue:**
Multiple policies with similar functionality but different names:

- **schema.sql**: 4 policies (view, insert, update, delete own rankings)
- **Migration 20250809183000**: 3 policies (select, upsert, update own rankings)

**Impact:**
Functionally equivalent but creates maintenance confusion. The duplicate SELECT and UPDATE policies will both be evaluated.

**Recommendation:**
Keep schema.sql policies and drop migration policies to maintain consistency with other tables.

**Action:**
```sql
DROP POLICY IF EXISTS "Select own rankings" ON public.rankings;
DROP POLICY IF EXISTS "Upsert own rankings" ON public.rankings;
DROP POLICY IF EXISTS "Update own rankings" ON public.rankings;
-- Note: Keep the schema.sql policies which have different names
```

---

## Migration Strategy

### Option 1: Create a cleanup migration (Recommended)

Create a new migration file that drops the conflicting policies:

**File:** `supabase/migrations/20250902000000_cleanup_duplicate_rls_policies.sql`

```sql
-- Cleanup duplicate and conflicting RLS policies
-- Keeps schema.sql policies which are more feature-complete

-- Drop conflicting game_lists policy (migration one is too restrictive)
DROP POLICY IF EXISTS "Select own lists" ON public.game_lists;

-- Drop conflicting game_list_items policy (migration one is too restrictive)
DROP POLICY IF EXISTS "Select items in own lists" ON public.game_list_items;

-- Drop duplicate rankings policies (keep schema.sql ones)
DROP POLICY IF EXISTS "Select own rankings" ON public.rankings;
DROP POLICY IF EXISTS "Upsert own rankings" ON public.rankings;
-- Note: "Update own rankings" exists in both with same name, no action needed

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
```

### Option 2: Update schema.sql comments

Add comments to schema.sql explaining that migration policies should be considered deprecated:

```sql
-- NOTE: Migration 20250809183000 creates similar policies but some are more restrictive.
-- The policies below are the canonical definitions and should be preferred.
-- Consider running cleanup migration to remove duplicates.
```

### Option 3: Do nothing (Not recommended)

The duplicate policies will continue to work due to PostgreSQL's OR behavior, but this creates technical debt and confusion.

---

## Future Prevention

### Best Practices

1. **Single Source of Truth**: Decide whether schema.sql or migrations are the canonical source
2. **Idempotent Migrations**: Always use `IF NOT EXISTS` checks
3. **Policy Naming Convention**: Use consistent naming across all tables
4. **Documentation**: Comment each policy with its intended behavior
5. **Testing**: Include RLS tests in CI/CD pipeline

### Recommended Approach

Going forward:
1. Use schema.sql for initial table and policy creation
2. Use migrations only for changes/updates to existing policies
3. Document any policy changes in migration comments
4. Run validation tests after each migration

---

## Action Plan

1. ✅ Document conflicts (this file)
2. ⏳ Create cleanup migration
3. ⏳ Test migration on development database
4. ⏳ Apply migration to production
5. ⏳ Update documentation
6. ⏳ Add RLS validation to CI/CD

---

## Related Files

- `supabase/schema.sql` - Main schema with initial RLS policies
- `supabase/migrations/20250809183000_lists_rls_policies.sql` - Migration with duplicate policies
- `docs/RLS_VALIDATION_REPORT.md` - Full validation report
- `docs/RLS_VALIDATION_TESTS.sql` - Test queries to verify RLS

---

**Last Updated:** 2024-09-30
**Status:** Action Required
