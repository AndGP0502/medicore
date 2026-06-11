from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal
from datetime import datetime
from app.modules.billing.models import Invoice, InvoiceItem, Payment, InvoiceStatus
from app.modules.billing.sri_models import ConfiguracionSRI
from app.modules.billing.schemas import InvoiceCreate, PaymentCreate
from app.modules.billing.sri_schemas import ConfigSRICreate
from app.modules.patients.models import Patient
from app.utils.pagination import paginate
import os
import traceback


class BillingService:
    def _next_number(self, db: Session) -> str:
        count = db.query(Invoice).count()
        return f"FAC-{count + 1:06d}"

    def create_invoice(self, db: Session, data: InvoiceCreate) -> Invoice:
        subtotal = sum(item.quantity * item.unit_price for item in data.items)
        tax = sum(
            item.quantity * item.unit_price * (item.iva_porcentaje / Decimal("100"))
            for item in data.items
        )
        invoice = Invoice(
            patient_id=data.patient_id,
            number=self._next_number(db),
            subtotal=subtotal,
            tax=tax,
            total=subtotal + tax,
            notes=data.notes
        )
        db.add(invoice)
        db.flush()
        for item in data.items:
            db.add(InvoiceItem(
                invoice_id=invoice.id,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                iva_porcentaje=item.iva_porcentaje,
                total=item.quantity * item.unit_price
            ))
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

    def get_config_sri_safe(self, db: Session):
        config = db.query(ConfiguracionSRI).filter(ConfiguracionSRI.id == 1).first()
        if not config:
            return {"configured": False}
        return {
            "configured": True,
            "id": config.id,
            "ruc": config.ruc,
            "razon_social": config.razon_social,
            "nombre_comercial": config.nombre_comercial,
            "direccion_matriz": config.direccion_matriz,
            "direccion_sucursal": config.direccion_sucursal,
            "codigo_establecimiento": config.codigo_establecimiento,
            "punto_emision": config.punto_emision,
            "ambiente": config.ambiente,
            "tipo_emision": config.tipo_emision,
            "siguiente_secuencial": config.siguiente_secuencial,
            "tiene_certificado": bool(config.ruta_certificado and os.path.exists(config.ruta_certificado)),
        }

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
            raise HTTPException(status_code=400, detail="No hay configuracion SRI.")

        if not config.ruta_certificado or not os.path.exists(config.ruta_certificado):
            raise HTTPException(status_code=400, detail="No hay certificado .p12 cargado.")

        if not config.clave_certificado:
            raise HTTPException(status_code=400, detail="Falta la clave del certificado .p12.")

        invoice = self.get_by_id(db, invoice_id)
        patient = db.query(Patient).filter(Patient.id == invoice.patient_id).first()

        config_dict = {
            "ruc": config.ruc,
            "razon_social": config.razon_social,
            "nombre_comercial": config.nombre_comercial or config.razon_social,
            "direccion_matriz": config.direccion_matriz,
            "direccion_sucursal": config.direccion_sucursal or config.direccion_matriz,
            "codigo_establecimiento": config.codigo_establecimiento,
            "punto_emision": config.punto_emision,
            "ambiente": config.ambiente,
            "tipo_emision": config.tipo_emision,
            "ruta_certificado": config.ruta_certificado,
            "clave_certificado": config.clave_certificado,
        }

        factura_dict = {
            "fecha_emision": datetime.now().strftime("%Y-%m-%d"),
            "identificacion": patient.document_number if patient else "9999999999999",
            "razon_social": f"{patient.first_name} {patient.last_name}" if patient else "CONSUMIDOR FINAL",
            "tipo_identificacion": "05",
            "correo": (patient.email or "") if patient else "",
            "telefono": (patient.phone or "") if patient else "",
            "direccion": (patient.address or "N/A") if patient else "N/A",
            "secuencial": config.siguiente_secuencial,
        }

        detalles = []
        for item in invoice.items:
            precio = float(item.unit_price)
            cantidad = float(item.quantity)
            subtotal = precio * cantidad
            pct_iva = float(item.iva_porcentaje or 0)
            iva = subtotal * (pct_iva / 100.0)
            detalles.append({
                "descripcion": item.description,
                "cantidad": cantidad,
                "precio_unitario": precio,
                "descuento": 0,
                "porcentaje_iva": int(pct_iva),
                "subtotal": subtotal,
                "iva": iva,
                "total": subtotal + iva,
            })

        try:
            print("=== [SRI] PASO 1: Generando XML ===")
            xml_content, clave_acceso, secuencial = generar_xml_factura(config_dict, factura_dict, detalles)
            print(f"=== [SRI] Clave acceso: {clave_acceso}")
            print(f"=== [SRI] Ambiente: {config.ambiente}")
            print(f"=== [SRI] RUC: {config.ruc}")

            # Guardar XML sin firmar para debug y para Java
            with open("debug_xml_sin_firmar.xml", "w", encoding="utf-8") as f:
                f.write(xml_content)
            print("=== XML sin firmar guardado ===")

            print("=== [SRI] PASO 2: Firmando XML ===")
            xml_firmado = firmar_xml(xml_content, config.ruta_certificado, config.clave_certificado)
            print("=== [SRI] Firma OK ===")
            print(f"=== XML firmado length: {len(xml_firmado)}")
            print(f"=== XML firmado inicio: {xml_firmado[:200]}")

            # Guardar XML firmado para debug
            with open("debug_xml_firmado.xml", "w", encoding="utf-8") as f:
                f.write(xml_firmado)
            print("=== XML firmado guardado ===")

            print("=== [SRI] PASO 3: Enviando al SRI ===")
            resultado_envio = enviar_comprobante(xml_firmado, config.ambiente)
            print(f"=== [SRI] Resultado envio: {resultado_envio}")

            if not resultado_envio["ok"]:
                return {"ok": False, "error": f"SRI rechazo: {resultado_envio['mensajes']}"}

            print("=== [SRI] PASO 4: Consultando autorizacion ===")
            resultado_auth = {"ok": False, "estado": "PENDIENTE"}
            for intento in range(10):
                time.sleep(15)
                resultado_auth = consultar_autorizacion(clave_acceso, config.ambiente)
                print(f"=== [SRI] Intento {intento+1}: {resultado_auth}")
                if resultado_auth.get("ok") or resultado_auth.get("estado") not in ("PENDIENTE", "ERROR"):
                    break

            correo_resultado = None
            if resultado_auth.get("ok"):
                config.siguiente_secuencial += 1
                invoice.status = InvoiceStatus.PAID
                db.commit()
                print("=== [SRI] AUTORIZADO OK ===")

                # PASO 5: guardar XML/RIDE y enviar correo (no rompe la emisión si falla)
                try:
                    correo_resultado = self._procesar_comprobante_autorizado(
                        db, invoice, config, clave_acceso, resultado_auth, factura_dict
                    )
                except Exception as e:
                    print(f"=== [CORREO] ERROR no fatal: {e} ===")
                    traceback.print_exc()
                    correo_resultado = {"ok": False, "error": str(e)}

            return {
                "ok": resultado_auth.get("ok", False),
                "estado": resultado_auth.get("estado", "PENDIENTE"),
                "clave_acceso": clave_acceso,
                "numero_autorizacion": resultado_auth.get("numero_autorizacion", ""),
                "factura_id": invoice_id,
                "mensajes": str(resultado_auth.get("mensajes", "")),
                "correo": correo_resultado,
            }

        except Exception as e:
            print(f"=== [SRI] ERROR: {e} ===")
            traceback.print_exc()
            return {"ok": False, "error": str(e)}

    # ──────────────────────────────────────────────────────────────────
    # RIDE + correo
    # ──────────────────────────────────────────────────────────────────

    def _procesar_comprobante_autorizado(self, db, invoice, config, clave_acceso,
                                         resultado_auth, factura_dict) -> dict:
        """Guarda XML autorizado + RIDE en comprobantes/ y envía correo al cliente."""
        from app.modules.billing.sri_models import ComprobanteEmitido, ConfiguracionEmail
        from app.sri.ride import generar_ride
        from app.sri.emailer import enviar_factura_correo

        carpeta = os.path.join("comprobantes", clave_acceso[:8])  # subcarpeta por fecha ddmmyyyy
        os.makedirs(carpeta, exist_ok=True)

        xml_autorizado = resultado_auth.get("xml_autorizado", "")
        numero_aut = resultado_auth.get("numero_autorizacion", clave_acceso)
        fecha_aut = resultado_auth.get("fecha_autorizacion", "")

        ruta_xml = os.path.join(carpeta, f"{clave_acceso}.xml")
        with open(ruta_xml, "w", encoding="utf-8") as f:
            f.write(xml_autorizado)

        ruta_pdf = os.path.join(carpeta, f"{clave_acceso}.pdf")
        generar_ride(xml_autorizado, numero_aut, fecha_aut, ruta_pdf)
        print(f"=== [RIDE] Generado: {ruta_pdf} ===")

        comp = ComprobanteEmitido(
            invoice_id=str(invoice.id),
            clave_acceso=clave_acceso,
            numero_autorizacion=numero_aut,
            fecha_autorizacion=fecha_aut,
            ruta_xml=ruta_xml,
            ruta_pdf=ruta_pdf,
            correo_destinatario=factura_dict.get("correo", ""),
        )
        db.add(comp)
        db.commit()
        db.refresh(comp)

        # Enviar correo si hay configuración y envío automático activo
        cfg_email = db.query(ConfiguracionEmail).filter(ConfiguracionEmail.id == 1).first()
        if not cfg_email:
            return {"ok": False, "error": "Correo no configurado (Configuración → Correo)."}
        if not cfg_email.envio_automatico:
            return {"ok": False, "error": "Envío automático desactivado."}

        return self._enviar_correo_comprobante(db, comp, config, cfg_email)

    def _enviar_correo_comprobante(self, db, comp, config_sri, cfg_email) -> dict:
        from app.sri.emailer import enviar_factura_correo
        from lxml import etree

        root = etree.fromstring(open(comp.ruta_xml, encoding="utf-8").read().encode("utf-8"))
        numero = f"{root.findtext('.//estab')}-{root.findtext('.//ptoEmi')}-{root.findtext('.//secuencial')}"
        total = root.findtext(".//importeTotal", "0.00")

        resultado = enviar_factura_correo(
            smtp_config={
                "host": cfg_email.host, "puerto": cfg_email.puerto,
                "usuario": cfg_email.usuario, "clave": cfg_email.clave,
                "remitente_nombre": cfg_email.remitente_nombre,
                "usar_tls": bool(cfg_email.usar_tls),
            },
            destinatario=comp.correo_destinatario,
            razon_social_emisor=config_sri.razon_social,
            numero_factura=numero,
            importe_total=total,
            ruta_xml=comp.ruta_xml,
            ruta_pdf=comp.ruta_pdf,
        )
        comp.correo_enviado = 1 if resultado.get("ok") else 0
        comp.correo_error = None if resultado.get("ok") else str(resultado.get("error", ""))[:500]
        db.commit()
        print(f"=== [CORREO] Resultado: {resultado} ===")
        return resultado

    def reenviar_correo_factura(self, db, invoice_id: str, correo_destino: str = None) -> dict:
        """Reenvía el correo de una factura ya autorizada (opcionalmente a otro correo)."""
        from app.modules.billing.sri_models import ComprobanteEmitido, ConfiguracionEmail

        comp = (db.query(ComprobanteEmitido)
                .filter(ComprobanteEmitido.invoice_id == invoice_id)
                .order_by(ComprobanteEmitido.id.desc()).first())
        if not comp:
            raise HTTPException(status_code=404, detail="Esta factura no tiene comprobante autorizado.")
        if correo_destino:
            comp.correo_destinatario = correo_destino

        config_sri = db.query(ConfiguracionSRI).filter(ConfiguracionSRI.id == 1).first()
        cfg_email = db.query(ConfiguracionEmail).filter(ConfiguracionEmail.id == 1).first()
        if not cfg_email:
            raise HTTPException(status_code=400, detail="No hay configuración de correo.")
        return self._enviar_correo_comprobante(db, comp, config_sri, cfg_email)

    def get_config_email_safe(self, db) -> dict:
        from app.modules.billing.sri_models import ConfiguracionEmail
        cfg = db.query(ConfiguracionEmail).filter(ConfiguracionEmail.id == 1).first()
        if not cfg:
            return {"configured": False}
        return {
            "configured": True, "host": cfg.host, "puerto": cfg.puerto,
            "usuario": cfg.usuario, "remitente_nombre": cfg.remitente_nombre,
            "usar_tls": bool(cfg.usar_tls), "envio_automatico": bool(cfg.envio_automatico),
        }

    def save_config_email(self, db, data: dict) -> dict:
        from app.modules.billing.sri_models import ConfiguracionEmail
        cfg = db.query(ConfiguracionEmail).filter(ConfiguracionEmail.id == 1).first()
        if cfg:
            for campo, valor in data.items():
                if campo == "clave" and not valor:
                    continue  # mantener clave existente si llega vacía
                setattr(cfg, campo, int(valor) if campo in ("usar_tls", "envio_automatico") else valor)
        else:
            data["usar_tls"] = int(data.get("usar_tls", True))
            data["envio_automatico"] = int(data.get("envio_automatico", True))
            cfg = ConfiguracionEmail(id=1, **data)
            db.add(cfg)
        db.commit()
        return {"ok": True}


billing_service = BillingService()