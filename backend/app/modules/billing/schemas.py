from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from app.modules.billing.models import InvoiceStatus, PaymentMethod

class InvoiceItemCreate(BaseModel):
    description: str
    quantity: Decimal = Decimal("1")
    unit_price: Decimal

class InvoiceCreate(BaseModel):
    patient_id: UUID
    items: List[InvoiceItemCreate]
    notes: Optional[str] = None

class PaymentCreate(BaseModel):
    invoice_id: UUID
    amount: Decimal
    method: PaymentMethod
    reference: Optional[str] = None

class InvoiceItemOut(BaseModel):
    id: UUID
    description: str
    quantity: Decimal
    unit_price: Decimal
    total: Decimal

    class Config:
        from_attributes = True

class InvoiceOut(BaseModel):
    id: UUID
    number: str
    patient_id: UUID
    status: InvoiceStatus
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    notes: Optional[str] = None
    items: List[InvoiceItemOut] = []

    class Config:
        from_attributes = True
