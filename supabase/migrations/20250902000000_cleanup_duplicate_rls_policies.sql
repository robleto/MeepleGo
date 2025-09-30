-- Cleanup duplicate and conflicting RLS policies
-- Date: 2025-09-02
-- Purpose: Remove duplicate policies from migration 20250809183000 that conflict with schema.sql
-- Rationale: schema.sql policies are more feature-complete (allow public list viewing)

-- Drop conflicting game_lists SELECT policy
-- Migration policy only allows viewing own lists, but schema.sql allows public lists too
DROP POLICY IF EXISTS "Select own lists" ON public.game_lists;

-- Drop conflicting game_list_items SELECT policy  
-- Migration policy only allows viewing items in own lists, but schema.sql allows public list items
DROP POLICY IF EXISTS "Select items in own lists" ON public.game_list_items;

-- Drop duplicate rankings policies
-- These duplicate the functionality in schema.sql with different names
DROP POLICY IF EXISTS "Select own rankings" ON public.rankings;
DROP POLICY IF EXISTS "Upsert own rankings" ON public.rankings;
-- Note: "Update own rankings" exists in both schema.sql and migration with identical name and logic
-- PostgreSQL will not create duplicate if name already exists, so no action needed

-- Keep all other policies from both files as they don't conflict:
-- - game_lists: Insert, Update, Delete policies from migration (equivalent to schema.sql)
-- - game_list_items: Insert, Delete policies from migration (schema.sql uses FOR ALL)

-- Verify RLS is still enabled on all tables
-- (This should already be true, but verifying doesn't hurt)
DO $$ 
BEGIN
  -- Ensure RLS is enabled
  EXECUTE 'ALTER TABLE public.game_lists ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.game_list_items ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY';
  
  -- Log completion
  RAISE NOTICE 'RLS policy cleanup completed successfully';
END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- End of migration
