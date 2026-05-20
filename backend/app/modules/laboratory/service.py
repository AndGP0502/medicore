from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.modules.laboratory.models import LabOrder, LabResult, LabOrderStatus
from app.modules.laboratory.schemas import LabOrderCreate, LabResultCreate, LabOrderUpdate
from app.utils.pagination import paginate

class LaboratoryService:
    def create_order(self, db: Session, data: LabOrderCreate) -> LabOrder:
        order = LabOrder(**data.model_dump())
        db.add(order)
        db.commit()
        db.refresh(order)
        return order

    def get_order(self, db: Session, order_id: str) -> LabOrder:
        o = db.query(LabOrder).filter(LabOrder.id == order_id, LabOrder.is_deleted == False).first()
        if not o:
            raise HTTPException(status_code=404, detail="Orden no encontrada")
        return o

    def update_order(self, db: Session, order_id: str, data: LabOrderUpdate) -> LabOrder:
        o = self.get_order(db, order_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(o, field, value)
        db.commit()
        db.refresh(o)
        return o

    def delete_order(self, db: Session, order_id: str) -> None:
        o = self.get_order(db, order_id)
        o.is_deleted = True
        db.commit()

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
