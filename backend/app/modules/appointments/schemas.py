from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.modules.appointments.models import AppointmentStatus

class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: str
    scheduled_at: datetime
    duration_minutes: str = "30"
    reason: Optional[str] = None
    notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    status: Optional[AppointmentStatus] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    duration_minutes: Optional[str] = None

class AppointmentOut(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    scheduled_at: datetime
    duration_minutes: str
    status: AppointmentStatus
    reason: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True
