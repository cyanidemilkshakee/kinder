-- Kinder Schema v2 - Run this in Supabase SQL Editor

-- ──────────────────────────────────────────────────────────────
-- 1. Add new columns to profiles
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS interest_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hookup_opt_in_changed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS super_likes_today int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS super_likes_reset_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT now();

-- ──────────────────────────────────────────────────────────────
-- 2. BLOCKS table
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  blocker_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  blocked_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own blocks" ON blocks 
  FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own blocks" ON blocks 
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own blocks" ON blocks 
  FOR DELETE USING (auth.uid() = blocker_id);

-- ──────────────────────────────────────────────────────────────
-- 3. SUPER LIKES table
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.super_likes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE public.super_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view super likes involving them" ON super_likes 
  FOR SELECT USING (auth.uid() = receiver_id OR auth.uid() = sender_id);
CREATE POLICY IF NOT EXISTS "Users can insert super likes" ON super_likes 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ──────────────────────────────────────────────────────────────
-- 4. Fix RLS: allow users to see who liked them (for Likes page)
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own swipes" ON swipes;
CREATE POLICY "Users can view swipes they made" ON swipes 
  FOR SELECT USING (auth.uid() = swiper_id);
CREATE POLICY "Users can view right-swipes on them" ON swipes 
  FOR SELECT USING (auth.uid() = swiped_id AND is_right_swipe = true);

-- ──────────────────────────────────────────────────────────────
-- 5. Update reports RLS so users can also view reports on them
--    (needed for moderation visibility)
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
CREATE POLICY "Users can view their submitted reports" ON reports 
  FOR SELECT USING (reporter_id = auth.uid());
