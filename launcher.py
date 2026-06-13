"""
MediCore Launcher
Arranca PostgreSQL portable y el backend FastAPI.
Se empaqueta como MediCore.exe con PyInstaller.
"""

import os
import sys
import time
import signal
import tempfile
import subprocess
import threading
import webbrowser
from pathlib import Path

# -- Rutas base ----------------------------------------------------------------
if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys.executable).parent
else:
    BASE_DIR = Path(__file__).parent

APP_DATA = Path(os.environ.get("APPDATA", BASE_DIR)) / "MediCore"
PG_DATA  = APP_DATA / "pgdata"
PG_BIN   = BASE_DIR / "pgsql" / "bin"
LOG_DIR  = APP_DATA / "logs"
CERT_DIR = APP_DATA / "certificados"
COMP_DIR = APP_DATA / "comprobantes"
BACKEND  = BASE_DIR / "backend"

DB_NAME = "medicore"
DB_USER = "medicore"
DB_PASS = "medicore2024"
DB_PORT = "5433"
DB_URL  = f"postgresql://{DB_USER}:{DB_PASS}@localhost:{DB_PORT}/{DB_NAME}"

pg_started = False
uv_proc = None

# -- Log a archivo (la app corre sin consola) -----------------------------------
LOG_DIR.mkdir(parents=True, exist_ok=True)
_logfile = open(LOG_DIR / "launcher.log", "a", encoding="utf-8")

def log(msg: str):
    linea = f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
    print(linea, flush=True)
    _logfile.write(linea + "\n")
    _logfile.flush()


def pg_bin(nombre: str) -> str:
    exe = PG_BIN / (nombre + ".exe")
    return str(exe) if exe.exists() else nombre


# -- PostgreSQL portable ---------------------------------------------------------
def inicializar_bd():
    if (PG_DATA / "PG_VERSION").exists():
        return  # ya inicializada

    # Si quedo una inicializacion fallida a medias, limpiarla
    if PG_DATA.exists() and any(PG_DATA.iterdir()):
        log("Limpiando inicializacion previa incompleta...")
        import shutil
        shutil.rmtree(PG_DATA)

    log("Inicializando base de datos por primera vez...")
    APP_DATA.mkdir(parents=True, exist_ok=True)

    # initdb necesita la clave en un ARCHIVO temporal
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as pw:
        pw.write(DB_PASS)
        pwfile = pw.name

    try:
        resultado = subprocess.run(
            [pg_bin("initdb"),
             "-D", str(PG_DATA),
             "-U", DB_USER,
             "--encoding=UTF8",
             "--locale=C",
             "--pwfile", pwfile],
            capture_output=True, text=True,
        )
    finally:
        os.unlink(pwfile)

    if resultado.returncode != 0:
        log(f"ERROR initdb: {resultado.stderr or resultado.stdout}")
        sys.exit(1)

    # Conexiones locales con password
    (PG_DATA / "pg_hba.conf").write_text(
        "host  all  all  127.0.0.1/32  md5\n"
        "host  all  all  ::1/128       md5\n"
    )
    # Puerto propio para no chocar con un PostgreSQL del sistema
    conf = PG_DATA / "postgresql.conf"
    texto = conf.read_text(encoding="utf-8")
    texto = texto.replace("#port = 5432", f"port = {DB_PORT}")
    conf.write_text(texto, encoding="utf-8")
    log("Base de datos inicializada.")


def arrancar_postgres():
    global pg_started
    resultado = subprocess.run(
        [pg_bin("pg_ctl"), "start", "-D", str(PG_DATA),
         "-l", str(LOG_DIR / "postgres.log"), "-w"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0,
    )
    if resultado.returncode != 0:
        log("pg_ctl start devolvio error; verificando si ya esta corriendo...")
    for _ in range(30):
        check = subprocess.run(
            [pg_bin("pg_isready"), "-h", "127.0.0.1", "-p", DB_PORT],
            capture_output=True,
        )
        if check.returncode == 0:
            pg_started = True
            log(f"PostgreSQL listo en puerto {DB_PORT}.")
            return
        time.sleep(1)
    log("ERROR: PostgreSQL no respondio en 30s. Revisa logs/postgres.log")
    sys.exit(1)


def crear_bd_si_no_existe():
    env = {**os.environ, "PGPASSWORD": DB_PASS}
    base = [pg_bin("psql"), "-h", "127.0.0.1", "-p", DB_PORT,
            "-U", DB_USER, "-d", "postgres", "-tAc"]
    r = subprocess.run(
        base + [f"SELECT 1 FROM pg_database WHERE datname='{DB_NAME}'"],
        env=env, capture_output=True, text=True,
    )
    if "1" not in (r.stdout or ""):
        subprocess.run(
            [pg_bin("createdb"), "-h", "127.0.0.1", "-p", DB_PORT,
             "-U", DB_USER, DB_NAME],
            env=env, capture_output=True,
        )
        log(f"Base de datos '{DB_NAME}' creada.")


def detener_postgres():
    if pg_started:
        log("Deteniendo PostgreSQL...")
        subprocess.run(
            [pg_bin("pg_ctl"), "stop", "-D", str(PG_DATA), "-m", "fast"],
            capture_output=True,
        )


# -- Backend FastAPI --------------------------------------------------------------
def arrancar_backend():
    global uv_proc
    CERT_DIR.mkdir(parents=True, exist_ok=True)
    COMP_DIR.mkdir(parents=True, exist_ok=True)

    entorno = {
        **os.environ,
        "DATABASE_URL": DB_URL,
        "MEDICORE_CERT_DIR": str(CERT_DIR),
        "MEDICORE_COMP_DIR": str(COMP_DIR),
        "FRONTEND_URL": "http://localhost:8000",
    }

    log_uv = open(LOG_DIR / "backend.log", "a", encoding="utf-8")

    if getattr(sys, "frozen", False):
        # Empaquetado: uvicorn esta dentro del bundle; lo lanzamos en un hilo
        # del MISMO proceso para no depender de un uvicorn.exe externo.
        def _correr():
            try:
                # En el bundle, el codigo de app/ esta junto al ejecutable
                # (en _internal). Buscamos donde este realmente "app".
                posibles = [BACKEND, BASE_DIR, Path(sys._MEIPASS) if hasattr(sys, "_MEIPASS") else BASE_DIR]
                ruta_app = None
                for p in posibles:
                    if (Path(p) / "app").exists():
                        ruta_app = Path(p)
                        break
                if ruta_app is None:
                    raise FileNotFoundError("No se encontro la carpeta 'app' en el bundle")
                os.chdir(str(ruta_app))
                sys.path.insert(0, str(ruta_app))
                os.environ.update(entorno)
                import uvicorn
                uvicorn.run("app.main:app", host="127.0.0.1", port=8000, log_config=None)
            except Exception as e:
                import traceback
                log(f"ERROR BACKEND: {e}")
                log(traceback.format_exc())

        hilo = threading.Thread(target=_correr, daemon=True)
        hilo.start()
    else:
        uv_proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app",
             "--host", "127.0.0.1", "--port", "8000"],
            cwd=str(BACKEND), env=entorno,
            stdout=log_uv, stderr=log_uv,
        )

    import urllib.request
    for _ in range(40):
        try:
            urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=2)
            log("Backend listo en http://localhost:8000")
            return
        except Exception:
            time.sleep(1)
    log("ERROR: el backend no respondio. Revisa logs/backend.log")


def apagar(signum=None, frame=None):
    log("Cerrando MediCore...")
    if uv_proc and uv_proc.poll() is None:
        uv_proc.terminate()
    detener_postgres()
    log("MediCore cerrado.")
    sys.exit(0)


signal.signal(signal.SIGINT, apagar)
signal.signal(signal.SIGTERM, apagar)


if __name__ == "__main__":
    log("=== Iniciando MediCore ===")
    log(f"Base: {BASE_DIR}")
    log(f"Datos: {APP_DATA}")
    try:
        inicializar_bd()
        arrancar_postgres()
        crear_bd_si_no_existe()
        arrancar_backend()
        threading.Timer(1.5, lambda: webbrowser.open("http://localhost:8000")).start()
        log("Aplicacion lista: http://localhost:8000")
        while True:
            time.sleep(2)
    except KeyboardInterrupt:
        apagar()
    except Exception as e:
        import traceback
        log(f"ERROR FATAL: {e}")
        log(traceback.format_exc())
        detener_postgres()
        sys.exit(1)