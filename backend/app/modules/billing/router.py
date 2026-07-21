from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import shutil, os
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

@router.get("/config-sri")
def get_config_sri(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return billing_service.get_config_sri_safe(db)

@router.post("/config-sri")
def save_config_sri(data: ConfigSRICreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    # No devolver clave_certificado/clave_sri al navegador (ver SRI_FACTURADOR_LOCAL.md)
    billing_service.save_config_sri(db, data)
    return billing_service.get_config_sri_safe(db)

@router.post("/config-sri/upload-certificado")
def upload_certificado(file: UploadFile = File(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    if not file.filename.endswith('.p12'):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos .p12")
    from pathlib import Path
    # En produccion usa %APPDATA%/MediCore/certificados; en dev usa backend/certificados
    cert_dir = Path(os.environ.get("MEDICORE_CERT_DIR", "certificados"))
    cert_dir.mkdir(parents=True, exist_ok=True)
    dest = cert_dir / "firma.p12"
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    # Registrar la ruta en la configuración si ya existe (antes lo hacía el form de escritorio)
    from app.modules.billing.sri_models import ConfiguracionSRI
    config = db.query(ConfiguracionSRI).filter(ConfiguracionSRI.id == 1).first()
    if config:
        config.ruta_certificado = str(dest.resolve())
        db.commit()
    return {"message": "Certificado subido correctamente", "path": str(dest.resolve())}

@router.post("/config-sri/upload-logo")
def upload_logo(file: UploadFile = File(...), _=Depends(get_current_user)):
    ext = file.filename.lower().rsplit(".", 1)[-1]
    if ext not in ("png", "jpg", "jpeg"):
        raise HTTPException(status_code=400, detail="Solo se permiten imagenes PNG o JPG")
    from pathlib import Path
    cert_dir = Path(os.environ.get("MEDICORE_CERT_DIR", "certificados"))
    cert_dir.mkdir(parents=True, exist_ok=True)
    dest = cert_dir / "logo.png"
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"message": "Logo subido correctamente", "path": str(dest.resolve())}

@router.get("/config-sri/logo-status")
def logo_status(_=Depends(get_current_user)):
    from pathlib import Path
    logo = Path(os.environ.get("MEDICORE_CERT_DIR", "certificados")) / "logo.png"
    return {"existe": logo.exists()}

@router.post("/invoices/{invoice_id}/emitir")
def emitir_factura(invoice_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return billing_service.emitir_factura_sri(db, invoice_id)


# ── Correo electrónico ────────────────────────────────────────────────────

from pydantic import BaseModel as _BaseModel
from typing import Optional as _Optional


class ConfigEmailIn(_BaseModel):
    host: str
    puerto: int
    usuario: str
    clave: _Optional[str] = ""
    remitente_nombre: _Optional[str] = ""
    usar_tls: bool = True
    envio_automatico: bool = True


class ReenvioIn(_BaseModel):
    correo: _Optional[str] = None


@router.get("/config-email")
def get_config_email(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return billing_service.get_config_email_safe(db)


@router.post("/config-email")
def save_config_email(data: ConfigEmailIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return billing_service.save_config_email(db, data.model_dump())


@router.post("/config-email/probar")
def probar_config_email(db: Session = Depends(get_db), _=Depends(get_current_user)):
    from app.modules.billing.sri_models import ConfiguracionEmail
    from app.sri.emailer import probar_conexion_smtp
    cfg = db.query(ConfiguracionEmail).filter(ConfiguracionEmail.id == 1).first()
    if not cfg:
        raise HTTPException(status_code=400, detail="Primero guarda la configuración de correo.")
    resultado = probar_conexion_smtp({
        "host": cfg.host, "puerto": cfg.puerto, "usuario": cfg.usuario,
        "clave": cfg.clave, "usar_tls": bool(cfg.usar_tls),
    })
    if not resultado["ok"]:
        raise HTTPException(status_code=400, detail=resultado["error"])
    return resultado


@router.post("/invoices/{invoice_id}/reenviar-correo")
def reenviar_correo(invoice_id: str, data: ReenvioIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return billing_service.reenviar_correo_factura(db, invoice_id, data.correo)
