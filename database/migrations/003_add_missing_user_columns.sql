-- Migration: Add missing columns to users table
-- Created: 2025-11-22
-- Reason: User model expects phone, email_verified, status, deleted_at

-- Add phone column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add email_verified column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE NOT NULL;

-- Add status column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' NOT NULL;

-- Add deleted_at column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;
