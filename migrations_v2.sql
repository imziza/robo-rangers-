-- Migration V2: Team Invitations and Notifications

CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES public.profiles(id) NOT NULL,
  invitee_id UUID REFERENCES public.profiles(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, invitee_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for team_invites
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see invites for them." ON public.team_invites
  FOR SELECT TO authenticated USING (invitee_id = auth.uid() OR inviter_id = auth.uid());
CREATE POLICY "Invitors can create invites." ON public.team_invites
  FOR INSERT TO authenticated WITH CHECK (inviter_id = auth.uid());

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own notifications." ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications." ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
