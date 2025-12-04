-- Migration: Add missing columns to production database
-- Run this on Railway PostgreSQL to fix the schema

-- Add permissions column to event_cohosts table
ALTER TABLE event_cohosts ADD COLUMN IF NOT EXISTS permissions VARCHAR DEFAULT 'edit_facts' NOT NULL;

-- Create invite_links table if it doesn't exist
CREATE TABLE IF NOT EXISTS invite_links (
    id VARCHAR PRIMARY KEY,
    token VARCHAR(32) UNIQUE NOT NULL,
    link_type VARCHAR(20) NOT NULL,
    target_id VARCHAR NOT NULL,
    created_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    role VARCHAR(50) DEFAULT 'attendee',
    expires_at TIMESTAMP,
    max_uses INTEGER,
    use_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_invite_links_token ON invite_links(token);
