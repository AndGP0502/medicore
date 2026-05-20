from pydantic import BaseModel
from typing import Optional
from app.modules.laboratory.models import LabOrderStatus

class LabOrderCreate(BaseModel):
    patient_id: str
    doctor_id: str
    record_id: Optional[str] = None
    tests: Optional[str] = None
    notes: Optional[str] = None

class LabOrderUpdate(BaseModel):
    status: Optional[LabOrderStatus] = None
    tests: Optional[str] = None
    notes: Optional[str] = None

class LabResultCreate(BaseModel):
    order_id: str
    test_name: str
    value: Optional[str] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    is_abnormal: Optional[str] = None

class LabOrderOut(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    status: LabOrderStatus
    tests: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True
