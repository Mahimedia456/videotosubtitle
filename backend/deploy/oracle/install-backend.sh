#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:-$(pwd)}"
SERVICE_NAME="liquidity-backend"
PYTHON_BIN="${PYTHON_BIN:-python3}"

if [[ ! -f "$APP_DIR/requirements.txt" || ! -f "$APP_DIR/app/main.py" ]]; then
  echo "Run this script with the backend directory as argument."
  echo "Example: ./deploy/oracle/install-backend.sh /home/ubuntu/liquidity-backend"
  exit 1
fi

sudo apt-get update
sudo apt-get install -y python3-venv python3-pip ffmpeg nginx certbot python3-certbot-nginx

cd "$APP_DIR"
"$PYTHON_BIN" -m venv .venv
.venv/bin/python -m pip install --upgrade pip wheel setuptools
.venv/bin/pip install -r requirements.txt

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo
  echo "Created $APP_DIR/.env from .env.example."
  echo "Edit FRONTEND_ORIGIN and OPENAI_API_KEY before starting the service:"
  echo "  nano $APP_DIR/.env"
  exit 2
fi

# The application creates storage/uploads, audio, projects, subtitles and exports itself.
mkdir -p storage/uploads storage/audio storage/projects storage/subtitles storage/exports

CURRENT_USER="$(id -un)"
CURRENT_GROUP="$(id -gn)"

sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" >/dev/null <<UNIT
[Unit]
Description=Liquidity FastAPI backend
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${CURRENT_USER}
Group=${CURRENT_GROUP}
WorkingDirectory=${APP_DIR}
Environment=PYTHONUNBUFFERED=1
ExecStart=${APP_DIR}/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now "$SERVICE_NAME"
sudo systemctl --no-pager --full status "$SERVICE_NAME" || true

echo
echo "Backend service installed. Local health check:"
echo "  curl http://127.0.0.1:8000/health"
echo
echo "Next: configure Nginx + DNS + HTTPS using DEPLOY_ORACLE_FREE.md"
