-- ALETHEON SOCIAL INFRASTRUCTURE REPAIR
-- Run this in your Supabase SQL Editor to fix Team Creation and Search

-- 1. FIX PROFILES TABLE
-- Ensure all scholarly record columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 2. FIX RLS FOR TEAMS (GROUPS)
-- Allow researchers to form coalitions
DROP POLICY IF EXISTS "Users can create groups." ON public.groups;
CREATE POLICY "Users can create groups." ON public.groups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own groups." ON public.groups;
CREATE POLICY "Users can update their own groups." ON public.groups
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- 3. FIX RLS FOR GROUP MEMBERS
-- Allow members to join/be added to groups
DROP POLICY IF EXISTS "Users can join groups/be added." ON public.group_members;
CREATE POLICY "Users can join groups/be added." ON public.group_members
  FOR INSERT TO authenticated WITH CHECK (true);

-- 4. TEAM INVITES SYSTEM
CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, invitee_id)
);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own invites." ON public.team_invites;
CREATE POLICY "Users can see their own invites." ON public.team_invites
  FOR SELECT TO authenticated USING (inviter_id = auth.uid() OR invitee_id = auth.uid());

DROP POLICY IF EXISTS "Users can send invites." ON public.team_invites;
CREATE POLICY "Users can send invites." ON public.team_invites
  FOR INSERT TO authenticated WITH CHECK (inviter_id = auth.uid());

-- 5. REALTIME ENABLEMENT
-- Ensure the broadcast system is active for social tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END$$;
