from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.modules.appointments.models import Appointment
from app.modules.appointments.schemas import AppointmentCreate, AppointmentUpdate
from app.utils.pagination import paginate

class AppointmentService:
    def create(self, db: Session, data: AppointmentCreate) -> Appointment:
        appt = Appointment(**data.model_dump())
        db.add(appt)
        db.commit()
        db.refresh(appt)
        return appt

    def get_all(self, db: Session, doctor_id: str = None, page: int = 1, size: int = 20):
        q = db.query(Appointment).filter(Appointment.is_deleted == False)
        if doctor_id:
            q = q.filter(Appointment.doctor_id == doctor_id)
        return paginate(q.order_by(Appointment.scheduled_at), page, size)

    def get_by_id(self, db: Session, appt_id: str) -> Appointment:
        a = db.query(Appointment).filter(Appointment.id == appt_id, Appointment.is_deleted == False).first()
        if not a:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        return a

    def update(self, db: Session, appt_id: str, data: AppointmentUpdate) -> Appointment:
        a = self.get_by_id(db, appt_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(a, field, value)
        db.commit()
        db.refresh(a)
        return a

appointment_service = AppointmentService()
