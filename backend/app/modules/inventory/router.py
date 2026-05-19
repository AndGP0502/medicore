from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.dependencies import get_db, get_current_user
from app.modules.inventory.schemas import ProductCreate, ProductOut, LotCreate
from app.modules.inventory.service import inventory_service
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/inventory", tags=["Inventario"])

@router.get("/products", response_model=PaginatedResponse[ProductOut])
def list_products(search: Optional[str] = Query(""), page: int = 1, size: int = 20, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return inventory_service.get_all(db, search, page, size)

@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(data: ProductCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return inventory_service.create_product(db, data)

@router.post("/lots", status_code=201)
def add_lot(data: LotCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return inventory_service.add_lot(db, data)
