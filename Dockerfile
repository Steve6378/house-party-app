FROM python:3.12-slim

WORKDIR /app

# Copy the entire repo
COPY . .

# Install dependencies from backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Set working directory to backend for runtime
WORKDIR /app/backend

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Start command
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
