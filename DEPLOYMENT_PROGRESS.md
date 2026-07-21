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

## Facturador SRI — probado para web (2026-07-19)

- Pipeline local verificado con el .p12 real: XML + firma XAdES OK; envío SOAP a
  celcer responde (error 35 ambiental: RUC no habilitado en pruebas — la
  estructura es idéntica a comprobantes ya autorizados en producción el 11/06/2026).
- **Veredicto: funcional en web** sin dependencias de escritorio. 3 ajustes aplicados:
  1. `POST /billing/config-sri` ya no devuelve `clave_certificado`/`clave_sri` al navegador
  2. XMLs de debug → `$MEDICORE_COMP_DIR`, no fatales
  3. Fallback del cert a `$MEDICORE_CERT_DIR/firma.p12` si la ruta en DB no existe
- Núcleo de firma (`signer/xml_generator/sri_client/ride/emailer`) intacto.
- Referencia completa del funcionamiento local + código original: `SRI_FACTURADOR_LOCAL.md`

## Bug UI Configuración SRI — resuelto (2026-07-20)

- `frontend/src/pages/billing/sri/ConfigSRIPage.jsx` contenía por error el
  componente de correo → "Configurar SRI" abría la config de correo.
- Reescrito como formulario SRI real (RUC, razón social, establecimiento,
  ambiente, subida de .p12 y logo, clave con patrón "vacío = mantener").
- Nuevo `ConfigEmailPage.jsx` en `src/pages/billing/sri/` + botón "Correo" en
  BillingPage (antes la config de correo no era accesible desde la UI).
- Backend: `save_config_sri` usa `exclude_none` (no pisa claves guardadas);
  `upload-certificado` registra la ruta en DB; `tiene_certificado` con fallback.
- Eliminadas copias viejas sueltas `frontend/BillingPage.jsx` y
  `frontend/ConfigEmailPage.jsx` (origen del copy-paste erróneo).
- Verificado en navegador: login → Facturación → ambos modales, guardado con
  toast, cert "cargado ✓", y API probada (sin fuga de claves, clave conservada).

## Preparación para GitHub (2026-07-19)

- Retirados del índice (siguen en disco, ignorados): scripts de debug
  `backend/test_*.py` (uno contenía la clave del .p12), `debug_xml_*.xml` y
  `test_*.xml` (facturas reales firmadas), `_patch.py`, `tempCodeRunnerFile.py`,
  `desktop.ini`.
- `crear_admin.py` ya no hardcodea `admin@medicore.com / Admin123!`: usa
  `ADMIN_EMAIL`/`ADMIN_PASSWORD` o pide la clave por consola.
- README actualizado con instrucciones reales + enlace a DEPLOYMENT.md.
- `git push origin main` hará fast-forward limpio (verificado contra origin).
- **Pendiente consciente**: el historial remoto ya contiene el .p12, su clave y
  datos de pacientes (fueron pusheados antes). Limpiarlo requiere `git
  filter-repo` + force push + rotar el certificado — decisión del usuario.

## Bloqueos / datos que faltan del usuario

1. **IP del VPS y acceso SSH** — no proporcionados aún.
2. **Dominio real** (y crear el registro A → IP del VPS antes de correr el script).
3. **Correo para Let's Encrypt** (avisos de renovación).
4. Decisión sobre limpiar el historial git (el `.p12` y datos de pacientes
   quedaron en commits antiguos — relevante solo si el repo es público).
