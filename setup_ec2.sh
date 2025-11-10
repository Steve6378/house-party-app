#!/bin/bash
#
# EC2 Setup Script for House Party RAG System
# Run this on a fresh Ubuntu 22.04 EC2 instance
#
# Usage: bash setup_ec2.sh

set -e

echo "========================================="
echo "House Party RAG - EC2 Setup"
echo "========================================="

# Update system
echo "[1/8] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL 15
echo "[2/8] Installing PostgreSQL 15..."
sudo apt install -y postgresql-15 postgresql-contrib

# Install pgvector extension
echo "[3/8] Installing pgvector extension..."
sudo apt install -y postgresql-15-pgvector

# Install Python 3.11
echo "[4/8] Installing Python 3.11..."
sudo apt install -y python3.11 python3.11-venv python3-pip git

# Start PostgreSQL
echo "[5/8] Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
echo "[6/8] Creating database..."
sudo -u postgres psql <<EOF
CREATE DATABASE house_party_db;
CREATE USER house_party_user WITH PASSWORD 'changeme123';
GRANT ALL PRIVILEGES ON DATABASE house_party_db TO house_party_user;
\c house_party_db
CREATE EXTENSION vector;
\q
EOF

# Set up project directory
echo "[7/8] Setting up project directory..."
cd ~
if [ ! -d "house-party-app" ]; then
    mkdir house-party-app
fi
cd house-party-app

# Create virtual environment
echo "[8/8] Creating Python virtual environment..."
python3.11 -m venv venv
source venv/bin/activate

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Clone your repo: git clone <your-repo-url>"
echo "2. Activate venv: source ~/house-party-app/venv/bin/activate"
echo "3. Install deps: pip install -r requirements.txt"
echo "4. Set up .env file with your API keys"
echo "5. Run schema: psql -U house_party_user -d house_party_db -f database/schema.sql"
echo "6. Run fact extraction: python rag/extract_facts.py"
echo "7. Query RAG: python rag/query_rag.py"
echo ""
echo "Database credentials:"
echo "  Host: localhost"
echo "  Database: house_party_db"
echo "  User: house_party_user"
echo "  Password: changeme123"
echo ""
