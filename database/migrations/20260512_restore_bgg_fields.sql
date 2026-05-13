-- Reverse of 20260209_remove_bgg_fields.sql
-- Restores BGG-derived columns and tables that were dropped accidentally.
-- Data is NOT automatically restored except for bgg_id (preserved in games_legacy_bgg).
-- After running this, repopulate `rank` via scripts/data-migration/backfill_bgg_ranks.js
-- and re-import industry awards via scripts/populate-industry-awards.js.

BEGIN;

-- 1. Restore dropped columns on public.games (nullable, no defaults)
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS rank integer NULL;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS bgg_id integer NULL;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS bgg_type text NULL;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS parent_bgg_id integer NULL;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS expansion_ids integer[] NULL;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS integrates_with_ids integer[] NULL;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS rank_families text[] NULL;

-- 2. Restore bgg_id values from the legacy mapping table (preserved by the original migration)
UPDATE public.games g
SET bgg_id = l.bgg_id
FROM public.games_legacy_bgg l
WHERE g.id = l.game_id
  AND g.bgg_id IS NULL;

-- Re-create the unique index on bgg_id that existed previously
CREATE UNIQUE INDEX IF NOT EXISTS games_bgg_id_key
  ON public.games (bgg_id)
  WHERE bgg_id IS NOT NULL;

-- 3. Recreate industry_awards table (data will need to be re-imported)
CREATE TABLE IF NOT EXISTS public.industry_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  award_set text NOT NULL,
  year integer NOT NULL,
  status text NOT NULL,
  category text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_industry_awards_award_set
  ON public.industry_awards (award_set);
CREATE INDEX IF NOT EXISTS idx_industry_awards_year
  ON public.industry_awards (year);

-- 4. Recreate industry_award_games join table
CREATE TABLE IF NOT EXISTS public.industry_award_games (
  award_id uuid REFERENCES public.industry_awards(id) ON DELETE CASCADE,
  game_id uuid REFERENCES public.games(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (award_id, game_id)
);

-- 5. Recreate bgg_trend_runs (used by trend ingestion scripts)
CREATE TABLE IF NOT EXISTS public.bgg_trend_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL DEFAULT now(),
  source text NULL,
  status text NULL,
  notes text NULL
);

-- 6. Add index on rank for ordering performance once data is repopulated
CREATE INDEX IF NOT EXISTS idx_games_rank
  ON public.games (rank)
  WHERE rank IS NOT NULL;

COMMIT;

-- Post-run TODO (handled outside this SQL):
--   1. node scripts/data-migration/backfill_bgg_ranks.js   -- re-populate `rank`
--   2. node scripts/populate-industry-awards.js            -- re-import awards
--   3. Recreate dropped views if needed:
--        - games_stats_refresh_candidates
--        - games_enrichment_candidates
--        - games_needing_enrichment
--        - industry_awards_with_games
--      (Look at git history before 20260209 for the original CREATE VIEW statements.)
