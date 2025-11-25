FROM python:3.12-slim

WORKDIR /app

# Copy requirements FIRST (before other code)
# This allows Docker to cache the pip install layer
COPY backend/requirements.txt backend/requirements.txt

# Install dependencies (cached unless requirements.txt changes)
RUN pip install --no-cache-dir -r backend/requirements.txt

# THEN copy the rest of the code
COPY . .

# Set working directory to backend for runtime
WORKDIR /app/backend

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Start command
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
