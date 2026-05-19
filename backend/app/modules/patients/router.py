from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.dependencies import get_db, get_current_user
from app.modules.patients.schemas import PatientCreate, PatientUpdate, PatientOut
from app.modules.patients.service import patient_service
from app.schemas.common import PaginatedResponse, MessageResponse

router = APIRouter(prefix="/patients", tags=["Pacientes"])

@router.get("", response_model=PaginatedResponse[PatientOut])
def list_patients(search: Optional[str] = Query(""), page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100), db: Session = Depends(get_db), _=Depends(get_current_user)):
    return patient_service.get_all(db, search, page, size)

@router.post("", response_model=PatientOut, status_code=201)
def create_patient(data: PatientCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return patient_service.create(db, data)

@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return patient_service.get_by_id(db, patient_id)

@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(patient_id: str, data: PatientUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return patient_service.update(db, patient_id, data)
