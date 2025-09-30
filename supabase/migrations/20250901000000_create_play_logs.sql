-- Migration: Create play_logs table with proper RLS policies
-- Date: 2025-09-01
-- Purpose: Add play logging functionality with user privacy controls

-- 1. Create play_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.play_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  played_at timestamptz NOT NULL DEFAULT now(),
  rating integer NULL CHECK (rating >= 1 AND rating <= 10),
  player_count integer NULL CHECK (player_count > 0),
  duration_minutes integer NULL CHECK (duration_minutes > 0),
  location text NULL,
  notes text NULL,
  tags text[] NULL,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS play_logs_user_id_idx ON public.play_logs(user_id);
CREATE INDEX IF NOT EXISTS play_logs_game_id_idx ON public.play_logs(game_id);
CREATE INDEX IF NOT EXISTS play_logs_played_at_idx ON public.play_logs(played_at DESC);
CREATE INDEX IF NOT EXISTS play_logs_user_game_idx ON public.play_logs(user_id, game_id);
CREATE INDEX IF NOT EXISTS play_logs_is_public_idx ON public.play_logs(is_public) WHERE is_public = true;

-- 3. Add trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_play_logs_updated_at ON public.play_logs;
CREATE TRIGGER update_play_logs_updated_at 
  BEFORE UPDATE ON public.play_logs
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Enable Row Level Security
ALTER TABLE public.play_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies (idempotent)
-- SELECT: Users can view their own logs and public logs from others
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' 
    AND tablename='play_logs' 
    AND policyname='Users can view own and public play logs'
  ) THEN
    CREATE POLICY "Users can view own and public play logs" ON public.play_logs
      FOR SELECT USING (
        user_id = auth.uid() OR is_public = true
      );
  END IF;
END $$;

-- INSERT: Users can only create logs for themselves
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' 
    AND tablename='play_logs' 
    AND policyname='Users can insert own play logs'
  ) THEN
    CREATE POLICY "Users can insert own play logs" ON public.play_logs
      FOR INSERT WITH CHECK (
        user_id = auth.uid()
      );
  END IF;
END $$;

-- UPDATE: Users can only update their own logs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' 
    AND tablename='play_logs' 
    AND policyname='Users can update own play logs'
  ) THEN
    CREATE POLICY "Users can update own play logs" ON public.play_logs
      FOR UPDATE USING (
        user_id = auth.uid()
      ) WITH CHECK (
        user_id = auth.uid()
      );
  END IF;
END $$;

-- DELETE: Users can only delete their own logs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' 
    AND tablename='play_logs' 
    AND policyname='Users can delete own play logs'
  ) THEN
    CREATE POLICY "Users can delete own play logs" ON public.play_logs
      FOR DELETE USING (
        user_id = auth.uid()
      );
  END IF;
END $$;

-- 6. Add table comment
COMMENT ON TABLE public.play_logs IS 'User play history for games with optional public sharing';
COMMENT ON COLUMN public.play_logs.is_public IS 'When true, other users can see this play log';
COMMENT ON COLUMN public.play_logs.rating IS 'Optional rating (1-10) for this specific play session';

-- 7. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- End of migration
