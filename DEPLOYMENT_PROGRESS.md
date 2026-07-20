# DEPLOYMENT_PROGRESS — MediCore → VPS

**Estado global: COMPLETADO (lado repositorio).** Todo lo que se puede preparar
desde el código está hecho y verificado localmente. La ejecución en el VPS real
está pendiente de los datos del usuario (ver "Bloqueos" abajo).

## Estado por punto del alcance

| # | Punto | Estado |
|---|---|---|
| 1 | Auditoría (rutas hardcodeadas, config, CORS, env) | ✅ Hecho |
| 2 | Docker vs nativo | ✅ Decidido: **sin Docker**, systemd nativo |
| 3 | Postgres producción (localhost, claves env, backups+rotación) | ✅ Hecho (scripts listos) |
| 4 | Reverse proxy + TLS + HTTP→HTTPS | ✅ Hecho (Caddy) |
| 5 | Env producción: JWT fuerte, CORS restringido, rate limit login | ✅ Hecho y probado |
| 6 | Versionado API `/api/v1` | ✅ Ya existía; frontend usa `/api/v1` relativo |
| 7 | Ollama como servicio, solo localhost, chequeo RAM | ✅ Hecho (override + check en script) |
| 8 | systemd unit backend + healthchecks | ✅ Hecho |
| 9 | Firewall (solo 22/80/443) | ✅ Hecho (en setup_vps.sh) |
| 10 | Deployment reproducible + docs | ✅ Hecho (`setup_vps.sh`, `redeploy.sh`, `DEPLOYMENT.md`) |

## Archivos creados

- `deploy/setup_vps.sh` — aprovisionamiento completo e idempotente del VPS
- `deploy/redeploy.sh` — redespliegue tras git pull
- `deploy/Caddyfile` — plantilla reverse proxy (placeholders `__DOMAIN__`/`__ACME_EMAIL__`)
- `deploy/medicore-backend.service` — unit systemd del backend
- `deploy/ollama-override.conf` — fuerza `OLLAMA_HOST=127.0.0.1`
- `deploy/backup_db.sh` / `deploy/restore_db.sh` — backup diario (rotación 14 días) y restauración
- `deploy/healthcheck.sh` — reinicia backend si `/health` no responde (cron 5 min)
- `deploy/medicore.env.example` — plantilla de variables de producción
- `backend/requirements.txt` — deps de producción (añadidos **openpyxl** y **pandas**, faltaban)
- `backend/app/core/rate_limit.py` — rate limiter login (5/min por IP, en memoria)
- `DEPLOYMENT.md` — guía completa de despliegue y mantenimiento

## Archivos modificados

- `backend/app/core/config.py` — nuevos settings: `CORS_ORIGINS` (lista por comas),
  `OLLAMA_URL`, `OLLAMA_MODEL`, `LOGIN_RATE_LIMIT_*`
- `backend/app/main.py` — CORS suma `settings.cors_origins_list` (env-driven)
- `backend/app/modules/auth/router.py` — dependencia `login_rate_limit` en `/login`
- `backend/app/modules/ai_assistant/service.py` — Ollama URL/modelo desde settings (antes hardcodeado)
- `backend/crear_admin.py` — respeta `DATABASE_URL` del entorno (antes la pisaba)
- `.gitignore` — añadidos `pgdata/` y `comprobantes/`
- **git index**: retirados `pgdata/` (970 archivos), `backend/medicore.db`,
  `backend/certificados/firma.p12` y `backend/comprobantes/` (datos sensibles;
  siguen en disco, y OJO: siguen en el historial git antiguo)

## Decisiones tomadas (no re-decidir)

1. **Sin Docker** — Ollama y el cert SRI se manejan mejor nativos; systemd para todo.
2. **Caddy sobre Nginx** — TLS/renovación/redirect automáticos, config mínima.
3. **Caddy sirve `frontend/dist`**; FastAPI solo `/api/*` en 127.0.0.1:8000, 1 worker.
4. **Rate limit en memoria** (no Redis) porque hay un solo proceso uvicorn.
5. **Sin Alembic** — se conserva `create_all` + migraciones ad-hoc existentes.
6. **Módulo SRI intacto** — carga lazy del .p12; el arranque sin cert válido está
   verificado (modo degradado OK).
7. Layout VPS: repo en `/opt/medicore`, env en `/etc/medicore/medicore.env`,
   backups en `/var/backups/medicore`, usuario de sistema `medicore`.

## Verificaciones realizadas (local, 2026-07-19)

- Import completo de la app con env de producción: OK
- Arranque uvicorn + `/health`: OK
- Rate limit login: intentos 1–5 → 401, 6–7 → **429** ✅
- Build de producción del frontend (`npm run build`): OK (1.08s)
- `bash -n` en todos los scripts de deploy: OK

## Próximo paso exacto al reanudar

Ejecutar en el VPS (nada más que hacer en el repo):
```bash
git clone <repo> /opt/medicore
DOMAIN=<dominio> ACME_EMAIL=<correo> bash /opt/medicore/deploy/setup_vps.sh
cd /opt/medicore/backend && set -a && . /etc/medicore/medicore.env && set +a && ./venv/bin/python crear_admin.py
```

## Bloqueos / datos que faltan del usuario

1. **IP del VPS y acceso SSH** — no proporcionados aún.
2. **Dominio real** (y crear el registro A → IP del VPS antes de correr el script).
3. **Correo para Let's Encrypt** (avisos de renovación).
4. Decisión sobre limpiar el historial git (el `.p12` y datos de pacientes
   quedaron en commits antiguos — relevante solo si el repo es público).
