-- Ensure no duplicate game per list
CREATE UNIQUE INDEX IF NOT EXISTS game_list_items_list_game_unique
ON public.game_list_items (list_id, game_id);
