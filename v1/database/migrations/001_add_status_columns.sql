-- Migration: Add status tracking columns to events and users
-- Version: 0.0.1
-- Date: 2025-11-19

-- Add columns to events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' NOT NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'private' NOT NULL,
  ADD COLUMN IF NOT EXISTS max_capacity INTEGER,
  ADD COLUMN IF NOT EXISTS rsvp_deadline TIMESTAMP,
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE NOT NULL;

-- Add columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' NOT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE NOT NULL;

-- Add columns to messages table
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add columns to groups table
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT TRUE NOT NULL;

-- Add event_cohosts table (new table for co-hosts)
CREATE TABLE IF NOT EXISTS event_cohosts (
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    permissions VARCHAR(50) DEFAULT 'edit_facts' NOT NULL,
    added_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    PRIMARY KEY (event_id, user_id)
);

-- Update existing events to have default status/visibility
UPDATE events SET status = 'active' WHERE status IS NULL;
UPDATE events SET visibility = 'private' WHERE visibility IS NULL;
UPDATE events SET requires_approval = FALSE WHERE requires_approval IS NULL;

-- Update existing users to have default status
UPDATE users SET status = 'active' WHERE status IS NULL;
UPDATE users SET email_verified = FALSE WHERE email_verified IS NULL;

-- Update existing messages
UPDATE messages SET is_edited = FALSE WHERE is_edited IS NULL;
UPDATE messages SET is_deleted = FALSE WHERE is_deleted IS NULL;

-- Update existing groups
UPDATE groups SET is_private = TRUE WHERE is_private IS NULL;
