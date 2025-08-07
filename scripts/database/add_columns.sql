-- Add new columns to existing games table
DO $$
BEGIN
  -- Add designers column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'designers') THEN
    ALTER TABLE public.games ADD COLUMN designers text[] NULL;
  END IF;
  
  -- Add artists column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'artists') THEN
    ALTER TABLE public.games ADD COLUMN artists text[] NULL;
  END IF;
  
  -- Add age column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'age') THEN
    ALTER TABLE public.games ADD COLUMN age integer NULL;
  END IF;
  
  -- Add weight column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'weight') THEN
    ALTER TABLE public.games ADD COLUMN weight numeric(3,2) NULL;
  END IF;
END $$;

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_games_designers ON public.games USING gin (designers);
CREATE INDEX IF NOT EXISTS idx_games_artists ON public.games USING gin (artists);
CREATE INDEX IF NOT EXISTS idx_games_age ON public.games (age);
CREATE INDEX IF NOT EXISTS idx_games_weight ON public.games (weight);
