-- =============================================================================
-- ALETHEON SOCIAL INFRASTRUCTURE DATABASE MIGRATION
-- Run this ONCE in your Supabase SQL Editor
-- =============================================================================

-- 1. NOTIFICATIONS TABLE
-- Stores in-app notifications for users
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('team_invite', 'message', 'artifact_shared', 'system', 'mention')),
    title TEXT NOT NULL,
    body TEXT,
    link TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can insert (for system notifications)
CREATE POLICY "Service can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);


-- 2. TEAM INVITES TABLE
-- Tracks pending, accepted, and declined team invitations
-- =============================================================================
CREATE TABLE IF NOT EXISTS team_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    UNIQUE(team_id, invitee_id) -- One invite per user per team
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_invites_invitee ON team_invites(invitee_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_team_invites_team ON team_invites(team_id);

-- Enable RLS
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Users can see invites they sent or received
CREATE POLICY "Users can view relevant invites" ON team_invites
    FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- Users can create invites (if they're in the team)
CREATE POLICY "Team members can invite" ON team_invites
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_id = team_id AND user_id = auth.uid()
        )
    );

-- Users can respond to invites sent to them
CREATE POLICY "Invitees can respond" ON team_invites
    FOR UPDATE USING (auth.uid() = invitee_id);


-- 3. PROFILE ENHANCEMENTS
-- Add new fields for richer profiles
-- =============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
        ALTER TABLE profiles ADD COLUMN location TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website') THEN
        ALTER TABLE profiles ADD COLUMN website TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'cover_url') THEN
        ALTER TABLE profiles ADD COLUMN cover_url TEXT;
    END IF;
END $$;


-- 4. REALTIME SUBSCRIPTIONS
-- Enable realtime for notifications and messages
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;


-- 5. FUNCTION: Create notification helper
-- Makes it easy to create notifications from triggers or API
-- =============================================================================
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_body TEXT DEFAULT NULL,
    p_link TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, body, link, metadata)
    VALUES (p_user_id, p_type, p_title, p_body, p_link, p_metadata)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. TRIGGER: Auto-notify on team invite
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_on_team_invite() RETURNS TRIGGER AS $$
DECLARE
    team_name TEXT;
    inviter_name TEXT;
BEGIN
    SELECT name INTO team_name FROM groups WHERE id = NEW.team_id;
    SELECT full_name INTO inviter_name FROM profiles WHERE id = NEW.inviter_id;
    
    PERFORM create_notification(
        NEW.invitee_id,
        'team_invite',
        'Research Group Invitation',
        inviter_name || ' invited you to join "' || team_name || '"',
        '/teams',
        jsonb_build_object('team_id', NEW.team_id, 'invite_id', NEW.id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_team_invite_notification ON team_invites;
CREATE TRIGGER trigger_team_invite_notification
    AFTER INSERT ON team_invites
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_team_invite();


-- 7. TRIGGER: Auto-notify on direct message
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_on_direct_message() RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
BEGIN
    -- Only for direct messages (not group)
    IF NEW.recipient_id IS NOT NULL THEN
        SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
        
        PERFORM create_notification(
            NEW.recipient_id,
            'message',
            'New Message',
            COALESCE(sender_name, 'A researcher') || ': ' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
            '/messages?chatId=' || NEW.sender_id,
            jsonb_build_object('sender_id', NEW.sender_id, 'message_id', NEW.id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_message_notification ON messages;
CREATE TRIGGER trigger_message_notification
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_direct_message();


-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
