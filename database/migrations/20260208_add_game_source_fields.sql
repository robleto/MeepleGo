-- Add provenance fields for games
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS source_notes text;

-- Backfill existing rows
UPDATE public.games
SET source = 'legacy_unknown'
WHERE source IS NULL;
