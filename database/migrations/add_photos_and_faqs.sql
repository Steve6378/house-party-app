-- Migration: Add event_photos and event_faqs tables
-- Run this on your Railway PostgreSQL database

-- ============================================
-- EVENT PHOTOS (For AI Photo Search)
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_photos (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    uploaded_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    description TEXT,
    tags TEXT,
    caption TEXT,
    message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON public.event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_uploaded_by ON public.event_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_event_photos_created_at ON public.event_photos(created_at DESC);

-- Vector similarity index for photo search (only if pgvector is enabled)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_event_photos_embedding ON public.event_photos USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)';
    END IF;
END $$;

-- ============================================
-- EVENT FAQs (Auto-generated from questions)
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_faqs (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    is_public BOOLEAN DEFAULT FALSE,
    similar_questions TEXT,
    last_asked_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_faqs_event_id ON public.event_faqs(event_id);
CREATE INDEX IF NOT EXISTS idx_event_faqs_frequency ON public.event_faqs(frequency DESC);
CREATE INDEX IF NOT EXISTS idx_event_faqs_is_public ON public.event_faqs(is_public) WHERE is_public = TRUE;

-- Vector similarity index for FAQ matching (only if pgvector is enabled)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_event_faqs_embedding ON public.event_faqs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)';
    END IF;
END $$;

-- ============================================
-- Add triggers for updated_at
-- ============================================

CREATE TRIGGER update_event_photos_updated_at BEFORE UPDATE ON public.event_photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_faqs_updated_at BEFORE UPDATE ON public.event_faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Done!
-- ============================================
SELECT 'Migration completed successfully!' as status;
