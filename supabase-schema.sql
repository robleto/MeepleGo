-- MeepleGo Database Schema for Supabase
-- Run this in your Supabase SQL editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table (general list for all users)
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  year_published INTEGER,
  min_players INTEGER,
  max_players INTEGER,
  playing_time INTEGER, -- in minutes
  min_age INTEGER,
  designer TEXT,
  publisher TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  bgg_id INTEGER UNIQUE, -- BoardGameGeek ID
  categories TEXT[] DEFAULT '{}',
  mechanics TEXT[] DEFAULT '{}',
  average_rating DECIMAL(3,2),
  complexity DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (individual users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  favorite_genres TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rankings table (links profile to game with rating and played status)
CREATE TABLE rankings (
  id SERIAL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  played BOOLEAN DEFAULT FALSE,
  notes TEXT,
  date_played TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, game_id)
);

-- Lists table (user-created lists)
CREATE TABLE lists (
  id SERIAL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- List items table (games inside lists, with optional notes or order)
CREATE TABLE list_items (
  id SERIAL PRIMARY KEY,
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_id, game_id)
);

-- Awards table (based on user's rankings, focused on Best Of by year)
CREATE TABLE awards (
  id SERIAL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  nominees INTEGER[] DEFAULT '{}', -- Array of game IDs
  winner_id INTEGER REFERENCES games(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, year, category)
);

-- Indexes for better performance
CREATE INDEX idx_rankings_profile_id ON rankings(profile_id);
CREATE INDEX idx_rankings_game_id ON rankings(game_id);
CREATE INDEX idx_rankings_rating ON rankings(rating);
CREATE INDEX idx_rankings_played ON rankings(played);

CREATE INDEX idx_games_name ON games(name);
CREATE INDEX idx_games_year ON games(year_published);
CREATE INDEX idx_games_bgg_id ON games(bgg_id);

CREATE INDEX idx_lists_profile_id ON lists(profile_id);
CREATE INDEX idx_list_items_list_id ON list_items(list_id);
CREATE INDEX idx_list_items_game_id ON list_items(game_id);

CREATE INDEX idx_awards_profile_id ON awards(profile_id);
CREATE INDEX idx_awards_year ON awards(year);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rankings_updated_at BEFORE UPDATE ON rankings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_list_items_updated_at BEFORE UPDATE ON list_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_awards_updated_at BEFORE UPDATE ON awards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for development
INSERT INTO games (name, description, year_published, min_players, max_players, playing_time, designer, publisher, categories, mechanics, average_rating, complexity) VALUES
('Wingspan', 'You are bird enthusiasts—researchers, bird watchers, ornithologists, and collectors—seeking to discover and attract the best birds to your network of wildlife preserves.', 2019, 1, 5, 70, 'Elizabeth Hargrave', 'Stonemaier Games', ARRAY['Animals', 'Cards'], ARRAY['Engine Building', 'Card Drafting'], 8.1, 2.4),
('Azul', 'Introduced by the Moors, azulejos (originally white and blue ceramic tiles) were fully embraced by the Portuguese.', 2017, 2, 4, 45, 'Michael Kiesling', 'Plan B Games', ARRAY['Abstract Strategy'], ARRAY['Pattern Building', 'Tile Placement'], 7.8, 1.8),
('Gloomhaven', 'Gloomhaven is a game of Euro-inspired tactical combat in a persistent world of shifting motives.', 2017, 1, 4, 120, 'Isaac Childres', 'Cephalofair Games', ARRAY['Adventure', 'Fantasy'], ARRAY['Campaign', 'Cooperative Game'], 8.7, 3.9);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
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
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own rankings" ON rankings
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own rankings" ON rankings
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete own rankings" ON rankings
  FOR DELETE USING (profile_id = auth.uid());

-- Lists: Users can see public lists and their own lists
CREATE POLICY "Users can view public lists and own lists" ON lists
  FOR SELECT USING (is_public = true OR profile_id = auth.uid());

CREATE POLICY "Users can insert own lists" ON lists
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own lists" ON lists
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete own lists" ON lists
  FOR DELETE USING (profile_id = auth.uid());

-- List items: Users can see items in public lists and their own lists
CREATE POLICY "Users can view list items" ON list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = list_items.list_id 
      AND (lists.is_public = true OR lists.profile_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own list items" ON list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = list_items.list_id 
      AND lists.profile_id = auth.uid()
    )
  );

-- Awards: Users can only see and edit their own awards
CREATE POLICY "Users can view own awards" ON awards
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own awards" ON awards
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own awards" ON awards
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete own awards" ON awards
  FOR DELETE USING (profile_id = auth.uid());

-- Games table is publicly readable (no RLS needed)
-- But you might want to add policies if you plan to allow user-generated games
