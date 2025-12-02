-- Migration 008: Add user profile columns
-- Added by PR #16 for face recognition and location features

-- Profile columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS age VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS face_encoding TEXT;

-- Location columns (for directions feature)
ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Verify columns were added
DO $$
BEGIN
    RAISE NOTICE 'Migration 008 completed: Added user profile and location columns';
END $$;
