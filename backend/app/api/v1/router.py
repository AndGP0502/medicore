from fastapi import APIRouter
from app.modules.auth.router import router as auth_router
from app.modules.auth.users_router import router as users_router
from app.modules.patients.router import router as patients_router
from app.modules.appointments.router import router as appointments_router
from app.modules.medical_records.router import router as medical_records_router
from app.modules.billing.router import router as billing_router
from app.modules.inventory.router import router as inventory_router
from app.modules.laboratory.router import router as laboratory_router
from app.modules.reports.router import router as reports_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(patients_router)
api_router.include_router(appointments_router)
api_router.include_router(medical_records_router)
api_router.include_router(billing_router)
api_router.include_router(inventory_router)
api_router.include_router(laboratory_router)
api_router.include_router(reports_router)
