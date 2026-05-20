from pydantic import BaseModel
from typing import Optional
from datetime import date

class PatientCreate(BaseModel):
    document_type: str = "cedula"
    document_number: str
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    allergies: Optional[str] = None
    notes: Optional[str] = None

class PatientUpdate(BaseModel):
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    allergies: Optional[str] = None
    notes: Optional[str] = None

class PatientOut(BaseModel):
    id: str
    document_type: str
    document_number: str
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    allergies: Optional[str] = None

    class Config:
        from_attributes = True
