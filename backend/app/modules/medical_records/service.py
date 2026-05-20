from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.modules.medical_records.models import MedicalRecord
from app.modules.medical_records.schemas import MedicalRecordCreate
from app.utils.pagination import paginate

class MedicalRecordService:
    def create(self, db: Session, data: MedicalRecordCreate) -> MedicalRecord:
        record = MedicalRecord(**data.model_dump())
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def get_by_patient(self, db: Session, patient_id: str, page: int = 1, size: int = 20):
        q = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient_id, MedicalRecord.is_deleted == False).order_by(MedicalRecord.created_at.desc())
        return paginate(q, page, size)

    def get_by_id(self, db: Session, record_id: str) -> MedicalRecord:
        r = db.query(MedicalRecord).filter(MedicalRecord.id == record_id, MedicalRecord.is_deleted == False).first()
        if not r:
            raise HTTPException(status_code=404, detail="Historia clinica no encontrada")
        return r

    def delete(self, db: Session, record_id: str) -> None:
        r = self.get_by_id(db, record_id)
        r.is_deleted = True
        db.commit()

medical_record_service = MedicalRecordService()
