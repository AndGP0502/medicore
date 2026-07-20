# MediCore — Despliegue en VPS (producción)

Guía reproducible para desplegar MediCore en un VPS con HTTPS, Postgres y Ollama
seguros, backups diarios y servicios gestionados por systemd. **Sin Docker**: se
eligió systemd + procesos nativos porque simplifica el manejo de Ollama y del
certificado SRI (ver decisiones al final).

## Requisitos previos

| Recurso | Mínimo |
|---|---|
| VPS | Ubuntu 22.04 o 24.04, x86_64 |
| RAM | **8 GB** (llama3.2 3B usa ~4 GB; Postgres + backend + Caddy el resto) |
| CPU / Disco | 2 vCPU / 40 GB SSD |
| DNS | Registro A del dominio → IP del VPS (obligatorio para Let's Encrypt) |
| Accesos | SSH como root (o sudo) |

## Despliegue inicial (una sola vez)

```bash
# 1. En el VPS, clonar el repo en /opt/medicore
git clone https://github.com/AndGP0502/medicore.git /opt/medicore

# 2. Ejecutar el aprovisionamiento (idempotente, se puede re-ejecutar)
DOMAIN=medicore.tudominio.com ACME_EMAIL=tu@correo.com \
    bash /opt/medicore/deploy/setup_vps.sh

# 3. Crear el usuario administrador (pide la clave por consola;
#    o defínela vía ADMIN_EMAIL / ADMIN_PASSWORD)
cd /opt/medicore/backend
set -a && . /etc/medicore/medicore.env && set +a
./venv/bin/python crear_admin.py
```

El script hace todo lo demás: Postgres (solo localhost, clave generada),
`/etc/medicore/medicore.env` con `SECRET_KEY` aleatorio, venv + dependencias,
build del frontend, Ollama como servicio systemd atado a 127.0.0.1 + descarga de
llama3.2, unit `medicore-backend`, Caddy con TLS automático y redirección
HTTP→HTTPS, cron de backups y healthcheck, y firewall ufw (solo SSH/80/443).

## Arquitectura resultante

```
Internet ──HTTPS──> Caddy (:80→:443, Let's Encrypt)
                      ├── /api/* y /health ──> uvicorn 127.0.0.1:8000 (systemd: medicore-backend)
                      └── /*  ──> frontend/dist (estático)
Backend ──> Postgres 127.0.0.1:5432   (nunca expuesto; ufw bloquea todo salvo 22/80/443)
Backend ──> Ollama   127.0.0.1:11434  (nunca expuesto; OLLAMA_HOST=127.0.0.1)
```

La API está versionada en `/api/v1` — la futura app móvil consume
`https://tudominio.com/api/v1/...` con los mismos tokens JWT.

## Mantenimiento

### Redesplegar tras cambios en el código
```bash
/opt/medicore/deploy/redeploy.sh
```
(git pull + pip install + build frontend + restart; verifica /health al final)

### Ver logs
```bash
journalctl -u medicore-backend -f     # backend
journalctl -u caddy -f                # reverse proxy / TLS
journalctl -u ollama -f               # IA
tail -f /var/log/medicore-backup.log  # backups
```

### Backups
- Automático: diario a las 02:30 en `/var/backups/medicore/`, rotación 14 días.
- Manual: `/opt/medicore/deploy/backup_db.sh`
- **Restaurar**: `/opt/medicore/deploy/restore_db.sh /var/backups/medicore/medicore_FECHA.sql.gz`
  (pide confirmación; detiene y arranca el backend automáticamente)

### Servicios
```bash
systemctl status medicore-backend caddy ollama postgresql
systemctl restart medicore-backend      # reinicio manual
```
Además hay un healthcheck cada 5 min que reinicia el backend si `/health` no responde.

## Certificado SRI (facturación electrónica)

El certificado actual (Lazzate) **no es válido** en la cadena de confianza de
producción del SRI. El sistema arranca y opera normalmente sin él (el .p12 se
carga solo al momento de firmar); únicamente la firma/envío de comprobantes
fallará hasta colocar un certificado válido en `backend/certificados/` en el VPS.
Ese módulo está cerrado y no se modificó.

> **Seguridad**: `backend/certificados/`, `backend/comprobantes/`, `pgdata/` y
> `backend/medicore.db` fueron retirados del control de versiones (contienen
> datos de pacientes y el .p12 de firma). **Siguen existiendo en el historial de
> git anterior** — si el repo es/será público, cambia la clave del certificado y
> considera limpiar el historial (`git filter-repo`).

## Variables de entorno

Producción: `/etc/medicore/medicore.env` (chmod 600, generado por el script).
Plantilla: [deploy/medicore.env.example](deploy/medicore.env.example).
Claves: `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS` (dominios reales, nunca `*`),
`OLLAMA_URL/OLLAMA_MODEL`, `LOGIN_RATE_LIMIT_*`.

## Decisiones técnicas

1. **systemd + nativo, sin Docker** — Ollama se instala con su propio servicio
   systemd y el certificado SRI vive en el filesystem; contenedores solo
   agregaban capas de volúmenes/red sin beneficio. El `docker-compose.yml` de la
   raíz queda solo como opción para levantar Postgres en desarrollo.
2. **Caddy sobre Nginx** — TLS de Let's Encrypt y redirección HTTP→HTTPS
   automáticos con 30 líneas de config; sin certbot ni renovaciones manuales.
3. **Caddy sirve el frontend estático** directamente (más rápido que pasar por
   FastAPI); FastAPI solo atiende `/api/*` y `/health` en 127.0.0.1:8000.
4. **Rate limiting en memoria** ([app/core/rate_limit.py](backend/app/core/rate_limit.py)):
   5 intentos/min por IP en `/api/v1/auth/login`. Sin Redis: el backend corre en
   un solo proceso uvicorn. Si se escala a varios workers, migrar a Redis.
5. **Sin Alembic**: el proyecto usa `create_all` + migraciones ad-hoc en
   `main.py`; se mantiene tal cual para no arriesgar el arranque.
6. **openpyxl y pandas** faltaban en requirements (usados por el módulo de
   reportes Excel); añadidos a `backend/requirements.txt`.
