-- Adds the `is_curated` flag to games.
-- True for games enriched via Wikidata ingest (rich metadata available).
-- False for the long tail (mostly award-referenced but obscure).
-- The /games browse view filters to is_curated = true. Award pages still
-- show all linked games regardless, so this is a presentation filter,
-- not a deletion strategy.

BEGIN;

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS is_curated boolean NOT NULL DEFAULT false;

-- Track Wikidata id for round-tripping / future re-ingest
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS wikidata_id text NULL;

CREATE INDEX IF NOT EXISTS idx_games_is_curated
  ON public.games (is_curated)
  WHERE is_curated = true;

-- wikidata_id is NOT unique: Wikidata sometimes has one entity that lists
-- multiple BGG IDs (re-releases, alt editions, series titles), so multiple
-- games legitimately share a wikidata_id. A non-unique index is enough for
-- lookup speed; uniqueness would reject ~1.5% of the ingest.
DROP INDEX IF EXISTS public.games_wikidata_id_key;
CREATE INDEX IF NOT EXISTS idx_games_wikidata_id
  ON public.games (wikidata_id)
  WHERE wikidata_id IS NOT NULL;

COMMIT;
