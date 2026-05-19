import uuid, enum
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base_model import SoftDeleteModel

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"; CONFIRMED = "confirmed"; IN_PROGRESS = "in_progress"
    COMPLETED = "completed"; CANCELLED = "cancelled"; NO_SHOW = "no_show"

class Appointment(SoftDeleteModel):
    __tablename__ = "appointments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(String(10), default="30")
    status = Column(SAEnum(AppointmentStatus), default=AppointmentStatus.SCHEDULED)
    reason = Column(String(500))
    notes = Column(Text)
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("User")
    medical_record = relationship("MedicalRecord", back_populates="appointment", uselist=False)
