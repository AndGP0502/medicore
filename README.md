# MediCore

CRM para consultorios médicos, diseñado para optimizar la administración de pacientes, citas y procesos de facturación.

## Funcionalidades

- Gestión de pacientes
- Administración de citas médicas
- Historiales clínicos
- Módulo de facturación integrado
- Gestión de datos mediante base de datos SQL
- Integración con APIs
- Lógica de negocio orientada a la operación diaria de un consultorio

## Stack
- FastAPI
- React
- PostgreSQL
- Docker

## Cómo ejecutarlo

1. Clonar el repositorio: https://github.com/AndGP0502/medicore.git
2. Backend: crear venv en `backend/`, `pip install -r requirements.txt`, definir `.env` (ver `deploy/medicore.env.example`) y correr `uvicorn app.main:app`.
3. Frontend: `npm install && npm run dev` en `frontend/`.

## Despliegue en producción (VPS)

Ver [DEPLOYMENT.md](DEPLOYMENT.md) — aprovisionamiento completo con un solo script (`deploy/setup_vps.sh`): HTTPS automático, Postgres y Ollama solo en localhost, backups diarios y systemd.

## Autor

André Miguel Garzón Paucar
