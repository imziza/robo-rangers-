-- FIX NOTIFICATION LINKS
-- Updates the message notification trigger to include the chatId for direct navigation

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
            '/messages?chatId=' || NEW.sender_id, -- FIXED: Include chatId for auto-selection
            jsonb_build_object('sender_id', NEW.sender_id, 'message_id', NEW.id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
