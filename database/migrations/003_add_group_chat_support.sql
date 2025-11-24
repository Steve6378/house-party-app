-- Migration: Add group-level general chat support
-- Version: 0.0.1
-- Date: 2025-11-23

-- ============================================
-- Add group_id to messages for general chat
-- ============================================

-- Make event_id nullable (messages can be in group general chat OR event chat)
ALTER TABLE messages
  ALTER COLUMN event_id DROP NOT NULL;

-- Add group_id column
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS group_id TEXT REFERENCES groups(id) ON DELETE CASCADE;

-- Add constraint: must have either event_id OR group_id (not both, not neither)
-- This ensures messages belong to EITHER a group general chat OR an event chat
ALTER TABLE messages
  ADD CONSTRAINT messages_event_or_group_check
  CHECK (
    (event_id IS NOT NULL AND group_id IS NULL) OR
    (event_id IS NULL AND group_id IS NOT NULL)
  );

-- Add index for faster group message queries
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);

-- ============================================
-- Comments for clarity
-- ============================================

COMMENT ON COLUMN messages.group_id IS 'Group general chat (if event_id is NULL)';
COMMENT ON COLUMN messages.event_id IS 'Event-specific chat (if group_id is NULL)';
COMMENT ON CONSTRAINT messages_event_or_group_check ON messages IS 'Ensures message belongs to either group general chat or event chat, not both';
