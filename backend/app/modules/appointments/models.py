import uuid, enum
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.models.base_model import SoftDeleteModel

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"; CONFIRMED = "confirmed"; IN_PROGRESS = "in_progress"
    COMPLETED = "completed"; CANCELLED = "cancelled"; NO_SHOW = "no_show"

class Appointment(SoftDeleteModel):
    __tablename__ = "appointments"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(String(10), default="30")
    status = Column(SAEnum(AppointmentStatus), default=AppointmentStatus.SCHEDULED)
    reason = Column(String(500))
    notes = Column(Text)
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("User")
    medical_record = relationship("MedicalRecord", back_populates="appointment", uselist=False)
