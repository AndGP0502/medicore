from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import date

class ProductCreate(BaseModel):
    name: str
    generic_name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    unit: str = "unidad"
    min_stock: int = 0

class ProductOut(BaseModel):
    id: UUID
    name: str
    generic_name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    unit: str
    min_stock: int

    class Config:
        from_attributes = True

class LotCreate(BaseModel):
    product_id: UUID
    lot_number: Optional[str] = None
    quantity: Decimal
    purchase_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    expiry_date: Optional[date] = None
