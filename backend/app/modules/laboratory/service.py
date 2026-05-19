from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.modules.laboratory.models import LabOrder, LabResult, LabOrderStatus
from app.modules.laboratory.schemas import LabOrderCreate, LabResultCreate
from app.utils.pagination import paginate

class LaboratoryService:
    def create_order(self, db: Session, data: LabOrderCreate) -> LabOrder:
        order = LabOrder(**data.model_dump())
        db.add(order)
        db.commit()
        db.refresh(order)
        return order

    def add_result(self, db: Session, data: LabResultCreate) -> LabResult:
        result = LabResult(**data.model_dump())
        db.add(result)
        order = db.query(LabOrder).filter(LabOrder.id == data.order_id).first()
        if order:
            order.status = LabOrderStatus.COMPLETED
        db.commit()
        db.refresh(result)
        return result

    def get_orders(self, db: Session, patient_id: str = None, page: int = 1, size: int = 20):
        q = db.query(LabOrder).filter(LabOrder.is_deleted == False)
        if patient_id:
            q = q.filter(LabOrder.patient_id == patient_id)
        return paginate(q.order_by(LabOrder.created_at.desc()), page, size)

lab_service = LaboratoryService()
