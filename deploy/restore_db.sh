#!/usr/bin/env bash
# Restaura un backup de MediCore. Uso (como root):
#   ./restore_db.sh /var/backups/medicore/medicore_2026-07-19_0230.sql.gz
# ADVERTENCIA: reemplaza por completo la base de datos actual.
set -euo pipefail

BACKUP_FILE="${1:?Uso: restore_db.sh <archivo.sql.gz>}"
DB_NAME="medicore"
DB_USER="medicore"

[ -f "$BACKUP_FILE" ] || { echo "No existe: $BACKUP_FILE"; exit 1; }

read -r -p "Esto BORRA la base '$DB_NAME' actual y la reemplaza con el backup. ¿Continuar? [escribe SI] " ok
[ "$ok" = "SI" ] || { echo "Cancelado."; exit 1; }

systemctl stop medicore-backend

sudo -u postgres dropdb --if-exists "$DB_NAME"
sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
gunzip -c "$BACKUP_FILE" | sudo -u postgres psql -q "$DB_NAME"

systemctl start medicore-backend
echo "Restauración completada desde $BACKUP_FILE"
