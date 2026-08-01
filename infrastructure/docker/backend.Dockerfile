FROM python:3.11-slim

WORKDIR /app

# Install system dependencies, clean up lists
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/

RUN pip install --no-cache-dir -r requirements.txt

# Copy source folders
COPY backend/ /app/backend/
COPY database/ /app/database/
COPY intelligence/ /app/intelligence/
COPY firebase_local.json /app/

# Set PYTHONPATH so absolute imports work
ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
