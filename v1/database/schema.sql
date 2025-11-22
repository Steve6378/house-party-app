-- House Party App - Database Schema
-- PostgreSQL 15+ with pgvector extension

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for embedding similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),  -- NULL if using Google OAuth only
    google_id VARCHAR(255) UNIQUE,  -- Google user ID
    name VARCHAR(255) NOT NULL,
    profile_picture_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- ============================================
-- GROUPS (Optional, for recurring events)
-- ============================================

CREATE TABLE groups (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_groups_created_by ON groups(created_by);

-- Group membership
CREATE TABLE group_members (
    group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',  -- 'member' or 'admin'
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- Group-level persistent preferences (across all events in this group)
CREATE SEQUENCE IF NOT EXISTS group_preferences_id_seq;
CREATE TABLE group_preferences (
    id TEXT PRIMARY KEY DEFAULT ('gpr-' || nextval('group_preferences_id_seq')),
    group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    dietary_restrictions TEXT[],  -- e.g., ['vegetarian', 'gluten-free']
    budget_max DECIMAL(10, 2),  -- Max budget per person
    venue_preferences JSONB,  -- e.g., {"indoor": true, "outdoor": false, "location_area": "downtown"}
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_preferences_group_id ON group_preferences(group_id);
CREATE INDEX idx_group_preferences_user_id ON group_preferences(user_id);

-- ============================================
-- EVENTS
-- ============================================

CREATE TABLE events (
    id TEXT PRIMARY KEY,
    group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,  -- NULL = one-off party
    name VARCHAR(255) NOT NULL,
    event_type VARCHAR(50),  -- 'tight_knit', 'big_party', 'frat_party', etc.
    main_host_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    date DATE,
    time TIME,
    address TEXT,
    venue_name VARCHAR(255),
    budget_per_person DECIMAL(10, 2),
    expected_guests INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_main_host_id ON events(main_host_id);
CREATE INDEX idx_events_group_id ON events(group_id);
CREATE INDEX idx_events_date ON events(date);

-- Event co-hosts
CREATE TABLE event_cohosts (
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

CREATE INDEX idx_event_cohosts_user_id ON event_cohosts(user_id);

-- ============================================
-- GROUND TRUTH (Host-set facts)
-- ============================================

CREATE TABLE ground_truth_facts (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,  -- e.g., 'address', 'parking', 'dress_code'
    value TEXT NOT NULL,
    category VARCHAR(100),  -- e.g., 'logistics', 'food', 'attire'
    importance VARCHAR(50) DEFAULT 'medium',  -- 'critical', 'high', 'medium', 'low'
    keywords TEXT[],  -- For keyword matching, e.g., ['address', 'location', 'where']
    embedding vector(1536),  -- OpenAI embedding for semantic search
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, key)
);

CREATE INDEX idx_ground_truth_event_id ON ground_truth_facts(event_id);
CREATE INDEX idx_ground_truth_key ON ground_truth_facts(key);

-- Vector similarity index for semantic search
CREATE INDEX idx_ground_truth_embedding ON ground_truth_facts
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Change log for transparency (who changed what, when)
CREATE SEQUENCE IF NOT EXISTS ground_truth_changes_id_seq;
CREATE TABLE ground_truth_changes (
    id TEXT PRIMARY KEY DEFAULT ('gtc-' || nextval('ground_truth_changes_id_seq')),
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    fact_id TEXT REFERENCES ground_truth_facts(id) ON DELETE SET NULL,
    fact_key VARCHAR(255),  -- Store key even if fact is deleted
    changed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    change_type VARCHAR(50),  -- 'created', 'updated', 'deleted'
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ground_truth_changes_event_id ON ground_truth_changes(event_id);
CREATE INDEX idx_ground_truth_changes_changed_at ON ground_truth_changes(changed_at DESC);

-- ============================================
-- GUEST PREFERENCES (Extracted from chat)
-- ============================================

CREATE SEQUENCE IF NOT EXISTS guest_preferences_id_seq;
CREATE TABLE guest_preferences (
    id TEXT PRIMARY KEY DEFAULT ('gp-' || nextval('guest_preferences_id_seq')),
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    dietary_restrictions TEXT[],
    budget_preference DECIMAL(10, 2),
    venue_preferences JSONB,
    other_notes TEXT,
    extracted_from_message_id TEXT,  -- Reference to message this came from
    confidence FLOAT,  -- AI confidence score (0.0 to 1.0)
    manually_confirmed BOOLEAN DEFAULT FALSE,  -- Host can confirm/override
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_guest_preferences_event_id ON guest_preferences(event_id);
CREATE INDEX idx_guest_preferences_user_id ON guest_preferences(user_id);

-- ============================================
-- ESCALATED QUESTIONS (Bot couldn't answer)
-- ============================================

CREATE TABLE escalated_questions (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    asked_by TEXT REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    context TEXT,  -- Optional: Previous messages for context
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    resolution TEXT,  -- Host's answer
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE INDEX idx_escalated_questions_event_id ON escalated_questions(event_id);
CREATE INDEX idx_escalated_questions_resolved ON escalated_questions(resolved);

-- ============================================
-- AI SUGGESTIONS (Generated from chat observations)
-- ============================================

CREATE SEQUENCE IF NOT EXISTS suggestions_id_seq;
CREATE TABLE suggestions (
    id TEXT PRIMARY KEY DEFAULT ('sug-' || nextval('suggestions_id_seq')),
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    suggestion_type VARCHAR(100),  -- 'new_faq', 'todo_item', 'preference_conflict', 'venue_idea'
    suggestion_text TEXT NOT NULL,
    supporting_evidence JSONB,  -- e.g., {"guest_count": 3, "message_ids": [...]}
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'accepted', 'dismissed'
    created_by_ai BOOLEAN DEFAULT TRUE,
    reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP
);

CREATE INDEX idx_suggestions_event_id ON suggestions(event_id);
CREATE INDEX idx_suggestions_status ON suggestions(status);

-- ============================================
-- TO-DO LISTS
-- ============================================

CREATE SEQUENCE IF NOT EXISTS todos_id_seq;
CREATE TABLE todos (
    id TEXT PRIMARY KEY DEFAULT ('todo-' || nextval('todos_id_seq')),
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,  -- Can assign to co-host
    position INT,  -- For ordering
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_todos_event_id ON todos(event_id);
CREATE INDEX idx_todos_assigned_to ON todos(assigned_to);
CREATE INDEX idx_todos_completed ON todos(completed);

-- ============================================
-- MESSAGES (Group Chat)
-- ============================================

CREATE TABLE messages (
    id TEXT PRIMARY KEY DEFAULT ('msg-' || gen_random_uuid()),
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    sender_id TEXT REFERENCES users(id) ON DELETE SET NULL,  -- NULL for system/assistant messages
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'user' NOT NULL,  -- 'user', 'system', 'assistant'
    is_edited BOOLEAN DEFAULT FALSE NOT NULL,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,  -- Soft delete
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_messages_event_id ON messages(event_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_deleted ON messages(is_deleted) WHERE is_deleted = FALSE;

-- ============================================
-- POLLS (Group Chat Feature)
-- ============================================

CREATE TABLE polls (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,  -- e.g., ["Pizza", "Thai", "Mexican"]
    created_at TIMESTAMP DEFAULT NOW(),
    closes_at TIMESTAMP  -- Optional: poll expiration
);

CREATE INDEX idx_polls_event_id ON polls(event_id);

CREATE TABLE poll_votes (
    poll_id TEXT REFERENCES polls(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    option_index INT NOT NULL,  -- Index into polls.options array
    voted_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (poll_id, user_id)
);

CREATE INDEX idx_poll_votes_poll_id ON polls(event_id);

-- ============================================
-- AUDIT LOG (Optional, for debugging)
-- ============================================

CREATE TABLE audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    event_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,  -- e.g., 'created_event', 'edited_ground_truth'
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_event_id ON audit_log(event_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_preferences_updated_at BEFORE UPDATE ON group_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ground_truth_facts_updated_at BEFORE UPDATE ON ground_truth_facts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guest_preferences_updated_at BEFORE UPDATE ON guest_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE users IS 'User accounts (Google OAuth or email/password)';
COMMENT ON TABLE groups IS 'Optional groups for recurring events (e.g., "USC Roommates")';
COMMENT ON TABLE group_members IS 'Membership in groups';
COMMENT ON TABLE group_preferences IS 'Persistent preferences across all events in a group';
COMMENT ON TABLE events IS 'Individual events (can belong to a group or be standalone)';
COMMENT ON TABLE event_cohosts IS 'Co-hosts for an event (same permissions as main host)';
COMMENT ON TABLE ground_truth_facts IS 'Host-set facts (address, parking, etc.) with embeddings for semantic search';
COMMENT ON TABLE ground_truth_changes IS 'Audit log of ground truth changes (transparency for multi-host)';
COMMENT ON TABLE guest_preferences IS 'Preferences extracted from group chat (AI-generated)';
COMMENT ON TABLE escalated_questions IS 'Questions bot couldn''t answer, sent to host';
COMMENT ON TABLE suggestions IS 'AI-generated suggestions based on chat observations';
COMMENT ON TABLE todos IS 'To-do lists for hosts (prefilled based on event type)';
COMMENT ON TABLE messages IS 'Group chat messages';
COMMENT ON TABLE polls IS 'Polls created in group chat';
COMMENT ON TABLE poll_votes IS 'Votes in polls';
COMMENT ON TABLE audit_log IS 'Optional audit log for all actions';

-- ============================================
-- INDEXES SUMMARY
-- ============================================

-- Total indexes created: ~30
-- Most critical:
-- - idx_ground_truth_embedding (vector similarity search)
-- - idx_messages_event_id + created_at (chat history)
-- - idx_escalated_questions_event_id + resolved (host dashboard)
-- - All foreign key indexes (for joins)

-- ============================================
-- INITIAL DATA (Optional)
-- ============================================

-- Create a default "AI Bot" user for system messages
INSERT INTO users (id, email, name)
VALUES ('ai-bot-system-user', 'bot@houseparty.app', 'AI Assistant')
ON CONFLICT DO NOTHING;

COMMENT ON DATABASE postgres IS 'House Party App - Event planning with AI assistance';
