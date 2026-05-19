from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.modules.inventory.models import Product, Lot
from app.modules.inventory.schemas import ProductCreate, LotCreate
from app.utils.pagination import paginate

class InventoryService:
    def create_product(self, db: Session, data: ProductCreate) -> Product:
        product = Product(**data.model_dump())
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    def get_all(self, db: Session, search: str = "", page: int = 1, size: int = 20):
        q = db.query(Product).filter(Product.is_deleted == False, Product.is_active == True)
        if search:
            q = q.filter(Product.name.ilike(f"%{search}%"))
        return paginate(q.order_by(Product.name), page, size)

    def add_lot(self, db: Session, data: LotCreate) -> Lot:
        lot = Lot(**data.model_dump())
        db.add(lot)
        db.commit()
        db.refresh(lot)
        return lot

inventory_service = InventoryService()
