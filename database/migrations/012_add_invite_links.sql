-- Migration 012: Add invite_links table for shareable invite URLs
-- Supports both event invitations and group invitations

-- Create invite_links table
CREATE TABLE IF NOT EXISTS public.invite_links (
    id TEXT PRIMARY KEY,
    token VARCHAR(32) UNIQUE NOT NULL,
    link_type VARCHAR(20) NOT NULL,  -- 'event', 'group', 'cohost'
    target_id TEXT NOT NULL,          -- event_id or group_id
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    role VARCHAR(50) DEFAULT 'attendee',  -- 'attendee', 'cohost', 'member', 'admin'
    expires_at TIMESTAMP,             -- NULL = never expires
    max_uses INTEGER,                 -- NULL = unlimited
    use_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_invite_links_token ON public.invite_links(token);
CREATE INDEX IF NOT EXISTS idx_invite_links_target ON public.invite_links(link_type, target_id);
CREATE INDEX IF NOT EXISTS idx_invite_links_active ON public.invite_links(is_active) WHERE is_active = TRUE;

-- Comment
COMMENT ON TABLE public.invite_links IS 'Shareable invite links for events and groups';
