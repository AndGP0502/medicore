# medicore.spec
# Ejecutar con: pyinstaller medicore.spec
# Desde la carpeta raiz del proyecto

from pathlib import Path
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

block_cipher = None
ROOT = Path(".").resolve()
BACKEND = ROOT / "backend"
FRONTEND_DIST = ROOT / "frontend" / "dist"

# Paquetes completos (evita el ModuleNotFoundError uno por uno)
hidden = []
for paquete in [
    "fastapi", "starlette", "uvicorn", "anyio", "sniffio", "h11",
    "passlib", "jose", "bcrypt",
    "pydantic", "pydantic_settings", "pydantic_core",
    "sqlalchemy",
    "zeep", "isodate",
    "reportlab",
    "cryptography", "lxml",
    "multipart",
    "aiofiles", "openpyxl", "et_xmlfile", "pandas", "requests",
    "email_validator",
]:
    try:
        hidden += collect_submodules(paquete)
    except Exception:
        pass

hidden += [
    "psycopg2", "psycopg2.extras", "psycopg2._psycopg",
    # Modulos de la app (importaciones dinamicas)
    "app.modules.auth.models",
    "app.modules.patients.models",
    "app.modules.appointments.models",
    "app.modules.medical_records.models",
    "app.modules.billing.models",
    "app.modules.billing.sri_models",
    "app.modules.inventory.models",
    "app.modules.laboratory.models",
    "app.sri.signer",
    "app.sri.xml_generator",
    "app.sri.sri_client",
    "app.sri.ride",
    "app.sri.emailer",
]

# Archivos de datos de paquetes que los necesitan
datas = [
    (str(BACKEND / "app"), "app"),
    (str(FRONTEND_DIST),   "frontend"),
]
for paquete in ["reportlab", "zeep", "passlib", "openpyxl", "et_xmlfile", "pandas", "requests"]:
    try:
        datas += collect_data_files(paquete)
    except Exception:
        pass

a = Analysis(
    [str(ROOT / "launcher.py")],
    pathex=[str(ROOT), str(BACKEND)],
    binaries=[],
    datas=datas,
    hiddenimports=hidden,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        "tkinter", "matplotlib",
        "PIL", "cv2", "torch", "tensorflow",
        "jupyter", "IPython", "pytest",
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="MediCore",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    icon="medicore.ico",
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="MediCore",
)
