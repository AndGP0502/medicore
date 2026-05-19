import uuid, enum
from sqlalchemy import Column, String, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base_model import SoftDeleteModel

class LabOrderStatus(str, enum.Enum):
    PENDING = "pending"; PROCESSING = "processing"; COMPLETED = "completed"; CANCELLED = "cancelled"

class LabOrder(SoftDeleteModel):
    __tablename__ = "lab_orders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    record_id = Column(UUID(as_uuid=True), ForeignKey("medical_records.id"), nullable=True)
    status = Column(SAEnum(LabOrderStatus), default=LabOrderStatus.PENDING)
    tests = Column(Text)
    notes = Column(Text)
    results = relationship("LabResult", back_populates="order")

class LabResult(SoftDeleteModel):
    __tablename__ = "lab_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("lab_orders.id"), nullable=False)
    test_name = Column(String(200), nullable=False)
    value = Column(String(500))
    unit = Column(String(50))
    reference_range = Column(String(200))
    is_abnormal = Column(String(10))
    file_path = Column(String(500))
    order = relationship("LabOrder", back_populates="results")
