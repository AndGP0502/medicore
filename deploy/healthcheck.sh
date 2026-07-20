#!/usr/bin/env bash
# Healthcheck del backend: si /health no responde, reinicia el servicio.
# Instalado por setup_vps.sh en /etc/cron.d/medicore-healthcheck (cada 5 min).
set -u

if ! curl -fsS --max-time 10 "http://127.0.0.1:8000/health" > /dev/null 2>&1; then
    echo "[$(date -Is)] /health sin respuesta — reiniciando medicore-backend"
    systemctl restart medicore-backend
fi
