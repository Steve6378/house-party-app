-- Migration: Update event_attendance table for unregistered user support
-- Version: 0.0.1
-- Date: 2025-11-26
-- Note: Run backend/migrate_attendance.py instead if you need to preserve existing data

-- This migration changes the event_attendance table to support inviting unregistered users:
-- - Adds 'id' column as new primary key (instead of composite event_id, user_id)
-- - Makes 'user_id' nullable (for pending invitations to unregistered emails)
-- - Adds unique partial index to prevent duplicate registered user invitations

-- Step 1: Add id column
ALTER TABLE event_attendance
ADD COLUMN IF NOT EXISTS id VARCHAR(255);

-- Step 2: Generate IDs for existing rows (if any)
UPDATE event_attendance
SET id = 'attendance-' || gen_random_uuid()::text
WHERE id IS NULL;

-- Step 3: Drop old composite primary key
ALTER TABLE event_attendance
DROP CONSTRAINT IF EXISTS event_attendance_pkey;

-- Step 4: Make id NOT NULL and set as primary key
ALTER TABLE event_attendance
ALTER COLUMN id SET NOT NULL;

ALTER TABLE event_attendance
ADD PRIMARY KEY (id);

-- Step 5: Make user_id nullable (for unregistered user invitations)
ALTER TABLE event_attendance
ALTER COLUMN user_id DROP NOT NULL;

-- Step 6: Add unique partial index (only for registered users)
CREATE UNIQUE INDEX IF NOT EXISTS event_attendance_unique_idx
ON event_attendance (event_id, user_id)
WHERE user_id IS NOT NULL;

-- Verify changes
COMMENT ON TABLE event_attendance IS 'Event attendance/RSVP tracking. user_id is NULL for pending invitations to unregistered users.';
