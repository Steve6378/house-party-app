-- Migration 010: Add face_encodings column to event_photos
-- Missing from migration 007

ALTER TABLE event_photos ADD COLUMN IF NOT EXISTS face_encodings TEXT;

DO $$
BEGIN
    RAISE NOTICE 'Migration 010 completed: Added face_encodings to event_photos';
END $$;
