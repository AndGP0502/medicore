from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal
from datetime import datetime
from app.modules.billing.models import Invoice, InvoiceItem, Payment, InvoiceStatus
from app.modules.billing.sri_models import ConfiguracionSRI
from app.modules.billing.schemas import InvoiceCreate, PaymentCreate
from app.modules.billing.sri_schemas import ConfigSRICreate
from app.utils.pagination import paginate


class BillingService:
    def _next_number(self, db: Session) -> str:
        count = db.query(Invoice).count()
        return f"FAC-{count + 1:06d}"

    def create_invoice(self, db: Session, data: InvoiceCreate) -> Invoice:
        subtotal = sum(item.quantity * item.unit_price for item in data.items)
        tax = subtotal * Decimal("0.15")
        invoice = Invoice(patient_id=data.patient_id, number=self._next_number(db), subtotal=subtotal, tax=tax, total=subtotal + tax, notes=data.notes)
        db.add(invoice)
        db.flush()
        for item in data.items:
            db.add(InvoiceItem(invoice_id=invoice.id, description=item.description, quantity=item.quantity, unit_price=item.unit_price, total=item.quantity * item.unit_price))
        db.commit()
        db.refresh(invoice)
        return invoice

    def get_all(self, db: Session, page: int = 1, size: int = 20):
        q = db.query(Invoice).filter(Invoice.is_deleted == False).order_by(Invoice.created_at.desc())
        return paginate(q, page, size)

    def get_by_id(self, db: Session, invoice_id: str) -> Invoice:
        i = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.is_deleted == False).first()
        if not i:
            raise HTTPException(status_code=404, detail="Factura no encontrada")
        return i

    def delete_invoice(self, db: Session, invoice_id: str):
        invoice = self.get_by_id(db, invoice_id)
        invoice.soft_delete()
        db.commit()
        return {"message": "Factura eliminada"}

    def add_payment(self, db: Session, data: PaymentCreate) -> Payment:
        invoice = self.get_by_id(db, str(data.invoice_id))
        payment = Payment(**data.model_dump(), paid_at=datetime.utcnow())
        db.add(payment)
        paid = sum(p.amount for p in invoice.payments) + data.amount
        invoice.status = InvoiceStatus.PAID if paid >= invoice.total else InvoiceStatus.PARTIAL
        db.commit()
        db.refresh(payment)
        return payment

    def get_config_sri(self, db: Session) -> ConfiguracionSRI:
        config = db.query(ConfiguracionSRI).filter(ConfiguracionSRI.id == 1).first()
        if not config:
            raise HTTPException(status_code=404, detail="No hay configuracion SRI guardada")
        return config

    def save_config_sri(self, db: Session, data: ConfigSRICreate) -> ConfiguracionSRI:
        config = db.query(ConfiguracionSRI).filter(ConfiguracionSRI.id == 1).first()
        if config:
            for field, value in data.model_dump().items():
                setattr(config, field, value)
        else:
            config = ConfiguracionSRI(id=1, **data.model_dump())
            db.add(config)
        db.commit()
        db.refresh(config)
        return config

    def emitir_factura_sri(self, db: Session, invoice_id: str) -> dict:
        from app.sri.xml_generator import generar_xml_factura
        from app.sri.signer import firmar_xml
        from app.sri.sri_client import enviar_comprobante, consultar_autorizacion
        import time

        config = db.query(ConfiguracionSRI).filter(ConfiguracionSRI.id == 1).first()
        if not config:
            raise HTTPException(status_code=400, detail="No hay configuracion SRI. Configura primero.")

        invoice = self.get_by_id(db, invoice_id)
        patient = invoice.patient

        config_dict = {
            "ruc": config.ruc, "razon_social": config.razon_social,
            "nombre_comercial": config.nombre_comercial, "direccion_matriz": config.direccion_matriz,
            "direccion_sucursal": config.direccion_sucursal, "codigo_establecimiento": config.codigo_establecimiento,
            "punto_emision": config.punto_emision, "ambiente": config.ambiente, "tipo_emision": config.tipo_emision,
            "ruta_certificado": config.ruta_certificado, "clave_certificado": config.clave_certificado,
        }

        factura_dict = {
            "fecha_emision": datetime.utcnow().strftime("%Y-%m-%d"),
            "identificacion": patient.document_number if patient else "9999999999999",
            "razon_social": f"{patient.first_name} {patient.last_name}" if patient else "CONSUMIDOR FINAL",
            "tipo_identificacion": "05",
            "correo": patient.email or "" if patient else "",
            "telefono": patient.phone or "" if patient else "",
            "direccion": patient.address or "N/A" if patient else "N/A",
            "secuencial": config.siguiente_secuencial,
        }

        detalles = []
        for item in invoice.items:
            precio = float(item.unit_price)
            cantidad = float(item.quantity)
            subtotal = precio * cantidad
            iva = subtotal * 0.15
            detalles.append({"descripcion": item.description, "cantidad": cantidad, "precio_unitario": precio, "descuento": 0, "porcentaje_iva": 15, "subtotal": subtotal, "iva": iva, "total": subtotal + iva})

        try:
            xml_content, clave_acceso, secuencial = generar_xml_factura(config_dict, factura_dict, detalles)
            xml_firmado = firmar_xml(xml_content, config.ruta_certificado, config.clave_certificado)
            resultado_envio = enviar_comprobante(xml_firmado, config.ambiente)
            if not resultado_envio["ok"]:
                return {"ok": False, "error": f"SRI rechazo: {resultado_envio['mensajes']}"}
            time.sleep(10)
            resultado_auth = consultar_autorizacion(clave_acceso, config.ambiente)
            config.siguiente_secuencial += 1
            db.commit()
            return {"ok": resultado_auth.get("ok", False), "estado": resultado_auth.get("estado", "PENDIENTE"), "clave_acceso": clave_acceso, "numero_autorizacion": resultado_auth.get("numero_autorizacion", ""), "factura_id": invoice_id}
        except Exception as e:
            return {"ok": False, "error": str(e)}


billing_service = BillingService()
