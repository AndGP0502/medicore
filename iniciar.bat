@echo off
title MediCore - Sistema de Gestion Clinica
echo Iniciando MediCore...

:: Configurar Java
set JAVA_HOME=%~dp0jdk
set PATH=%JAVA_HOME%\bin;%PATH%

:: Iniciar PostgreSQL con Docker
echo Iniciando base de datos...
docker start medicore_postgres 2>nul || docker run -d --name medicore_postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=medicore -p 5432:5432 postgres:15-alpine

:: Esperar que PostgreSQL arranque
timeout /t 5 /nobreak >nul

:: Iniciar backend
echo Iniciando servidor...
start "" "%~dp0backend\medicore-backend.exe"

:: Esperar que el backend arranque
timeout /t 5 /nobreak >nul

:: Abrir navegador
echo Abriendo MediCore en el navegador...
start "" "http://localhost:8000"

echo MediCore iniciado correctamente.
echo Para cerrar, cierre esta ventana y detenga Docker Desktop.
pause
