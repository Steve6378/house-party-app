-- House Party RAG Database Schema
-- PostgreSQL 15 with pgvector extension

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
    group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Group membership
CREATE TABLE group_members (
    group_id UUID REFERENCES groups(group_id),
    user_id UUID REFERENCES users(user_id),
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- Chat messages
CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(group_id),
    user_id UUID REFERENCES users(user_id),
    content TEXT NOT NULL,
    message_embedding vector(1536),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User facts extracted from conversations
CREATE TABLE user_facts (
    fact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    fact_text TEXT NOT NULL,
    fact_embedding vector(1536),
    confidence FLOAT,
    source_message_id UUID REFERENCES messages(message_id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Group facts and preferences
CREATE TABLE group_facts (
    fact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(group_id),
    fact_text TEXT NOT NULL,
    fact_embedding vector(1536),
    confidence FLOAT,
    source_message_id UUID REFERENCES messages(message_id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Past events for learning
CREATE TABLE events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(group_id),
    event_name TEXT NOT NULL,
    event_date DATE,
    event_type TEXT,
    venue_name TEXT,
    feedback TEXT,
    event_embedding vector(1536),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for vector similarity search
CREATE INDEX ON user_facts USING ivfflat (fact_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON group_facts USING ivfflat (fact_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON messages USING ivfflat (message_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON events USING ivfflat (event_embedding vector_cosine_ops) WITH (lists = 100);

-- Create regular indexes for faster lookups
CREATE INDEX idx_messages_group_id ON messages(group_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_user_facts_user_id ON user_facts(user_id);
CREATE INDEX idx_group_facts_group_id ON group_facts(group_id);
