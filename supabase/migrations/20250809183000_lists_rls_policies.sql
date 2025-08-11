-- RLS policies for game_lists, game_list_items, rankings (idempotent)

-- 1. Enable RLS (safe if already enabled)
ALTER TABLE public.game_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

-- 2. GAME_LISTS policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='game_lists' AND policyname='Select own lists'
  ) THEN
    CREATE POLICY "Select own lists" ON public.game_lists
      FOR SELECT USING ( auth.uid() = user_id );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='game_lists' AND policyname='Insert own lists'
  ) THEN
    CREATE POLICY "Insert own lists" ON public.game_lists
      FOR INSERT WITH CHECK ( auth.uid() = user_id );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='game_lists' AND policyname='Update own lists'
  ) THEN
    CREATE POLICY "Update own lists" ON public.game_lists
      FOR UPDATE USING ( auth.uid() = user_id ) WITH CHECK ( auth.uid() = user_id );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='game_lists' AND policyname='Delete own lists'
  ) THEN
    CREATE POLICY "Delete own lists" ON public.game_lists
      FOR DELETE USING ( auth.uid() = user_id );
  END IF;
END $$;

-- 3. GAME_LIST_ITEMS policies (ownership via parent list)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='game_list_items' AND policyname='Select items in own lists'
  ) THEN
    CREATE POLICY "Select items in own lists" ON public.game_list_items
      FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM public.game_lists gl WHERE gl.id = list_id)
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='game_list_items' AND policyname='Insert items in own lists'
  ) THEN
    CREATE POLICY "Insert items in own lists" ON public.game_list_items
      FOR INSERT WITH CHECK (
        auth.uid() = (SELECT user_id FROM public.game_lists gl WHERE gl.id = list_id)
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='game_list_items' AND policyname='Delete items in own lists'
  ) THEN
    CREATE POLICY "Delete items in own lists" ON public.game_list_items
      FOR DELETE USING (
        auth.uid() = (SELECT user_id FROM public.game_lists gl WHERE gl.id = list_id)
      );
  END IF;
END $$;

-- 4. RANKINGS policies (per user/game)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='rankings' AND policyname='Select own rankings'
  ) THEN
    CREATE POLICY "Select own rankings" ON public.rankings
      FOR SELECT USING ( auth.uid() = user_id );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='rankings' AND policyname='Upsert own rankings'
  ) THEN
    CREATE POLICY "Upsert own rankings" ON public.rankings
      FOR INSERT WITH CHECK ( auth.uid() = user_id );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='rankings' AND policyname='Update own rankings'
  ) THEN
    CREATE POLICY "Update own rankings" ON public.rankings
      FOR UPDATE USING ( auth.uid() = user_id ) WITH CHECK ( auth.uid() = user_id );
  END IF;
END $$;

-- 5. Reload schema
NOTIFY pgrst, 'reload schema';
