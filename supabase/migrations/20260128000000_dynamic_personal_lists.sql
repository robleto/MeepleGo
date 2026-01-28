-- Migration: Create RPC functions for dynamic personal discovery lists
-- Date: 2026-01-28
-- Purpose: Replace BGG lists with personalized discovery cards based on user data

-- ========================================
-- List A: Most Awarded This Year
-- ========================================
-- Shows games receiving the most award points in the current year
-- Winner = 3 points, Finalist (in nominees) = 1 point

CREATE OR REPLACE FUNCTION public.get_most_awarded_this_year(user_uuid uuid)
RETURNS TABLE (
  game_id uuid,
  game_name text,
  game_thumbnail_url text,
  game_year_published integer,
  game_rating numeric,
  total_points bigint,
  award_count bigint,
  most_recent_award timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH award_scores AS (
    -- Winners get 3 points
    SELECT 
      winner_id as game_id,
      3::bigint as points,
      year,
      category,
      updated_at
    FROM awards
    WHERE user_id = user_uuid
      AND year = EXTRACT(YEAR FROM CURRENT_DATE)::integer
      AND winner_id IS NOT NULL
    
    UNION ALL
    
    -- Nominees get 1 point each
    SELECT 
      UNNEST(nominees) as game_id,
      1::bigint as points,
      year,
      category,
      updated_at
    FROM awards
    WHERE user_id = user_uuid
      AND year = EXTRACT(YEAR FROM CURRENT_DATE)::integer
      AND nominees IS NOT NULL
      AND array_length(nominees, 1) > 0
  )
  SELECT 
    g.id as game_id,
    g.name as game_name,
    g.thumbnail_url as game_thumbnail_url,
    g.year_published as game_year_published,
    g.rating as game_rating,
    SUM(asc.points) as total_points,
    COUNT(DISTINCT asc.category) as award_count,
    MAX(asc.updated_at) as most_recent_award
  FROM award_scores asc
  JOIN games g ON g.id = asc.game_id
  GROUP BY g.id, g.name, g.thumbnail_url, g.year_published, g.rating
  -- Filter: at least 2 points OR at least 1 win
  HAVING SUM(asc.points) >= 2 
     OR SUM(CASE WHEN asc.points = 3 THEN 1 ELSE 0 END) >= 1
  ORDER BY total_points DESC, award_count DESC, most_recent_award DESC, g.name ASC
  LIMIT 10;
END;
$$;

-- ========================================
-- List B: Highest Ranked by You
-- ========================================
-- Shows personal top-rated games with tie-breakers

CREATE OR REPLACE FUNCTION public.get_highest_ranked(user_uuid uuid)
RETURNS TABLE (
  game_id uuid,
  game_name text,
  game_thumbnail_url text,
  game_year_published integer,
  game_rating numeric,
  user_ranking integer,
  plays_12mo bigint,
  last_played timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH latest_rankings AS (
    SELECT 
      r.game_id,
      r.ranking,
      r.updated_at as ranked_at,
      COUNT(pl.id) FILTER (
        WHERE pl.played_at >= NOW() - INTERVAL '12 months'
      ) as plays_12mo,
      MAX(pl.played_at) as last_played
    FROM rankings r
    LEFT JOIN play_logs pl ON pl.game_id = r.game_id 
      AND pl.user_id = r.user_id
    WHERE r.user_id = user_uuid
      AND r.ranking IS NOT NULL
      AND r.updated_at >= NOW() - INTERVAL '5 years'
    GROUP BY r.game_id, r.ranking, r.updated_at
  )
  SELECT 
    g.id as game_id,
    g.name as game_name,
    g.thumbnail_url as game_thumbnail_url,
    g.year_published as game_year_published,
    g.rating as game_rating,
    lr.ranking as user_ranking,
    lr.plays_12mo,
    lr.last_played
  FROM latest_rankings lr
  JOIN games g ON g.id = lr.game_id
  ORDER BY 
    lr.ranking DESC, 
    lr.plays_12mo DESC, 
    lr.last_played DESC NULLS LAST, 
    g.name ASC
  LIMIT 10;
END;
$$;

-- ========================================
-- List C: Sleeper Hits (Updated Spec)
-- ========================================
-- Per-user list: games YOU ranked highly (>=8) with low community awareness
-- Configurable max_num_ratings (default 2000-5000)

CREATE OR REPLACE FUNCTION public.get_sleeper_hits(
  user_uuid uuid,
  max_num_ratings integer DEFAULT 3000
)
RETURNS TABLE (
  game_id uuid,
  game_name text,
  game_thumbnail_url text,
  game_year_published integer,
  game_rating numeric,
  game_num_ratings integer,
  user_ranking integer,
  last_played timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as game_id,
    g.name as game_name,
    g.thumbnail_url as game_thumbnail_url,
    g.year_published as game_year_published,
    g.rating as game_rating,
    g.num_ratings as game_num_ratings,
    r.ranking as user_ranking,
    MAX(pl.played_at) as last_played
  FROM rankings r
  JOIN games g ON g.id = r.game_id
  LEFT JOIN play_logs pl ON pl.game_id = r.game_id AND pl.user_id = r.user_id
  WHERE r.user_id = user_uuid
    AND r.ranking >= 8
    AND g.num_ratings IS NOT NULL
    AND g.num_ratings > 0
    AND g.num_ratings <= max_num_ratings
  GROUP BY g.id, g.name, g.thumbnail_url, g.year_published, g.rating, g.num_ratings, r.ranking
  ORDER BY r.ranking DESC, g.num_ratings ASC, last_played DESC NULLS LAST
  LIMIT 10;
END;
$$;

-- ========================================
-- List D: Your Hot Takes (Updated Spec)
-- ========================================
-- Games where your rating differs most from BGG average
-- Order by absolute delta (largest disagreement first)
-- Configurable min_num_ratings (default 500-1000)

CREATE OR REPLACE FUNCTION public.get_hot_takes(
  user_uuid uuid,
  min_num_ratings integer DEFAULT 750
)
RETURNS TABLE (
  game_id uuid,
  game_name text,
  game_thumbnail_url text,
  game_year_published integer,
  user_ranking integer,
  bgg_rating numeric,
  delta numeric,
  abs_delta numeric,
  hot_take_type text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_vs_bgg AS (
    SELECT 
      r.game_id,
      r.ranking as user_ranking,
      g.rating as bgg_rating,
      g.num_ratings as bgg_num_ratings,
      r.ranking - g.rating as delta,
      ABS(r.ranking - g.rating) as abs_delta
    FROM rankings r
    JOIN games g ON g.id = r.game_id
    WHERE r.user_id = user_uuid
      AND r.ranking IS NOT NULL
      AND g.rating IS NOT NULL
      AND g.num_ratings >= min_num_ratings
  )
  SELECT 
    g.id as game_id,
    g.name as game_name,
    g.thumbnail_url as game_thumbnail_url,
    g.year_published as game_year_published,
    uvb.user_ranking,
    uvb.bgg_rating,
    uvb.delta,
    uvb.abs_delta,
    CASE 
      WHEN uvb.delta > 0 THEN 'loved_more'
      ELSE 'liked_less'
    END as hot_take_type
  FROM user_vs_bgg uvb
  JOIN games g ON g.id = uvb.game_id
  -- No minimum delta filter so list always populates
  ORDER BY uvb.abs_delta DESC, uvb.user_ranking DESC, g.name ASC
  LIMIT 10;
END;
$$;

-- ========================================
-- List E: Games You Keep Coming Back To
-- ========================================
-- Most consistently played games (3+ different months in last 12 months)

CREATE OR REPLACE FUNCTION public.get_comeback_games(user_uuid uuid)
RETURNS TABLE (
  game_id uuid,
  game_name text,
  game_thumbnail_url text,
  game_year_published integer,
  game_rating numeric,
  months_played_12mo bigint,
  total_plays_12mo bigint,
  consistency_score bigint,
  last_play_month timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH monthly_plays AS (
    SELECT 
      game_id,
      user_id,
      DATE_TRUNC('month', played_at) as play_month,
      COUNT(*) as plays_in_month
    FROM play_logs
    WHERE user_id = user_uuid
      AND played_at >= NOW() - INTERVAL '12 months'
    GROUP BY game_id, user_id, DATE_TRUNC('month', played_at)
  ),
  game_consistency AS (
    SELECT 
      game_id,
      COUNT(DISTINCT play_month) as months_played_12mo,
      SUM(plays_in_month) as total_plays_12mo,
      MAX(play_month) as last_play_month
    FROM monthly_plays
    GROUP BY game_id
    HAVING COUNT(DISTINCT play_month) >= 3
  )
  SELECT 
    g.id as game_id,
    g.name as game_name,
    g.thumbnail_url as game_thumbnail_url,
    g.year_published as game_year_published,
    g.rating as game_rating,
    gc.months_played_12mo,
    gc.total_plays_12mo,
    (gc.months_played_12mo * 3) + gc.total_plays_12mo as consistency_score,
    gc.last_play_month
  FROM game_consistency gc
  JOIN games g ON g.id = gc.game_id
  ORDER BY consistency_score DESC, gc.last_play_month DESC
  LIMIT 10;
END;
$$;

-- Add helpful comments
COMMENT ON FUNCTION public.get_most_awarded_this_year(uuid) IS 'Returns top 10 games by award points in current year (winner=3pts, nominee=1pt)';
COMMENT ON FUNCTION public.get_highest_ranked(uuid) IS 'Returns user top 10 highest-ranked games with play statistics';
COMMENT ON FUNCTION public.get_sleeper_hits(uuid, integer) IS 'Returns user highly-ranked games (>=8) with low BGG rating counts';
COMMENT ON FUNCTION public.get_hot_takes(uuid, integer) IS 'Returns games where user rating differs most from BGG average';
COMMENT ON FUNCTION public.get_comeback_games(uuid) IS 'Returns games played consistently across 3+ months in last year';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
