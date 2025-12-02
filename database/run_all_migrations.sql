-- Yorru Database Migrations - Run All
-- This file runs all migrations in the correct order
-- Usage: psql "YOUR_DATABASE_URL" -f database/run_all_migrations.sql

\echo '==============================================='
\echo 'Yorru Database Migrations'
\echo 'Running all migrations in order...'
\echo '==============================================='

\echo ''
\echo '--- Migration 001: Add status columns ---'
\i database/migrations/001_add_status_columns.sql

\echo ''
\echo '--- Migration 002: Fix table names and missing columns ---'
\i database/migrations/002_fix_table_names_and_missing_columns.sql

\echo ''
\echo '--- Migration 003: Add group chat support ---'
\i database/migrations/003_add_group_chat_support.sql

\echo ''
\echo '--- Migration 004: Add image URL support ---'
\i database/migrations/004_add_image_url_support.sql

\echo ''
\echo '--- Migration 005: Migrate event_attendance table ---'
\i database/migrations/005_migrate_event_attendance.sql

\echo ''
\echo '--- Migration 006: Add document tables ---'
\i database/migrations/006_add_document_tables.sql

\echo ''
\echo '--- Migration 007: Add photos and FAQs tables ---'
\i database/migrations/007_add_photos_and_faqs.sql

\echo ''
\echo '--- Migration 008: Add user profile columns ---'
\i database/migrations/008_add_user_profile_columns.sql

\echo ''
\echo '--- Migration 009: Add event columns ---'
\i database/migrations/009_add_event_columns.sql

\echo ''
\echo '--- Migration 010: Add face_encodings to event_photos ---'
\i database/migrations/010_add_face_encodings_column.sql

\echo ''
\echo '==============================================='
\echo 'All migrations completed successfully!'
\echo '==============================================='
