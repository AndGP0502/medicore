#!/usr/bin/env bash
# Redespliegue de MediCore tras un git push (ejecutar como root en el VPS):
#   /opt/medicore/deploy/redeploy.sh
set -euo pipefail

APP_DIR="/opt/medicore"

echo "==> Actualizando código"
cd "$APP_DIR"
git pull --ff-only

echo "==> Backend: dependencias"
cd "$APP_DIR/backend"
./venv/bin/pip install -q -r requirements.txt

echo "==> Frontend: build"
cd "$APP_DIR/frontend"
npm ci --silent
npm run build --silent

chown -R medicore:medicore "$APP_DIR"

echo "==> Reiniciando backend"
systemctl restart medicore-backend
sleep 3
curl -fsS http://127.0.0.1:8000/health && echo "" && echo "Redeploy OK"
