from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.modules.billing.schemas import InvoiceCreate, PaymentCreate, InvoiceOut
from app.modules.billing.sri_schemas import ConfigSRICreate, ConfigSRIOut
from app.modules.billing.service import billing_service
from app.schemas.common import PaginatedResponse, MessageResponse

router = APIRouter(prefix="/billing", tags=["Facturacion"])

@router.get("/invoices", response_model=PaginatedResponse[InvoiceOut])
def list_invoices(page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100), db: Session = Depends(get_db), _=Depends(get_current_user)):
    return billing_service.get_all(db, page, size)

@router.post("/invoices", response_model=InvoiceOut, status_code=201)
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return billing_service.create_invoice(db, data)

@router.get("/invoices/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return billing_service.get_by_id(db, invoice_id)

@router.delete("/invoices/{invoice_id}", response_model=MessageResponse)
def delete_invoice(invoice_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return billing_service.delete_invoice(db, invoice_id)

@router.post("/payments", status_code=201)
def add_payment(data: PaymentCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return billing_service.add_payment(db, data)

@router.get("/config-sri", response_model=ConfigSRIOut)
def get_config_sri(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return billing_service.get_config_sri(db)

@router.post("/config-sri", response_model=ConfigSRIOut)
def save_config_sri(data: ConfigSRICreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return billing_service.save_config_sri(db, data)

@router.post("/invoices/{invoice_id}/emitir")
def emitir_factura(invoice_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return billing_service.emitir_factura_sri(db, invoice_id)
