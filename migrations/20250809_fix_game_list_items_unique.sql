-- Adjust unique constraint to be (list_id, game_id)
ALTER TABLE public.game_list_items DROP CONSTRAINT IF EXISTS game_list_items_list_id_ranking_key;
CREATE UNIQUE INDEX IF NOT EXISTS game_list_items_list_id_game_id_unique ON public.game_list_items (list_id, game_id);
