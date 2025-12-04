-- Migration 013: Add missing columns to event_cohosts table

ALTER TABLE event_cohosts ADD COLUMN IF NOT EXISTS permissions VARCHAR DEFAULT 'edit_facts' NOT NULL;
ALTER TABLE event_cohosts ADD COLUMN IF NOT EXISTS added_at TIMESTAMP;
ALTER TABLE event_cohosts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE event_cohosts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
