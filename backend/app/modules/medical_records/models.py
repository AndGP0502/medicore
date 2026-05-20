import uuid
from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base_model import SoftDeleteModel

class MedicalRecord(SoftDeleteModel):
    __tablename__ = "medical_records"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    appointment_id = Column(String(36), ForeignKey("appointments.id"), nullable=True)
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
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    specialty_name = Column(String(100), nullable=False)
    fields = Column(JSON, nullable=False)
