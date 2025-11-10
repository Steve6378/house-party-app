# House Party: AI Event Planning Assistant - RAG System

## 12-Hour Sprint Guide

This README will get you from zero to a working RAG demonstration in 12 hours.

---

## What We're Building

A RAG (Retrieval-Augmented Generation) system that:
1. Extracts facts from group chat messages ("Sarah is vegan", "Group prefers Saturday evenings")
2. Stores facts as vector embeddings in PostgreSQL with pgvector
3. Enables semantic search ("What are Sarah's dietary needs?" → returns "is vegan", "allergic to nuts")
4. Powers AI chat moderation with persistent group memory

**Demo value:** Shows real RAG architecture with fact extraction, embeddings, and semantic retrieval.

---

## Quick Start

### Prerequisites
- EC2 t3.medium instance (Ubuntu 22.04)
- OpenAI API key
- SSH key for EC2 access

### Step 1: Set Up EC2 (30 min)

```bash
# SSH into EC2
ssh -i house-party-key.pem ubuntu@YOUR_EC2_IP

# Run setup script (creates database, installs dependencies)
bash setup_ec2.sh

# Clone repo
cd ~/house-party-app
git pull origin YOUR_BRANCH

# Activate Python environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env <<EOF
OPENAI_API_KEY=your_key_here
DB_HOST=localhost
DB_NAME=house_party_db
DB_USER=house_party_user
DB_PASSWORD=changeme123
EOF

# Initialize database schema
psql -U house_party_user -d house_party_db -f database/schema.sql
```

### Step 2: Extract Facts from Chat (1-2 hours)

```bash
# Run fact extraction pipeline
python rag/extract_facts.py
```

**Output:**
```
Processing 30 messages...
Extracted 35 user facts, 12 group facts
```

### Step 3: Query RAG System (1-2 hours)

```bash
# Interactive mode
python rag/query_rag.py

# Try queries:
rag> user Sarah dietary restrictions
rag> group "Test Group" budget preferences
```

---

## Architecture

```
Group Chat → Fact Extraction (GPT-4) → Embeddings (OpenAI) → PostgreSQL+pgvector → Semantic Search
```

**Key Components:**
1. `extract_facts.py` - Extracts facts using GPT-4
2. `query_rag.py` - Semantic search over facts
3. PostgreSQL with pgvector - Vector similarity search
4. `mock_chat.json` - Sample group chat data (30 messages)

---

## Example Queries

**User facts:**
```bash
python rag/query_rag.py user Sarah food preferences
# Returns: is vegan, allergic to nuts, doesn't like spicy food
```

**Group facts:**
```bash
python rag/query_rag.py group "Test Group" budget
# Returns: prefers $20/person max, most are students
```

---

## Files

- `database/schema.sql` - PostgreSQL schema with vector columns
- `rag/extract_facts.py` - Fact extraction pipeline
- `rag/query_rag.py` - RAG query system
- `mock_chat.json` - Sample chat data
- `setup_ec2.sh` - EC2 setup automation

---

## Cost

- EC2 t3.medium: ~$0.05/hour
- OpenAI API: ~$0.10 for 30 messages
- **Total for demo: < $1**

---

## Troubleshooting

**Database connection fails:**
```bash
sudo systemctl status postgresql
```

**API errors:**
```bash
# Check .env file has correct OPENAI_API_KEY
cat .env
```

---

## Next Steps

See `PROJECT_TODO.md` for full project roadmap including photo recognition, venue search, and frontend UI.