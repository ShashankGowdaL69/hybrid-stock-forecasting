FROM python:3.11-slim
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip==24.2
RUN pip install --no-cache-dir setuptools==73.0.1 wheel
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app/
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=5s --start-period=120s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]