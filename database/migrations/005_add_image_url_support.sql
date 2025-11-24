-- Migration: Add image URL support for users and events
-- Version: 0.0.1
-- Date: 2025-11-23

-- ============================================
-- Add profile picture URL to users
-- ============================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

COMMENT ON COLUMN users.profile_picture_url IS 'URL to user profile picture (e.g., from Imgur, Cloudflare R2, etc.)';

-- ============================================
-- Add cover image URL to events
-- ============================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

COMMENT ON COLUMN events.cover_image_url IS 'URL to event cover image (e.g., from Imgur, Cloudflare R2, etc.)';
