#!/usr/bin/env bash
# Backup diario de la base de datos MediCore con rotación.
# Instalado por setup_vps.sh en /etc/cron.d/medicore-backup (corre como root a las 02:30).
set -euo pipefail

BACKUP_DIR="/var/backups/medicore"
DB_NAME="medicore"
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

STAMP="$(date +%F_%H%M)"
FILE="$BACKUP_DIR/medicore_${STAMP}.sql.gz"

sudo -u postgres pg_dump "$DB_NAME" | gzip > "$FILE"

# Rotación: eliminar backups con más de RETENTION_DAYS días
find "$BACKUP_DIR" -name "medicore_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" -delete

echo "[$(date -Is)] Backup OK: $FILE ($(du -h "$FILE" | cut -f1))"
