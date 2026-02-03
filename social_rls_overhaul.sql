-- ==========================================
-- ALETHEON SOCIAL INFRASTRUCTURE OVERHAUL
-- Fixes RLS infinite recursion and standardizes access
-- ==========================================

-- 1. Create Security Definer functions to break recursion
-- These run with bypassRLS privileges to allow membership checks
CREATE OR REPLACE FUNCTION public.check_is_group_member(gid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = gid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_group_ids()
RETURNS TABLE (g_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT group_id FROM public.group_members WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RESET POLICIES FOR 'GROUPS'
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Groups are viewable by their members." ON public.groups;
DROP POLICY IF EXISTS "Users can create groups." ON public.groups;
DROP POLICY IF EXISTS "Users can update their own groups." ON public.groups;

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Groups: Select" ON public.groups
    FOR SELECT TO authenticated
    USING (created_by = auth.uid() OR public.check_is_group_member(id));

CREATE POLICY "Groups: Insert" ON public.groups
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Groups: Update" ON public.groups
    FOR UPDATE TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Groups: Delete" ON public.groups
    FOR DELETE TO authenticated
    USING (auth.uid() = created_by);


-- 3. RESET POLICIES FOR 'GROUP_MEMBERS'
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Memberships are viewable by members." ON public.group_members;
DROP POLICY IF EXISTS "Memberships are viewable by group members." ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups/be added." ON public.group_members;

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Break recursion here by allowing users to see their own entries,
-- and using the bridge function for others.
CREATE POLICY "GroupMembers: Select" ON public.group_members
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.check_is_group_member(group_id));

CREATE POLICY "GroupMembers: Insert" ON public.group_members
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Allow joining a group if you're the one being added (for testing/open groups)
        -- Or allow if the group owner is the one adding you
        user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid()
        )
    );

CREATE POLICY "GroupMembers: Delete" ON public.group_members
    FOR DELETE TO authenticated
    USING (
        user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid()
        )
    );

-- 4. TEAM INVITES FIX
-- Ensure notifications are triggered and status can be updated
CREATE POLICY "TeamInvites: Update" ON public.team_invites
    FOR UPDATE TO authenticated
    USING (invitee_id = auth.uid())
    WITH CHECK (status IN ('accepted', 'declined'));

-- 5. MESSAGES FIX
-- Ensure messages can be seen in groups
DROP POLICY IF EXISTS "Users can see group messages in their groups." ON public.messages;
CREATE POLICY "Messages: Group Access" ON public.messages
    FOR SELECT TO authenticated
    USING (
        group_id IS NOT NULL AND public.check_is_group_member(group_id)
    );
