#!/usr/bin/env bash
# ============================================================================
# MediCore — suspender / reactivar el servicio de un cliente (por pago)
#
# Se ejecuta como root EN EL VPS DEL CLIENTE. Al suspender: detiene el backend
# y hace que Caddy muestre la página de "servicio suspendido" en HTTPS para
# todas las rutas (la app queda inaccesible). Al reactivar: restaura todo.
#
# Uso:
#   /opt/medicore/deploy/manage_service.sh suspend   # cortar por impago
#   /opt/medicore/deploy/manage_service.sh restore   # reactivar tras el pago
#   /opt/medicore/deploy/manage_service.sh status    # ver estado actual
# ============================================================================
set -euo pipefail

CADDYFILE="/etc/caddy/Caddyfile"
BACKUP="/etc/caddy/Caddyfile.active"
SUSPEND_PAGE="/opt/medicore/deploy/suspension.html"
ACTION="${1:-}"

[ "$(id -u)" -eq 0 ] || { echo "Ejecutar como root"; exit 1; }

# Dominio real: se extrae de la línea "dominio {" del Caddyfile activo
_dominio() {
  grep -oE '^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,} \{' "${1:-$CADDYFILE}" | head -1 | awk '{print $1}'
}

case "$ACTION" in
  suspend)
    if [ -f "$BACKUP" ]; then
      echo "Ya está suspendido (existe $BACKUP). Nada que hacer."; exit 0
    fi
    DOMINIO="$(_dominio)"
    [ -n "$DOMINIO" ] || { echo "No se pudo detectar el dominio en $CADDYFILE"; exit 1; }

    cp "$CADDYFILE" "$BACKUP"            # guardar la config activa
    cat > "$CADDYFILE" <<EOF
$DOMINIO {
	root * $(dirname "$SUSPEND_PAGE")
	rewrite * /suspension.html
	file_server
}
EOF
    systemctl reload caddy
    systemctl stop medicore-backend
    systemctl disable medicore-backend >/dev/null 2>&1 || true
    echo "SUSPENDIDO: $DOMINIO muestra la página de suspensión y el backend está detenido."
    ;;

  restore)
    if [ ! -f "$BACKUP" ]; then
      echo "No está suspendido (no existe $BACKUP). Nada que hacer."; exit 0
    fi
    mv "$BACKUP" "$CADDYFILE"            # devolver la config activa
    systemctl reload caddy
    systemctl enable medicore-backend >/dev/null 2>&1 || true
    systemctl start medicore-backend
    sleep 3
    if curl -fsS --max-time 10 http://127.0.0.1:8000/health >/dev/null 2>&1; then
      echo "REACTIVADO: $(_dominio) operativo y backend respondiendo."
    else
      echo "REACTIVADO: Caddy restaurado, pero el backend aún no responde en /health. Revisa: journalctl -u medicore-backend -n 30"
    fi
    ;;

  status)
    if [ -f "$BACKUP" ]; then
      echo "Estado: SUSPENDIDO (página de suspensión activa)"
    else
      echo "Estado: ACTIVO"
    fi
    systemctl is-active medicore-backend >/dev/null 2>&1 \
      && echo "Backend: corriendo" || echo "Backend: detenido"
    ;;

  *)
    echo "Uso: $0 {suspend|restore|status}"; exit 1
    ;;
esac
