from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.dependencies import get_db, get_current_user
from app.modules.laboratory.schemas import LabOrderCreate, LabResultCreate, LabOrderOut
from app.modules.laboratory.service import lab_service
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/laboratory", tags=["Laboratorio"])

@router.get("/orders", response_model=PaginatedResponse[LabOrderOut])
def list_orders(patient_id: Optional[str] = None, page: int = 1, size: int = 20, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return lab_service.get_orders(db, patient_id, page, size)

@router.post("/orders", response_model=LabOrderOut, status_code=201)
def create_order(data: LabOrderCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return lab_service.create_order(db, data)

@router.post("/results", status_code=201)
def add_result(data: LabResultCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return lab_service.add_result(db, data)
