-- IngredEye Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
-- Stores user profiles linked to Supabase Auth
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PINNED_ITEMS TABLE
-- Stores user's pinned scan results (data sourced from Roots by Benda MCP API)
CREATE TABLE pinned_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id TEXT NOT NULL,
  product_name TEXT,
  brand TEXT,
  keyword TEXT,
  risk TEXT,
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  source TEXT,
  e_number TEXT,
  category TEXT,
  safety_score INTEGER,
  iarc_group TEXT,
  pregnancy_safe TEXT,
  children_safe TEXT,
  common_foods TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. COMMUNITY_POSTS TABLE
-- Stores shared ingredient analyses for the community feed
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  product_name TEXT,
  brand TEXT,
  batch_id TEXT,
  items JSONB,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. COMMUNITY_COMMENTS TABLE
-- Stores comments on community posts
CREATE TABLE community_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. COMMUNITY_POST_LIKES TABLE
-- Stores likes on community posts
CREATE TABLE community_post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- INDEXES
CREATE INDEX idx_pinned_items_user_id ON pinned_items(user_id);
CREATE INDEX idx_pinned_items_created_at ON pinned_items(created_at);
CREATE INDEX idx_pinned_items_batch_id ON pinned_items(batch_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX idx_community_post_likes_post_id ON community_post_likes(post_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
-- Users: can only view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow public username lookup" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Pinned Items: users can only access their own items
CREATE POLICY "Users can view own pinned items" ON pinned_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pinned items" ON pinned_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pinned items" ON pinned_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pinned items" ON pinned_items
  FOR DELETE USING (auth.uid() = user_id);

-- Community Posts: viewable by everyone, insertable by authenticated users
CREATE POLICY "Anyone can view posts" ON community_posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert posts" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own posts" ON community_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Community Comments: viewable by everyone, insertable by authenticated users
CREATE POLICY "Anyone can view comments" ON community_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON community_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own comments" ON community_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Community Post Likes: viewable by everyone, toggleable by authenticated users
CREATE POLICY "Anyone can view likes" ON community_post_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON community_post_likes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can unlike" ON community_post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- AUTO-USER CREATION TRIGGER
-- Automatically creates a user profile row upon Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. USER_COMMUNITY_SEEN TABLE
-- Tracks when each user last viewed the community feed
CREATE TABLE user_community_seen (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_community_seen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own seen status" ON user_community_seen
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own seen status" ON user_community_seen
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own seen status" ON user_community_seen
  FOR UPDATE USING (auth.uid() = user_id);
