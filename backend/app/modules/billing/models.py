import uuid, enum
from sqlalchemy import Column, String, Numeric, ForeignKey, Enum as SAEnum, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.models.base_model import SoftDeleteModel

class InvoiceStatus(str, enum.Enum):
    PENDING = "pending"; PAID = "paid"; PARTIAL = "partial"; CANCELLED = "cancelled"

class PaymentMethod(str, enum.Enum):
    CASH = "cash"; CARD = "card"; TRANSFER = "transfer"; INSURANCE = "insurance"

class Invoice(SoftDeleteModel):
    __tablename__ = "invoices"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    number = Column(String(20), unique=True, nullable=False)
    status = Column(SAEnum(InvoiceStatus), default=InvoiceStatus.PENDING)
    subtotal = Column(Numeric(10, 2), default=0)
    tax = Column(Numeric(10, 2), default=0)
    total = Column(Numeric(10, 2), default=0)
    notes = Column(Text)
    items = relationship("InvoiceItem", back_populates="invoice")
    payments = relationship("Payment", back_populates="invoice")

class InvoiceItem(SoftDeleteModel):
    __tablename__ = "invoice_items"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=False)
    description = Column(String(300), nullable=False)
    quantity = Column(Numeric(10, 2), default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)
    iva_porcentaje = Column(Numeric(5, 2), default=0)  # 0 = servicios médicos (tarifa 0%), 15 = tarifa general
    total = Column(Numeric(10, 2), nullable=False)
    invoice = relationship("Invoice", back_populates="items")

class Payment(SoftDeleteModel):
    __tablename__ = "payments"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    method = Column(SAEnum(PaymentMethod), nullable=False)
    reference = Column(String(200))
    paid_at = Column(DateTime, nullable=False)
    invoice = relationship("Invoice", back_populates="payments")
