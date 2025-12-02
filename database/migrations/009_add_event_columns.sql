-- Migration 009: Add event columns from PR #16
-- Topics, capacity, RSVP, online events, payments, location, cover images

-- Topics
ALTER TABLE events ADD COLUMN IF NOT EXISTS topics TEXT;

-- Capacity and RSVP
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_capacity INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS rsvp_deadline TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE NOT NULL;

-- Archive
ALTER TABLE events ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

-- Online events
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS online_link TEXT;

-- Payment
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_price NUMERIC(10, 2);

-- Location coordinates
ALTER TABLE events ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE events ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- Cover images
ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_image_path TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_image_type VARCHAR(20) DEFAULT 'none';

DO $$
BEGIN
    RAISE NOTICE 'Migration 009 completed: Added event columns';
END $$;
