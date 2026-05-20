from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class MedicalRecordCreate(BaseModel):
    patient_id: str
    doctor_id: str
    appointment_id: Optional[str] = None
    chief_complaint: Optional[str] = None
    anamnesis: Optional[str] = None
    vital_signs: Optional[Dict[str, Any]] = None
    physical_exam: Optional[str] = None
    diagnosis: Optional[List[Dict]] = None
    treatment: Optional[str] = None
    prescriptions: Optional[List[Dict]] = None
    notes: Optional[str] = None

class MedicalRecordOut(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    chief_complaint: Optional[str] = None
    anamnesis: Optional[str] = None
    vital_signs: Optional[Dict[str, Any]] = None
    physical_exam: Optional[str] = None
    diagnosis: Optional[List[Dict]] = None
    treatment: Optional[str] = None
    prescriptions: Optional[List[Dict]] = None
    notes: Optional[str] = None
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True
