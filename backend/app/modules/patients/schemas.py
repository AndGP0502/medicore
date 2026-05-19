from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date
from app.modules.patients.models import BloodType, Gender

class PatientCreate(BaseModel):
    document_type: str = "cedula"
    document_number: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: Gender
    blood_type: Optional[BloodType] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    allergies: Optional[str] = None
    notes: Optional[str] = None

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    allergies: Optional[str] = None

class PatientOut(BaseModel):
    id: UUID
    document_number: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: Gender
    blood_type: Optional[BloodType] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True
