import uuid
import enum
from sqlalchemy import Column, String, Date, Text, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base_model import SoftDeleteModel

class BloodType(str, enum.Enum):
    A_POS = "A+"; A_NEG = "A-"; B_POS = "B+"; B_NEG = "B-"
    AB_POS = "AB+"; AB_NEG = "AB-"; O_POS = "O+"; O_NEG = "O-"

class Gender(str, enum.Enum):
    MALE = "male"; FEMALE = "female"; OTHER = "other"

class Patient(SoftDeleteModel):
    __tablename__ = "patients"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_type = Column(String(20), default="cedula")
    document_number = Column(String(30), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(SAEnum(Gender), nullable=False)
    blood_type = Column(SAEnum(BloodType), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    allergies = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    contacts = relationship("PatientContact", back_populates="patient")
    insurance = relationship("Insurance", back_populates="patient", uselist=False)
    appointments = relationship("Appointment", back_populates="patient")
    medical_records = relationship("MedicalRecord", back_populates="patient")

class PatientContact(SoftDeleteModel):
    __tablename__ = "patient_contacts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    name = Column(String(200), nullable=False)
    relation = Column(String(50))
    phone = Column(String(20))
    is_emergency = Column(Boolean, default=False)
    patient = relationship("Patient", back_populates="contacts")

class Insurance(SoftDeleteModel):
    __tablename__ = "insurances"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, unique=True)
    provider = Column(String(200), nullable=False)
    policy_number = Column(String(100))
    plan = Column(String(100))
    expiry_date = Column(Date, nullable=True)
    patient = relationship("Patient", back_populates="insurance")
