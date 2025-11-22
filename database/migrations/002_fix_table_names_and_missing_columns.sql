-- Migration: Fix table name mismatches and add missing columns
-- Version: 0.0.1
-- Date: 2025-11-19

-- ============================================
-- Fix table name mismatches
-- ============================================

-- Rename group_members to group_memberships (to match ORM)
ALTER TABLE IF EXISTS group_members RENAME TO group_memberships;

-- Rename ground_truth_changes to ground_truth_change_logs (to match ORM)
ALTER TABLE IF EXISTS ground_truth_changes RENAME TO ground_truth_change_logs;

-- ============================================
-- Create missing event_attendance table
-- ============================================

CREATE TABLE IF NOT EXISTS event_attendance (
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    rsvp_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    plus_ones INTEGER DEFAULT 0,
    rsvp_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_user_id ON event_attendance(user_id);

-- ============================================
-- Add missing columns to users table
-- ============================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- ============================================
-- Add missing columns to suggestions table
-- ============================================

ALTER TABLE suggestions
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  ADD COLUMN IF NOT EXISTS dismissed_reason TEXT;

-- Update existing suggestions to have default status
UPDATE suggestions SET status = 'pending' WHERE status IS NULL;

-- ============================================
-- Add missing columns to escalated_questions table
-- ============================================

ALTER TABLE escalated_questions
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;

-- ============================================
-- Add missing created_from_suggestion_id to todos
-- ============================================

ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS created_from_suggestion_id TEXT REFERENCES suggestions(id);

-- ============================================
-- Add missing created_fact_id to escalated_questions
-- ============================================

ALTER TABLE escalated_questions
  ADD COLUMN IF NOT EXISTS created_fact_id TEXT REFERENCES ground_truth_facts(id);

-- ============================================
-- Add missing created_todo_id to suggestions
-- ============================================

ALTER TABLE suggestions
  ADD COLUMN IF NOT EXISTS created_todo_id TEXT REFERENCES todos(id);
