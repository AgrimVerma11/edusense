# EduSense API image.
FROM python:3.11-slim

# Predictable, lean Python in a container.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# libgomp1 is the OpenMP runtime XGBoost needs to load.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies first so this layer is cached across code changes.
COPY requirements.txt .
RUN pip install -r requirements.txt

# App code, trained models, and the datasets the API reads at runtime
# (the SHAP background and the cluster-profile features).
COPY . .

# Drop to a non-root user.
RUN useradd --create-home --uid 1000 appuser \
    && chown -R appuser:appuser /app
USER appuser

# Render injects $PORT. One worker keeps a single copy of the model stack in
# memory; threads give concurrency; the long timeout covers the model warm-load
# on a cold start.
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "gunicorn 'api.app:create_app()' --bind 0.0.0.0:${PORT} --workers 1 --threads 4 --worker-class gthread --timeout 120 --access-logfile -"]
