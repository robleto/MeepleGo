-- Taxonomy Normalization Migration (Phase 1)
-- Creates categories, mechanics, publishers + junction tables and backfills from existing games.* columns
-- Idempotent where feasible.

-- 1. Core taxonomy tables ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mechanics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.publishers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Junction tables ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_categories (
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.game_mechanics (
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  mechanic_id uuid NOT NULL REFERENCES public.mechanics(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, mechanic_id)
);

CREATE TABLE IF NOT EXISTS public.game_publishers (
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  publisher_id uuid NOT NULL REFERENCES public.publishers(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, publisher_id)
);

-- 3. Helper slug function (safe create) --------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mg_slugify') THEN
    CREATE OR REPLACE FUNCTION public.mg_slugify(input text)
    RETURNS text LANGUAGE sql IMMUTABLE AS $$
      SELECT trim(both '-' FROM regexp_replace(lower(coalesce($1,'')), '[^a-z0-9]+', '-', 'g'));
    $$;
  END IF;
END $$;

-- 4. Backfill taxonomy dimension tables -------------------------------------
-- Categories
WITH src AS (
  SELECT DISTINCT trim(c) AS name
  FROM public.games g
  CROSS JOIN LATERAL unnest(g.categories) AS c
  WHERE g.categories IS NOT NULL AND trim(c) <> ''
), to_insert AS (
  SELECT name, public.mg_slugify(name) AS slug FROM src
  WHERE NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.name = src.name)
)
INSERT INTO public.categories(name, slug)
SELECT name, slug FROM to_insert;

-- Mechanics
WITH src AS (
  SELECT DISTINCT trim(m) AS name
  FROM public.games g
  CROSS JOIN LATERAL unnest(g.mechanics) AS m
  WHERE g.mechanics IS NOT NULL AND trim(m) <> ''
), to_insert AS (
  SELECT name, public.mg_slugify(name) AS slug FROM src
  WHERE NOT EXISTS (SELECT 1 FROM public.mechanics mm WHERE mm.name = src.name)
)
INSERT INTO public.mechanics(name, slug)
SELECT name, slug FROM to_insert;

-- Publishers
WITH src AS (
  SELECT DISTINCT trim(publisher) AS name
  FROM public.games
  WHERE publisher IS NOT NULL AND trim(publisher) <> ''
), to_insert AS (
  SELECT name, public.mg_slugify(name) AS slug FROM src
  WHERE NOT EXISTS (SELECT 1 FROM public.publishers pp WHERE pp.name = src.name)
)
INSERT INTO public.publishers(name, slug)
SELECT name, slug FROM to_insert;

-- 5. Backfill junction tables ------------------------------------------------
-- game_categories
INSERT INTO public.game_categories (game_id, category_id)
SELECT g.id, c.id
FROM public.games g
CROSS JOIN LATERAL unnest(g.categories) AS cat(name)
JOIN public.categories c ON c.name = cat.name
ON CONFLICT DO NOTHING;

-- game_mechanics
INSERT INTO public.game_mechanics (game_id, mechanic_id)
SELECT g.id, m.id
FROM public.games g
CROSS JOIN LATERAL unnest(g.mechanics) AS mech(name)
JOIN public.mechanics m ON m.name = mech.name
ON CONFLICT DO NOTHING;

-- game_publishers (some games may have a single publisher string)
INSERT INTO public.game_publishers (game_id, publisher_id)
SELECT g.id, p.id
FROM public.games g
JOIN public.publishers p ON p.name = g.publisher
ON CONFLICT DO NOTHING;

-- 6. Indexes -----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS categories_slug_idx ON public.categories (slug);
CREATE INDEX IF NOT EXISTS mechanics_slug_idx ON public.mechanics (slug);
CREATE INDEX IF NOT EXISTS publishers_slug_idx ON public.publishers (slug);
CREATE INDEX IF NOT EXISTS game_categories_category_idx ON public.game_categories (category_id);
CREATE INDEX IF NOT EXISTS game_mechanics_mechanic_idx ON public.game_mechanics (mechanic_id);
CREATE INDEX IF NOT EXISTS game_publishers_publisher_idx ON public.game_publishers (publisher_id);

-- 7. RLS (read-only public/select; restrict writes to service role via future policies) ----
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_publishers ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated (and anon for browsing) to read taxonomy
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE policyname='Read categories';
  IF NOT FOUND THEN
    CREATE POLICY "Read categories" ON public.categories FOR SELECT USING (true);
  END IF;
  PERFORM 1 FROM pg_policies WHERE policyname='Read mechanics';
  IF NOT FOUND THEN
    CREATE POLICY "Read mechanics" ON public.mechanics FOR SELECT USING (true);
  END IF;
  PERFORM 1 FROM pg_policies WHERE policyname='Read publishers';
  IF NOT FOUND THEN
    CREATE POLICY "Read publishers" ON public.publishers FOR SELECT USING (true);
  END IF;
  PERFORM 1 FROM pg_policies WHERE policyname='Read game_categories';
  IF NOT FOUND THEN
    CREATE POLICY "Read game_categories" ON public.game_categories FOR SELECT USING (true);
  END IF;
  PERFORM 1 FROM pg_policies WHERE policyname='Read game_mechanics';
  IF NOT FOUND THEN
    CREATE POLICY "Read game_mechanics" ON public.game_mechanics FOR SELECT USING (true);
  END IF;
  PERFORM 1 FROM pg_policies WHERE policyname='Read game_publishers';
  IF NOT FOUND THEN
    CREATE POLICY "Read game_publishers" ON public.game_publishers FOR SELECT USING (true);
  END IF;
END $$;

-- 8. (Optional future) Drop legacy columns after code refactor:
-- ALTER TABLE public.games DROP COLUMN categories;
-- ALTER TABLE public.games DROP COLUMN mechanics;
-- ALTER TABLE public.games DROP COLUMN publisher;
-- Keep for now to avoid breaking existing queries.

-- 9. Notify PostgREST
NOTIFY pgrst, 'reload schema';

-- End migration
