from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID

class MedicalRecordCreate(BaseModel):
    patient_id: UUID
    doctor_id: UUID
    appointment_id: Optional[UUID] = None
    chief_complaint: Optional[str] = None
    anamnesis: Optional[str] = None
    vital_signs: Optional[Dict[str, Any]] = None
    physical_exam: Optional[str] = None
    diagnosis: Optional[List[Dict]] = None
    treatment: Optional[str] = None
    prescriptions: Optional[List[Dict]] = None
    notes: Optional[str] = None

class MedicalRecordOut(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    chief_complaint: Optional[str] = None
    vital_signs: Optional[Dict[str, Any]] = None
    diagnosis: Optional[List[Dict]] = None
    treatment: Optional[str] = None

    class Config:
        from_attributes = True
