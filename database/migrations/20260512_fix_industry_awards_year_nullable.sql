-- The original industry_awards schema allowed year to be NULL (honor records
-- without a specific year are valid — e.g. test honor 79097). My initial
-- restore migration mistakenly made year NOT NULL. Relax it back.

BEGIN;

ALTER TABLE public.industry_awards
  ALTER COLUMN year DROP NOT NULL;

COMMIT;
