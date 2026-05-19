from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from app.modules.laboratory.models import LabOrderStatus

class LabOrderCreate(BaseModel):
    patient_id: UUID
    doctor_id: UUID
    record_id: Optional[UUID] = None
    tests: Optional[str] = None
    notes: Optional[str] = None

class LabResultCreate(BaseModel):
    order_id: UUID
    test_name: str
    value: Optional[str] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    is_abnormal: Optional[str] = None

class LabOrderOut(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    status: LabOrderStatus
    tests: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True
