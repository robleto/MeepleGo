-- Ensure a user has only one ranking record per game
CREATE UNIQUE INDEX IF NOT EXISTS rankings_user_game_unique
ON public.rankings (user_id, game_id);
