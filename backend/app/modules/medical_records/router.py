from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.modules.medical_records.schemas import MedicalRecordCreate, MedicalRecordOut
from app.modules.medical_records.service import medical_record_service
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/medical-records", tags=["Historia Clinica"])

@router.post("", response_model=MedicalRecordOut, status_code=201)
def create_record(data: MedicalRecordCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return medical_record_service.create(db, data)

@router.get("/patient/{patient_id}", response_model=PaginatedResponse[MedicalRecordOut])
def get_patient_records(patient_id: str, page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100), db: Session = Depends(get_db), _=Depends(get_current_user)):
    return medical_record_service.get_by_patient(db, patient_id, page, size)

@router.get("/{record_id}", response_model=MedicalRecordOut)
def get_record(record_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return medical_record_service.get_by_id(db, record_id)

@router.delete("/{record_id}", status_code=204)
def delete_record(record_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    medical_record_service.delete(db, record_id)
