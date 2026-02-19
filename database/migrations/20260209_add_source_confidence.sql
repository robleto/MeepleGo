-- Add source confidence column for games
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS source_confidence numeric(3,2);

-- Default legacy rows to low confidence if not set
UPDATE public.games
SET source_confidence = 0.10
WHERE source_confidence IS NULL;
