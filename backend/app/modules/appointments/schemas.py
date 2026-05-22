from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.modules.appointments.models import AppointmentStatus


class AppointmentCreate(BaseModel):
    patient_id: UUID
    doctor_id: UUID
    scheduled_at: datetime
    duration_minutes: str = "30"
    reason: Optional[str] = None
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None


class PatientBasic(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    document_number: str

    class Config:
        from_attributes = True


class AppointmentOut(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    scheduled_at: datetime
    duration_minutes: str
    status: AppointmentStatus
    reason: Optional[str] = None
    patient: Optional[PatientBasic] = None

    class Config:
        from_attributes = True
