-- MeepleGo Database Schema for Supabase
-- Run this in your Supabase SQL editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL,
  full_name text NULL,
  avatar_url text NULL,
  bio text NULL,
  created_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
  email text NULL,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create games table
CREATE TABLE public.games (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bgg_id integer NOT NULL,  -- BoardGameGeek ID
  name text NOT NULL,
  year_published integer NULL,
  image_url text NULL,       -- Full-size image
  thumbnail_url text NULL,   -- Smaller preview image
  categories text[] NULL,    -- e.g. ['Strategy', 'Party']
  mechanics text[] NULL,     -- e.g. ['Deckbuilding', 'Drafting']
  designers text[] NULL,     -- Game designers from BGG
  artists text[] NULL,       -- Game artists from BGG
  min_players integer NULL,
  max_players integer NULL,
  playtime_minutes integer NULL,  -- Average or typical
  age integer NULL,          -- Minimum recommended age
  weight numeric(3,2) NULL,  -- Game complexity rating (1.0-5.0)
  publisher text NULL,
  description text NULL,
  summary text NULL,         -- First sentence from description
  rank integer NULL,         -- BGG rank
  rating numeric NULL,       -- BGG average rating
  num_ratings integer NULL,  -- Number of ratings
  cached_at timestamp without time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT games_pkey PRIMARY KEY (id),
  CONSTRAINT games_bgg_id_key UNIQUE (bgg_id)
) TABLESPACE pg_default;

-- Add GIN indexes for fast filtering on categories and mechanics
CREATE INDEX IF NOT EXISTS idx_games_categories ON public.games USING gin (categories);
CREATE INDEX IF NOT EXISTS idx_games_mechanics ON public.games USING gin (mechanics);
CREATE INDEX IF NOT EXISTS idx_games_designers ON public.games USING gin (designers);
CREATE INDEX IF NOT EXISTS idx_games_artists ON public.games USING gin (artists);
CREATE INDEX IF NOT EXISTS idx_games_name ON public.games (name);
CREATE INDEX IF NOT EXISTS idx_games_year ON public.games (year_published);
CREATE INDEX IF NOT EXISTS idx_games_rank ON public.games (rank);
CREATE INDEX IF NOT EXISTS idx_games_age ON public.games (age);
CREATE INDEX IF NOT EXISTS idx_games_weight ON public.games (weight);

-- Create rankings table (changed seen_it to played_it for games)
CREATE TABLE public.rankings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  game_id uuid NULL,
  played_it boolean NULL DEFAULT false,  -- Changed from seen_it to played_it
  ranking integer NULL CHECK (ranking >= 1 AND ranking <= 10),
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  imported_from timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT rankings_pkey PRIMARY KEY (id),
  CONSTRAINT rankings_user_game_unique UNIQUE (user_id, game_id),
  CONSTRAINT rankings_game_id_fkey FOREIGN KEY (game_id) REFERENCES games (id),
  CONSTRAINT rankings_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id)
) TABLESPACE pg_default;

-- Create indexes for rankings
CREATE INDEX IF NOT EXISTS rankings_user_id_idx ON public.rankings (user_id);
CREATE INDEX IF NOT EXISTS rankings_game_id_idx ON public.rankings (game_id);
CREATE INDEX IF NOT EXISTS rankings_ranking_idx ON public.rankings (ranking);

-- Create game lists table (corrected table name)
CREATE TABLE public.game_lists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text NULL,
  is_public boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT game_lists_pkey PRIMARY KEY (id),
  CONSTRAINT game_lists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for game lists
CREATE INDEX IF NOT EXISTS game_lists_user_id_idx ON public.game_lists USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS game_lists_is_public_idx ON public.game_lists USING btree (is_public) TABLESPACE pg_default;

-- Create game list items table (corrected references)
CREATE TABLE public.game_list_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL,
  game_id uuid NOT NULL,
  ranking integer NULL DEFAULT 1,
  played_it boolean NULL DEFAULT false,  -- Changed from seen_it
  score integer NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT game_list_items_pkey PRIMARY KEY (id),
  CONSTRAINT game_list_items_list_id_game_id_key UNIQUE (list_id, game_id),
  CONSTRAINT game_list_items_list_id_ranking_key UNIQUE (list_id, ranking),
  CONSTRAINT game_list_items_list_id_fkey FOREIGN KEY (list_id) REFERENCES game_lists (id) ON DELETE CASCADE,
  CONSTRAINT game_list_items_game_id_fkey FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for game list items
CREATE INDEX IF NOT EXISTS game_list_items_list_id_idx ON public.game_list_items USING btree (list_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS game_list_items_game_id_idx ON public.game_list_items USING btree (game_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS game_list_items_ranking_idx ON public.game_list_items USING btree (list_id, ranking) TABLESPACE pg_default;

-- Create awards table
CREATE TABLE public.awards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  year integer NOT NULL,
  category text NOT NULL DEFAULT 'Best Game',  -- Added category field
  winner_id uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL,
  nominee_ids uuid[] NULL,
  CONSTRAINT awards_pkey PRIMARY KEY (id),
  CONSTRAINT awards_user_id_year_category_unique UNIQUE (user_id, year, category),
  CONSTRAINT awards_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id),
  CONSTRAINT awards_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES games (id)
) TABLESPACE pg_default;

-- Create indexes for awards
CREATE INDEX IF NOT EXISTS awards_user_id_idx ON public.awards (user_id);
CREATE INDEX IF NOT EXISTS awards_year_idx ON public.awards (year);
CREATE INDEX IF NOT EXISTS awards_category_idx ON public.awards (category);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rankings_updated_at BEFORE UPDATE ON rankings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_lists_updated_at BEFORE UPDATE ON game_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_list_items_updated_at BEFORE UPDATE ON game_list_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_awards_updated_at BEFORE UPDATE ON awards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Rankings: Users can only see and edit their own rankings
CREATE POLICY "Users can view own rankings" ON rankings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own rankings" ON rankings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own rankings" ON rankings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own rankings" ON rankings
  FOR DELETE USING (user_id = auth.uid());

-- Game Lists: Users can see public lists and their own lists
CREATE POLICY "Users can view public lists and own lists" ON game_lists
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can insert own lists" ON game_lists
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own lists" ON game_lists
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own lists" ON game_lists
  FOR DELETE USING (user_id = auth.uid());

-- Game List Items: Users can see items in public lists and their own lists
CREATE POLICY "Users can view list items" ON game_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_lists 
      WHERE game_lists.id = game_list_items.list_id 
      AND (game_lists.is_public = true OR game_lists.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own list items" ON game_list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM game_lists 
      WHERE game_lists.id = game_list_items.list_id 
      AND game_lists.user_id = auth.uid()
    )
  );

-- Awards: Users can only see and edit their own awards
CREATE POLICY "Users can view own awards" ON awards
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own awards" ON awards
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own awards" ON awards
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own awards" ON awards
  FOR DELETE USING (user_id = auth.uid());

-- Games table is publicly readable (no RLS needed for viewing)
-- Users cannot insert/update/delete games directly

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
