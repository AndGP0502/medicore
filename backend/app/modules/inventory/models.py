import uuid, enum
from sqlalchemy import Column, String, Numeric, Integer, ForeignKey, Enum as SAEnum, Date, Text, Boolean
from sqlalchemy.orm import relationship
from app.models.base_model import SoftDeleteModel

class MovementType(str, enum.Enum):
    IN = "in"; OUT = "out"; ADJUSTMENT = "adjustment"; EXPIRED = "expired"

class Product(SoftDeleteModel):
    __tablename__ = "products"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(300), nullable=False)
    generic_name = Column(String(300))
    sku = Column(String(100), unique=True)
    category = Column(String(100))
    unit = Column(String(50), default="unidad")
    min_stock = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    lots = relationship("Lot", back_populates="product")

class Lot(SoftDeleteModel):
    __tablename__ = "lots"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    lot_number = Column(String(100))
    quantity = Column(Numeric(10, 2), default=0)
    purchase_price = Column(Numeric(10, 2))
    sale_price = Column(Numeric(10, 2))
    expiry_date = Column(Date, nullable=True)
    product = relationship("Product", back_populates="lots")

class StockMovement(SoftDeleteModel):
    __tablename__ = "stock_movements"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    lot_id = Column(String(36), ForeignKey("lots.id"), nullable=True)
    type = Column(SAEnum(MovementType), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    reference = Column(String(200))
    notes = Column(Text)
