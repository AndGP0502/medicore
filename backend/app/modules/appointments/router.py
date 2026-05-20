from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.dependencies import get_db, get_current_user
from app.modules.appointments.schemas import AppointmentCreate, AppointmentUpdate, AppointmentOut
from app.modules.appointments.service import appointment_service
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/appointments", tags=["Agenda"])

@router.get("", response_model=PaginatedResponse[AppointmentOut])
def list_appointments(doctor_id: Optional[str] = None, page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100), db: Session = Depends(get_db), _=Depends(get_current_user)):
    return appointment_service.get_all(db, doctor_id, page, size)

@router.post("", response_model=AppointmentOut, status_code=201)
def create_appointment(data: AppointmentCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return appointment_service.create(db, data)

@router.get("/{appt_id}", response_model=AppointmentOut)
def get_appointment(appt_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return appointment_service.get_by_id(db, appt_id)

@router.put("/{appt_id}", response_model=AppointmentOut)
def update_appointment(appt_id: str, data: AppointmentUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return appointment_service.update(db, appt_id, data)

@router.delete("/{appt_id}", status_code=204)
def delete_appointment(appt_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    appointment_service.delete(db, appt_id)
