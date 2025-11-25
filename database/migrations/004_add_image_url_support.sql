-- Migration: Add image URL support for events
-- Version: 0.0.1
-- Date: 2025-11-23
-- Note: profile_picture_url already exists in users table (from original schema.sql)

-- ============================================
-- Add cover image URL to events
-- ============================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

COMMENT ON COLUMN events.cover_image_url IS 'URL to event cover image (e.g., from Imgur, Cloudflare R2, etc.)';
