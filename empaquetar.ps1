# empaquetar.ps1
# Ejecutar desde C:\Users\USER\Desktop\medicore\ con:
#   powershell -ExecutionPolicy Bypass -File empaquetar.ps1

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot

Write-Host "=== MediCore - Empaquetador ===" -ForegroundColor Cyan
Write-Host "Directorio: $ROOT"

# -- 0a. Matar procesos que bloquean dist --
Write-Host "`n[0/5] Cerrando procesos previos..." -ForegroundColor Yellow
Stop-Process -Name MediCore -Force -ErrorAction SilentlyContinue
Stop-Process -Name postgres -Force -ErrorAction SilentlyContinue
Stop-Process -Name pg_ctl -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Borrar dist con reintentos (Windows tarda en soltar los handles)
if (Test-Path "$ROOT\dist") {
    $intentos = 0
    while ($intentos -lt 5) {
        try {
            Remove-Item "$ROOT\dist" -Recurse -Force -ErrorAction Stop
            break
        } catch {
            $intentos++
            Write-Host "dist bloqueada, reintento $intentos/5..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        }
    }
    if (Test-Path "$ROOT\dist") {
        Write-Error "No se pudo borrar dist\. Cierra cualquier explorador o consola dentro de esa carpeta y reintenta."
        exit 1
    }
}
Write-Host "Procesos cerrados y dist limpia" -ForegroundColor Green

# -- 0b. Restaurar main.py de desarrollo si quedo de una corrida fallida --
$mainDev = "$ROOT\backend\app\main_dev.py"
$mainProd = "$ROOT\backend\app\main.py"
$mainExe = "$ROOT\main_exe.py"
if (Test-Path $mainDev) {
    Copy-Item $mainDev $mainProd -Force
    Remove-Item $mainDev -Force
}

# -- 1. Build del frontend --
Write-Host "`n[1/5] Compilando frontend React..." -ForegroundColor Yellow
Set-Location "$ROOT\frontend"
npm install --silent
npm run build
if (-not (Test-Path "$ROOT\frontend\dist\index.html")) {
    Write-Error "ERROR: el build del frontend no genero index.html"
    exit 1
}
Write-Host "Frontend compilado OK" -ForegroundColor Green

# -- 2. Instalar dependencias Python --
Write-Host "`n[2/5] Instalando dependencias Python..." -ForegroundColor Yellow
Set-Location "$ROOT"
pip install -r requirements_exe.txt --quiet --only-binary=psycopg2-binary
pip install pyinstaller aiofiles --quiet
Write-Host "Dependencias OK" -ForegroundColor Green

# -- 3. Activar main.py de produccion --
Write-Host "`n[3/5] Preparando backend para produccion..." -ForegroundColor Yellow
Copy-Item $mainProd $mainDev -Force
Copy-Item $mainExe $mainProd -Force
Write-Host "main.py de produccion activado" -ForegroundColor Green

# -- 4. PyInstaller --
Write-Host "`n[4/5] Empaquetando con PyInstaller (puede tardar varios minutos)..." -ForegroundColor Yellow
Set-Location "$ROOT"
pyinstaller medicore.spec --noconfirm
$exeOk = Test-Path "$ROOT\dist\MediCore\MediCore.exe"

# Restaurar main.py de desarrollo SIEMPRE
Copy-Item $mainDev $mainProd -Force
Remove-Item $mainDev -Force

if (-not $exeOk) {
    Write-Error "ERROR: PyInstaller no genero MediCore.exe"
    exit 1
}
Write-Host "PyInstaller OK" -ForegroundColor Green

# -- 5. Copiar PostgreSQL portable --
Write-Host "`n[5/5] Copiando PostgreSQL portable..." -ForegroundColor Yellow
$PG_SRC = "$ROOT\pgsql"
$PG_DST = "$ROOT\dist\MediCore\pgsql"
if (Test-Path $PG_SRC) {
    Copy-Item $PG_SRC $PG_DST -Recurse -Force
    Write-Host "PostgreSQL portable copiado" -ForegroundColor Green
} else {
    Write-Host "ADVERTENCIA: carpeta pgsql\ no encontrada en $ROOT" -ForegroundColor Red
}

Write-Host "`n=== EMPAQUETADO COMPLETO ===" -ForegroundColor Cyan
Write-Host "Resultado en: $ROOT\dist\MediCore\" -ForegroundColor Green
Write-Host "Prueba con: cd dist\MediCore ; .\MediCore.exe"
Write-Host "Luego: abrir medicore_setup.iss en Inno Setup y compilar"