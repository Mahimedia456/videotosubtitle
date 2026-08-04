FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONUTF8=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python -m pip install --upgrade pip \
    && python -m pip install \
        --no-cache-dir \
        -r requirements.txt

COPY . .

RUN test -f /app/app/main.py \
    && test -f /app/app/models/project.py \
    && python -c \
        "from app.models.project import TranscriptionProject; print('Backend imports verified')"

RUN mkdir -p \
    storage/uploads \
    storage/audio \
    storage/projects \
    storage/subtitles \
    storage/exports

EXPOSE 8000

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]