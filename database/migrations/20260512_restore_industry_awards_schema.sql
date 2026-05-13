-- Follow-up to 20260512_restore_bgg_fields.sql.
-- The minimal industry_awards/industry_award_games tables created there are
-- missing columns that scripts/populate-industry-awards.js writes to.
-- This brings them up to the spec from database/migrations/create_industry_awards.sql
-- and recreates the industry_awards_with_games view.

BEGIN;

-- 1. Add missing columns on industry_awards
ALTER TABLE public.industry_awards
  ADD COLUMN IF NOT EXISTS bgg_honor_id text NULL,
  ADD COLUMN IF NOT EXISTS slug text NULL,
  ADD COLUMN IF NOT EXISTS bgg_url text NULL,
  ADD COLUMN IF NOT EXISTS title text NULL,
  ADD COLUMN IF NOT EXISTS primary_name text NULL,
  ADD COLUMN IF NOT EXISTS alternate_names text[] NULL,
  ADD COLUMN IF NOT EXISTS position text NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- The previous migration set award_set/year/status NOT NULL — keep that.
-- title was NOT NULL in the original schema; populate may include nulls in
-- some honor rows, so keep title nullable for safety.

-- Unique on bgg_honor_id (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS industry_awards_bgg_honor_id_key
  ON public.industry_awards (bgg_honor_id)
  WHERE bgg_honor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_industry_awards_status
  ON public.industry_awards (status);
CREATE INDEX IF NOT EXISTS idx_industry_awards_category
  ON public.industry_awards (category);
CREATE INDEX IF NOT EXISTS idx_industry_awards_title
  ON public.industry_awards (title);

-- 2. Add missing columns on industry_award_games
-- The minimal table only had (award_id, game_id) as composite PK. The original
-- had its own UUID id + bgg_game_id + game_name + UNIQUE(award_id, game_id).
-- We can't easily change the PK without dropping rows, but the table should
-- still be empty here. Drop and recreate for safety if it has no rows.

DO $$
DECLARE
  row_count integer;
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.industry_award_games;
  IF row_count = 0 THEN
    DROP TABLE public.industry_award_games;
    CREATE TABLE public.industry_award_games (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      award_id uuid NOT NULL,
      game_id uuid NOT NULL,
      bgg_game_id integer NOT NULL,
      game_name text NOT NULL,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT industry_award_games_pkey PRIMARY KEY (id),
      CONSTRAINT industry_award_games_award_game_unique UNIQUE (award_id, game_id),
      CONSTRAINT industry_award_games_award_id_fkey FOREIGN KEY (award_id)
        REFERENCES public.industry_awards (id) ON DELETE CASCADE,
      CONSTRAINT industry_award_games_game_id_fkey FOREIGN KEY (game_id)
        REFERENCES public.games (id) ON DELETE CASCADE
    );
  ELSE
    RAISE NOTICE 'industry_award_games has % rows; not recreating.', row_count;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_industry_award_games_award_id
  ON public.industry_award_games (award_id);
CREATE INDEX IF NOT EXISTS idx_industry_award_games_game_id
  ON public.industry_award_games (game_id);
CREATE INDEX IF NOT EXISTS idx_industry_award_games_bgg_id
  ON public.industry_award_games (bgg_game_id);

-- 3. Recreate the industry_awards_with_games view
CREATE OR REPLACE VIEW public.industry_awards_with_games
WITH (security_invoker = on) AS
SELECT
  ia.id,
  ia.bgg_honor_id,
  ia.slug,
  ia.bgg_url,
  ia.year,
  ia.title,
  ia.award_set,
  ia.position,
  ia.status,
  ia.category,
  ia.created_at,
  ia.updated_at,
  json_agg(
    json_build_object(
      'game_id', g.id,
      'bgg_id', g.bgg_id,
      'name', g.name,
      'year_published', g.year_published,
      'image_url', g.image_url
    ) ORDER BY g.name
  ) FILTER (WHERE g.id IS NOT NULL) AS games
FROM public.industry_awards ia
LEFT JOIN public.industry_award_games iag ON ia.id = iag.award_id
LEFT JOIN public.games g ON iag.game_id = g.id
GROUP BY ia.id, ia.bgg_honor_id, ia.slug, ia.bgg_url, ia.year, ia.title,
         ia.award_set, ia.position, ia.status, ia.category, ia.created_at,
         ia.updated_at;

COMMIT;
