# Database Setup

## Prerequisites

- PostgreSQL 15+
- pgvector extension

## Setup

### 1. Install PostgreSQL (if not already installed)

**macOS**:
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian**:
```bash
sudo apt-get update
sudo apt-get install postgresql-15 postgresql-contrib-15
```

### 2. Install pgvector extension

**macOS**:
```bash
brew install pgvector
```

**Ubuntu/Debian**:
```bash
sudo apt-get install postgresql-15-pgvector
```

### 3. Create database

```bash
# Create database
createdb houseparty

# Or using psql
psql postgres
CREATE DATABASE houseparty;
\q
```

### 4. Run schema

```bash
psql houseparty < schema.sql
```

### 5. Verify setup

```bash
psql houseparty

# Check that tables were created
\dt

# Check that pgvector extension is installed
\dx

# Should see "vector" in the list

\q
```

## Schema Overview

### Core Tables

- **users** - User accounts (Google OAuth or email/password)
- **events** - Individual events
- **ground_truth_facts** - Host-set FAQs with embeddings
- **messages** - Group chat messages

### Group Tables (Optional)

- **groups** - Recurring event groups
- **group_members** - Membership
- **group_preferences** - Persistent preferences across events

### AI Tables

- **guest_preferences** - AI-extracted preferences from chat
- **escalated_questions** - Questions bot couldn't answer
- **suggestions** - AI-generated suggestions

### Supporting Tables

- **event_cohosts** - Co-host permissions
- **ground_truth_changes** - Audit log
- **todos** - To-do lists
- **polls** + **poll_votes** - Group chat polls

## Loading Mock Data

```bash
psql houseparty < seed_data.sql
```

(seed_data.sql to be created)

## Database Migrations

We'll use Alembic for migrations in production. For now, schema.sql is the source of truth.

## Backup & Restore

### Backup

```bash
pg_dump houseparty > backup.sql
```

### Restore

```bash
psql houseparty < backup.sql
```

## Troubleshooting

### pgvector extension not found

Make sure you installed pgvector correctly:
```bash
# macOS
brew install pgvector

# Ubuntu
sudo apt-get install postgresql-15-pgvector
```

Then restart PostgreSQL:
```bash
# macOS
brew services restart postgresql@15

# Ubuntu
sudo systemctl restart postgresql
```

### Permission denied

Make sure your PostgreSQL user has CREATE DATABASE permission:
```bash
psql postgres
ALTER USER your_username CREATEDB;
\q
```

## Connection String

For development:
```
postgresql://localhost:5432/houseparty
```

For production (with password):
```
postgresql://username:password@host:5432/houseparty
```

Set in `.env`:
```
DATABASE_URL=postgresql://localhost:5432/houseparty
```
