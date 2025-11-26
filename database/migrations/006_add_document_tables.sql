-- Migration: Add event documents and questionnaire tables
-- Version: 0.0.1
-- Date: 2025-11-26
-- Purpose: Support document uploads and host questionnaires for AI context

-- ============================================
-- Event Documents Table
-- ============================================

CREATE TABLE IF NOT EXISTS event_documents (
    id VARCHAR(255) PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    uploaded_by VARCHAR(255) NOT NULL REFERENCES users(id),

    -- File metadata
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,

    -- Extracted content for AI
    extracted_text TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for event_documents
CREATE INDEX IF NOT EXISTS idx_event_documents_event_id ON event_documents(event_id);
CREATE INDEX IF NOT EXISTS idx_event_documents_uploaded_by ON event_documents(uploaded_by);

COMMENT ON TABLE event_documents IS 'Documents uploaded by hosts for AI context (PDFs, etc.)';
COMMENT ON COLUMN event_documents.extracted_text IS 'Full text extracted from document for RAG system';

-- ============================================
-- Event Questionnaires Table
-- ============================================

CREATE TABLE IF NOT EXISTS event_questionnaires (
    id VARCHAR(255) PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
    filled_by VARCHAR(255) NOT NULL REFERENCES users(id),

    -- Questionnaire responses as JSON
    responses JSONB NOT NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for event_questionnaires
CREATE INDEX IF NOT EXISTS idx_event_questionnaires_event_id ON event_questionnaires(event_id);
CREATE INDEX IF NOT EXISTS idx_event_questionnaires_filled_by ON event_questionnaires(filled_by);

COMMENT ON TABLE event_questionnaires IS 'Host questionnaire responses for AI context';
COMMENT ON COLUMN event_questionnaires.responses IS 'JSON object with questionnaire answers (dress_code, parking, food, etc.)';
