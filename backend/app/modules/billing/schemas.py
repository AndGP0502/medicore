from pydantic import BaseModel, field_validator
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from app.modules.billing.models import InvoiceStatus, PaymentMethod

class InvoiceItemCreate(BaseModel):
    description: str
    quantity: Decimal = Decimal("1")
    unit_price: Decimal
    iva_porcentaje: Decimal = Decimal("0")  # 0 = servicios medicos, 15 = tarifa general

    @field_validator("iva_porcentaje")
    @classmethod
    def validar_iva(cls, v):
        if v not in (Decimal("0"), Decimal("15")):
            raise ValueError("El IVA debe ser 0 o 15")
        return v

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
    iva_porcentaje: Decimal = Decimal("0")
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
