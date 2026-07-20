"""
backend/app/main.py — versión empaquetable (.exe)

Cambios respecto al original:
1. Sirve el build estático de React (frontend/dist) directamente desde FastAPI,
   eliminando la necesidad de un servidor Vite separado.
2. Las rutas de certificados y comprobantes se resuelven a %APPDATA%/MediCore/
   cuando la app corre empaquetada, en lugar de rutas relativas al directorio
   de trabajo (que en Archivos de programa no es escribible).
3. CORS acepta peticiones del mismo origen (localhost:8000) cuando está
   empaquetado.
"""

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.routing import Mount

from app.core.config import settings
from app.database.session import engine
from app.database.base import Base

import app.modules.auth.models
import app.modules.patients.models
import app.modules.appointments.models
import app.modules.medical_records.models
import app.modules.billing.models
import app.modules.billing.sri_models
import app.modules.inventory.models
import app.modules.laboratory.models


# ── Rutas dinámicas según si está empaquetado o en desarrollo ─────────────────
FROZEN = getattr(sys, "frozen", False)

if FROZEN:
    # Empaquetado: base = carpeta de MediCore.exe
    BASE_DIR   = Path(sys.executable).parent
    APP_DATA   = Path(os.environ.get("APPDATA", BASE_DIR)) / "MediCore"
    CERT_DIR   = APP_DATA / "certificados"
    COMP_DIR   = APP_DATA / "comprobantes"
    FRONTEND_DIR = BASE_DIR / "frontend"   # dist/ copiado por PyInstaller
else:
    # Desarrollo normal
    BASE_DIR   = Path(__file__).parent.parent
    APP_DATA   = BASE_DIR
    CERT_DIR   = BASE_DIR / "certificados"
    COMP_DIR   = BASE_DIR / "comprobantes"
    FRONTEND_DIR = BASE_DIR.parent / "frontend" / "dist"

# Exponer rutas para que otros módulos las usen
os.environ.setdefault("MEDICORE_CERT_DIR", str(CERT_DIR))
os.environ.setdefault("MEDICORE_COMP_DIR", str(COMP_DIR))

# Crear directorios de datos si no existen
for d in [CERT_DIR, COMP_DIR]:
    d.mkdir(parents=True, exist_ok=True)


# ── Migraciones automáticas ───────────────────────────────────────────────────
def _migraciones_automaticas():
    """Agrega columnas nuevas sin romper datos existentes."""
    from sqlalchemy import inspect, text
    insp = inspect(engine)
    try:
        columnas = [c["name"] for c in insp.get_columns("invoice_items")]
        if "iva_porcentaje" not in columnas:
            with engine.begin() as conn:
                conn.execute(text(
                    "ALTER TABLE invoice_items "
                    "ADD COLUMN iva_porcentaje NUMERIC(5,2) DEFAULT 0"
                ))
            print("=== [MIGRACION] invoice_items.iva_porcentaje creada ===")
    except Exception as e:
        print(f"=== [MIGRACION] Aviso: {e} ===")

    try:
        tablas = insp.get_table_names()
        if "configuracion_email" not in tablas:
            print("=== [MIGRACION] Creando tabla configuracion_email ===")
        if "comprobantes_emitidos" not in tablas:
            print("=== [MIGRACION] Creando tabla comprobantes_emitidos ===")
    except Exception as e:
        print(f"=== [MIGRACION] Aviso tablas: {e} ===")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _migraciones_automaticas()
    yield


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS — en producción empaquetada solo necesita localhost:8000
origins = ["http://localhost:8000", "http://127.0.0.1:8000"]
if not FROZEN:
    origins += [settings.FRONTEND_URL, "http://localhost:5173"]
# En VPS: CORS_ORIGINS en .env define los dominios reales permitidos
origins += settings.cors_origins_list

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API
from app.api.v1.router import api_router
app.include_router(api_router, prefix="/api/v1")

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}

# ── Servir el frontend estático ────────────────────────────────────────────────
# Solo en producción empaquetada o si el build existe
if FRONTEND_DIR.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=str(FRONTEND_DIR / "assets")),
        name="assets",
    )

    # Todas las rutas no-API devuelven index.html (SPA routing)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        index = FRONTEND_DIR / "index.html"
        return FileResponse(str(index))
