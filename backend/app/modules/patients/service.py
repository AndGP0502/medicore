from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.modules.patients.models import Patient
from app.modules.patients.schemas import PatientCreate, PatientUpdate
from app.utils.pagination import paginate

class PatientService:
    def create(self, db: Session, data: PatientCreate) -> Patient:
        existing = db.query(Patient).filter(Patient.document_number == data.document_number, Patient.is_deleted == False).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe un paciente con ese documento")
        deleted = db.query(Patient).filter(Patient.document_number == data.document_number, Patient.is_deleted == True).first()
        if deleted:
            for field, value in data.model_dump().items():
                setattr(deleted, field, value)
            deleted.is_deleted = False
            deleted.deleted_at = None
            db.commit()
            db.refresh(deleted)
            return deleted
        patient = Patient(**data.model_dump())
        db.add(patient)
        db.commit()
        db.refresh(patient)
        return patient

    def get_all(self, db: Session, search: str = "", page: int = 1, size: int = 20):
        q = db.query(Patient).filter(Patient.is_deleted == False)
        if search:
            term = f"%{search}%"
            q = q.filter((Patient.first_name.ilike(term)) | (Patient.last_name.ilike(term)) | (Patient.document_number.ilike(term)))
        return paginate(q.order_by(Patient.last_name), page, size)

    def get_by_id(self, db: Session, patient_id: str) -> Patient:
        p = db.query(Patient).filter(Patient.id == patient_id, Patient.is_deleted == False).first()
        if not p:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        return p

    def update(self, db: Session, patient_id: str, data: PatientUpdate) -> Patient:
        p = self.get_by_id(db, patient_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(p, field, value)
        db.commit()
        db.refresh(p)
        return p

    def delete(self, db: Session, patient_id: str) -> None:
        p = self.get_by_id(db, patient_id)
        p.is_deleted = True
        db.commit()

patient_service = PatientService()
