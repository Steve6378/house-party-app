-- Migration 013: Add permissions column to event_cohosts table

ALTER TABLE event_cohosts ADD COLUMN IF NOT EXISTS permissions VARCHAR DEFAULT 'edit_facts' NOT NULL;

COMMENT ON COLUMN event_cohosts.permissions IS 'Permission level: edit_all, edit_facts, view_only';
