-- Consolidated Lists & Rankings Setup (Idempotent)
-- This migration creates list_type enum, adds list_type column, ensures default lists per user,
-- fixes unique constraints for list items and rankings, and sets up triggers for auto-creation.

-- 1. Enum for list types (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'list_type') THEN
    CREATE TYPE list_type AS ENUM ('library','wishlist','custom');
  END IF;
END $$;

-- 2. Add list_type column to game_lists (defaults to custom for existing rows)
ALTER TABLE public.game_lists
  ADD COLUMN IF NOT EXISTS list_type list_type NOT NULL DEFAULT 'custom';

-- 3. Backfill existing rows by heuristic name (only where still custom)
UPDATE public.game_lists SET list_type = 'library'
 WHERE list_type = 'custom' AND lower(name) = 'library';
UPDATE public.game_lists SET list_type = 'wishlist'
 WHERE list_type = 'custom' AND lower(name) = 'wishlist';

-- 4. Unique default lists per user (partial unique indexes)
CREATE UNIQUE INDEX IF NOT EXISTS game_lists_user_library_unique
  ON public.game_lists (user_id) WHERE list_type = 'library';
CREATE UNIQUE INDEX IF NOT EXISTS game_lists_user_wishlist_unique
  ON public.game_lists (user_id) WHERE list_type = 'wishlist';

-- 5. Helper function to create default lists for a user
CREATE OR REPLACE FUNCTION public.create_default_lists_for_user(u uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.game_lists (user_id, name, description, is_public, list_type)
  VALUES (u,'Library','All games you own or track',false,'library')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.game_lists (user_id, name, description, is_public, list_type)
  VALUES (u,'Wishlist','Games you want to acquire',false,'wishlist')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to auto-create defaults on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile_default_lists()
RETURNS trigger AS $$
BEGIN
  PERFORM public.create_default_lists_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_default_lists_after_profile ON public.profiles;
CREATE TRIGGER create_default_lists_after_profile
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_default_lists();

-- 7. Backfill defaults for existing profiles
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.create_default_lists_for_user(r.id);
  END LOOP;
END $$;

-- 8. Fix game_list_items unique constraint to (list_id, game_id)
-- Drop legacy constraint if it exists (name was game_list_items_list_id_ranking_key in prior iteration)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'game_list_items' AND c.conname = 'game_list_items_list_id_ranking_key'
  ) THEN
    ALTER TABLE public.game_list_items DROP CONSTRAINT game_list_items_list_id_ranking_key;
  END IF;
END $$;

-- Create proper unique index (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS game_list_items_list_id_game_id_unique
  ON public.game_list_items (list_id, game_id);

-- 9. Ensure rankings unique per user/game
CREATE UNIQUE INDEX IF NOT EXISTS rankings_user_game_unique
  ON public.rankings (user_id, game_id);

-- 10. Optional: comment documentation
COMMENT ON TYPE list_type IS 'Type of user game list: library (owned), wishlist (desired), custom (user-defined)';
COMMENT ON COLUMN public.game_lists.list_type IS 'Categorizes the list: library, wishlist, or custom';

-- 11. Ask PostgREST to reload schema (ignored if insufficient privilege)
NOTIFY pgrst, 'reload schema';

-- End of migration
