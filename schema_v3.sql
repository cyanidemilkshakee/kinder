-- ================================================================
-- Kinder Schema v3 — Additive migration (safe to re-run)
-- Run this in Supabase SQL Editor after schema.sql
-- ================================================================


-- ──────────────────────────────────────────────────────────────
-- 1. Profiles — extra columns
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth          date,
  ADD COLUMN IF NOT EXISTS role                   text DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS ban_expires_at         timestamp with time zone,
  ADD COLUMN IF NOT EXISTS is_suspended           boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS interest_tags          text[],
  ADD COLUMN IF NOT EXISTS super_likes_today      int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS super_likes_reset_at   timestamp with time zone DEFAULT now(),
  -- Multi-intent array (fallback to legacy single column)
  ADD COLUMN IF NOT EXISTS relationship_intents   text[] DEFAULT ARRAY['friendship'::text];

-- Backfill relationship_intents from legacy column for existing rows
UPDATE public.profiles
  SET relationship_intents = ARRAY[relationship_intent]
  WHERE relationship_intents IS NULL
     OR relationship_intents = '{}';


-- ──────────────────────────────────────────────────────────────
-- 2. Confessions — recipient-approval column
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.confessions
  ADD COLUMN IF NOT EXISTS is_revealed boolean DEFAULT false;

-- RLS: allow recipients to flip is_revealed on their own confessions
-- NOTE: CREATE POLICY does not support IF NOT EXISTS — use DROP + CREATE
DROP POLICY IF EXISTS "Users can update their received confessions" ON public.confessions;
CREATE POLICY "Users can update their received confessions"
  ON public.confessions
  FOR UPDATE
  USING (
    receiver_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    receiver_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );


-- ──────────────────────────────────────────────────────────────
-- 3. Super Likes table
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.super_likes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id   uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  created_at  timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (sender_id, receiver_id)
);

ALTER TABLE public.super_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view super likes they sent"     ON public.super_likes;
DROP POLICY IF EXISTS "Users can view super likes they received" ON public.super_likes;
DROP POLICY IF EXISTS "Users can insert their own super likes"   ON public.super_likes;

CREATE POLICY "Users can view super likes they sent"
  ON public.super_likes FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can view super likes they received"
  ON public.super_likes FOR SELECT
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can insert their own super likes"
  ON public.super_likes FOR INSERT
  WITH CHECK (auth.uid() = sender_id);


-- ──────────────────────────────────────────────────────────────
-- 4. Blocks table
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blocks (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id  uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  blocked_id  uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  created_at  timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view blocks they created" ON public.blocks;
DROP POLICY IF EXISTS "Users can insert their own blocks"  ON public.blocks;
DROP POLICY IF EXISTS "Users can delete their own blocks"  ON public.blocks;

CREATE POLICY "Users can view blocks they created"
  ON public.blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can insert their own blocks"
  ON public.blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON public.blocks FOR DELETE
  USING (auth.uid() = blocker_id);


-- ──────────────────────────────────────────────────────────────
-- 5. Support Messages table (Contact / Bug report form)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_messages (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES public.profiles ON DELETE SET NULL,
  name       text,
  message    text NOT NULL,
  type       text DEFAULT 'contact' CHECK (type IN ('contact', 'bug')),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can view their own support messages"   ON public.support_messages;

CREATE POLICY "Users can insert their own support messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own support messages"
  ON public.support_messages FOR SELECT
  USING (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────────
-- 6. Moderation — report threshold trigger
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_report_thresholds()
RETURNS trigger AS $$
DECLARE
  report_count INT;
BEGIN
  SELECT count(*) INTO report_count
  FROM public.reports
  WHERE reported_id = NEW.reported_id
    AND status != 'action_taken';

  -- 3 reports → 7-day restriction
  IF report_count = 3 THEN
    UPDATE public.profiles
      SET ban_expires_at = now() + interval '7 days'
      WHERE id = NEW.reported_id;
  END IF;

  -- 5+ reports → permanent suspension (manual review to lift)
  IF report_count >= 5 THEN
    UPDATE public.profiles
      SET is_suspended = true,
          ban_expires_at = null
      WHERE id = NEW.reported_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS evaluate_report_thresholds ON public.reports;

CREATE TRIGGER evaluate_report_thresholds
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE PROCEDURE public.handle_report_thresholds();
