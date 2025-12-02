-- Migration 011: Fix audit_log FK and poll_votes index
-- Fixes:
-- 1. audit_log.event_id references users(id) instead of events(id)
-- 2. poll_votes index created on wrong table (polls instead of poll_votes)

-- Fix audit_log foreign key (drop old constraint, add correct one)
DO $$
BEGIN
    -- Drop the incorrect FK if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'audit_log_event_id_fkey'
        AND table_name = 'audit_log'
    ) THEN
        ALTER TABLE audit_log DROP CONSTRAINT audit_log_event_id_fkey;
    END IF;

    -- Add correct FK to events table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'audit_log_event_id_events_fkey'
        AND table_name = 'audit_log'
    ) THEN
        ALTER TABLE audit_log
        ADD CONSTRAINT audit_log_event_id_events_fkey
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Fix poll_votes index (drop wrong one, create correct one)
DO $$
BEGIN
    -- Drop the incorrectly named/placed index if exists
    DROP INDEX IF EXISTS idx_poll_votes_poll_id;

    -- Create correct index on poll_votes table
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_poll_votes_poll_id_correct'
    ) THEN
        CREATE INDEX idx_poll_votes_poll_id_correct ON poll_votes(poll_id);
    END IF;
END $$;
