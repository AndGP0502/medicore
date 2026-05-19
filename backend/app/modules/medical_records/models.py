import uuid
from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base_model import SoftDeleteModel

class MedicalRecord(SoftDeleteModel):
    __tablename__ = "medical_records"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)
    chief_complaint = Column(Text)
    anamnesis = Column(Text)
    vital_signs = Column(JSON)
    physical_exam = Column(Text)
    diagnosis = Column(JSON)
    treatment = Column(Text)
    prescriptions = Column(JSON)
    notes = Column(Text)
    patient = relationship("Patient", back_populates="medical_records")
    doctor = relationship("User")
    appointment = relationship("Appointment", back_populates="medical_record")

class RecordTemplate(SoftDeleteModel):
    __tablename__ = "record_templates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    specialty_name = Column(String(100), nullable=False)
    fields = Column(JSON, nullable=False)
