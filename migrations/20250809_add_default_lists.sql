-- Create enum for list types
DO $$ BEGIN
  CREATE TYPE list_type AS ENUM ('library','wishlist','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add column to game_lists
ALTER TABLE public.game_lists
  ADD COLUMN IF NOT EXISTS list_type list_type NOT NULL DEFAULT 'custom';

-- Backfill existing system lists if any by name heuristics
UPDATE public.game_lists SET list_type = 'library' WHERE lower(name) = 'library';
UPDATE public.game_lists SET list_type = 'wishlist' WHERE lower(name) = 'wishlist';

-- Ensure uniqueness of default lists per user
CREATE UNIQUE INDEX IF NOT EXISTS game_lists_user_library_unique
  ON public.game_lists (user_id)
  WHERE list_type = 'library';
CREATE UNIQUE INDEX IF NOT EXISTS game_lists_user_wishlist_unique
  ON public.game_lists (user_id)
  WHERE list_type = 'wishlist';

-- Function to create default lists for a user
CREATE OR REPLACE FUNCTION public.create_default_lists_for_user(uuid)
RETURNS void AS $$
DECLARE
  uid alias for $1;
BEGIN
  -- Library
  INSERT INTO public.game_lists (user_id, name, description, is_public, list_type)
  VALUES (uid, 'Library', 'All games you own or track', false, 'library')
  ON CONFLICT DO NOTHING;
  -- Wishlist
  INSERT INTO public.game_lists (user_id, name, description, is_public, list_type)
  VALUES (uid, 'Wishlist', 'Games you want to acquire', false, 'wishlist')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on new profile creation
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

-- Backfill existing profiles
DO $$
DECLARE r RECORD; BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.create_default_lists_for_user(r.id);
  END LOOP;
END $$;
