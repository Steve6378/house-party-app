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
\echo '==============================================='
\echo 'All migrations completed successfully!'
\echo '==============================================='
