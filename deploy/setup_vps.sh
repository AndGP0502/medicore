#!/usr/bin/env bash
# ============================================================================
# MediCore — aprovisionamiento completo de VPS (Ubuntu 22.04 / 24.04)
#
# Uso (como root, con el repo ya clonado en /opt/medicore):
#   DOMAIN=medicore.midominio.com ACME_EMAIL=correo@dominio.com \
#     bash /opt/medicore/deploy/setup_vps.sh
#
# Requisitos previos:
#   - DNS: registro A del dominio apuntando a la IP del VPS (necesario para TLS)
#   - VPS con >= 8 GB de RAM (llama3.2 3B usa ~4 GB; Postgres+backend el resto)
#
# El script es idempotente: se puede re-ejecutar sin romper nada.
# ============================================================================
set -euo pipefail

DOMAIN="${DOMAIN:?Define DOMAIN=tu.dominio.com}"
ACME_EMAIL="${ACME_EMAIL:?Define ACME_EMAIL=tu@correo.com}"
APP_DIR="/opt/medicore"
ENV_DIR="/etc/medicore"
ENV_FILE="$ENV_DIR/medicore.env"
DB_NAME="medicore"
DB_USER="medicore"

[ "$(id -u)" -eq 0 ] || { echo "Ejecutar como root"; exit 1; }
[ -d "$APP_DIR/backend" ] || { echo "Repo no encontrado en $APP_DIR"; exit 1; }

echo "==> [1/10] Verificando RAM"
TOTAL_RAM_MB=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
if [ "$TOTAL_RAM_MB" -lt 7000 ]; then
    echo "AVISO: ${TOTAL_RAM_MB} MB de RAM. llama3.2 necesita ~4 GB libres."
    echo "       Con menos de 8 GB totales, la IA puede degradar el resto del sistema."
fi

echo "==> [2/10] Paquetes del sistema"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq python3-venv python3-pip postgresql postgresql-contrib \
    ufw curl git debian-keyring debian-archive-keyring apt-transport-https gnupg

# Node.js 20 (build del frontend)
if ! command -v node >/dev/null || [ "$(node -v | cut -c2-3)" -lt 20 ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
    apt-get install -y -qq nodejs
fi

# Caddy (repo oficial)
if ! command -v caddy >/dev/null; then
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
        | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
        > /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -qq && apt-get install -y -qq caddy
fi

echo "==> [3/10] Usuario de sistema y Postgres (solo localhost)"
id -u medicore &>/dev/null || useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin medicore
systemctl enable --now postgresql

# Postgres escucha solo en localhost por defecto en Ubuntu; el firewall además
# bloquea 5432. Crear rol y base solo si no existen, con clave fuerte generada.
DB_PASS=""
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    DB_PASS="$(openssl rand -hex 24)"
    sudo -u postgres psql -qc "CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS';"
fi
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 \
    || sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"

echo "==> [4/10] Variables de entorno de producción"
mkdir -p "$ENV_DIR"
if [ ! -f "$ENV_FILE" ]; then
    [ -n "$DB_PASS" ] || { echo "ERROR: el rol $DB_USER ya existía pero no hay $ENV_FILE con su clave. Borra el rol o crea $ENV_FILE a mano."; exit 1; }
    SECRET_KEY="$(openssl rand -hex 32)"
    cat > "$ENV_FILE" <<EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@127.0.0.1:5432/$DB_NAME
SECRET_KEY=$SECRET_KEY
DEBUG=False
CORS_ORIGINS=https://$DOMAIN
FRONTEND_URL=https://$DOMAIN
OLLAMA_URL=http://127.0.0.1:11434/api/generate
OLLAMA_MODEL=llama3.2
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
LOGIN_RATE_LIMIT_ATTEMPTS=5
LOGIN_RATE_LIMIT_WINDOW_SECONDS=60
EOF
    chmod 600 "$ENV_FILE"
    echo "    Generado $ENV_FILE (claves aleatorias)"
else
    echo "    $ENV_FILE ya existe — no se toca"
fi

echo "==> [5/10] Backend: venv + dependencias"
cd "$APP_DIR/backend"
[ -d venv ] || python3 -m venv venv
./venv/bin/pip install -q --upgrade pip
./venv/bin/pip install -q -r requirements.txt
chown -R medicore:medicore "$APP_DIR"

echo "==> [6/10] Frontend: build de producción"
cd "$APP_DIR/frontend"
npm ci --silent
npm run build --silent
chown -R medicore:medicore dist

echo "==> [7/10] Ollama (solo localhost)"
if ! command -v ollama >/dev/null; then
    curl -fsSL https://ollama.com/install.sh | sh
fi
mkdir -p /etc/systemd/system/ollama.service.d
cp "$APP_DIR/deploy/ollama-override.conf" /etc/systemd/system/ollama.service.d/override.conf
systemctl daemon-reload
systemctl enable --now ollama
sleep 3
ollama list | grep -q llama3.2 || ollama pull llama3.2

echo "==> [8/10] Servicio systemd del backend + healthcheck + backups"
cp "$APP_DIR/deploy/medicore-backend.service" /etc/systemd/system/medicore-backend.service
chmod +x "$APP_DIR"/deploy/*.sh
systemctl daemon-reload
systemctl enable --now medicore-backend

cat > /etc/cron.d/medicore-backup <<EOF
30 2 * * * root $APP_DIR/deploy/backup_db.sh >> /var/log/medicore-backup.log 2>&1
EOF
cat > /etc/cron.d/medicore-healthcheck <<EOF
*/5 * * * * root $APP_DIR/deploy/healthcheck.sh >> /var/log/medicore-healthcheck.log 2>&1
EOF

echo "==> [9/10] Caddy (HTTPS automático, HTTP→HTTPS)"
sed -e "s/__DOMAIN__/$DOMAIN/g" -e "s/__ACME_EMAIL__/$ACME_EMAIL/g" \
    "$APP_DIR/deploy/Caddyfile" > /etc/caddy/Caddyfile
systemctl enable caddy
systemctl reload caddy 2>/dev/null || systemctl restart caddy

echo "==> [10/10] Firewall: solo SSH, 80 y 443"
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
ufw status

echo ""
echo "============================================================"
echo " MediCore desplegado."
echo "   Web:     https://$DOMAIN"
echo "   Salud:   curl -s http://127.0.0.1:8000/health"
echo "   Estado:  systemctl status medicore-backend caddy ollama"
echo ""
echo " Paso final manual: crear el usuario administrador:"
echo "   cd $APP_DIR/backend && set -a && . $ENV_FILE && set +a && ./venv/bin/python crear_admin.py"
echo "============================================================"
