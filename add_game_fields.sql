-- Add new fields to games table for designers, artists, age, and weight
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS designers text[] NULL,
ADD COLUMN IF NOT EXISTS artists text[] NULL,
ADD COLUMN IF NOT EXISTS age integer NULL,
ADD COLUMN IF NOT EXISTS weight numeric(3,2) NULL;

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_games_designers ON public.games USING gin (designers);
CREATE INDEX IF NOT EXISTS idx_games_artists ON public.games USING gin (artists);
CREATE INDEX IF NOT EXISTS idx_games_age ON public.games (age);
CREATE INDEX IF NOT EXISTS idx_games_weight ON public.games (weight);

-- Add comments for documentation
COMMENT ON COLUMN public.games.designers IS 'Array of game designer names from BGG';
COMMENT ON COLUMN public.games.artists IS 'Array of game artist names from BGG';
COMMENT ON COLUMN public.games.age IS 'Minimum recommended age from BGG';
COMMENT ON COLUMN public.games.weight IS 'Game complexity/weight rating from BGG (1.0-5.0)';
