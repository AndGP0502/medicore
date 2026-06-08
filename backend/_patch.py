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
            "fecha_emision": datetime.utcnow().strftime("%Y-%m-%d"),
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
            iva = subtotal * 0.15
            detalles.append({
                "descripcion": item.description,
                "cantidad": cantidad,
                "precio_unitario": precio,
                "descuento": 0,
                "porcentaje_iva": 15,
                "subtotal": subtotal,
                "iva": iva,
                "total": subtotal + iva,
            })

        try:
            print("=== GENERANDO XML ===")
            xml_content, clave_acceso, secuencial = generar_xml_factura(config_dict, factura_dict, detalles)
            print(f"Clave acceso: {clave_acceso}")
            print(f"Ambiente: {config.ambiente}")

            print("=== FIRMANDO XML ===")
            xml_firmado = firmar_xml(xml_content, config.ruta_certificado, config.clave_certificado)
            print("Firma OK")

            print("=== ENVIANDO AL SRI ===")
            resultado_envio = enviar_comprobante(xml_firmado, config.ambiente)
            print(f"Resultado envio: {resultado_envio}")

            if not resultado_envio["ok"]:
                return {"ok": False, "error": f"SRI rechazo: {resultado_envio['mensajes']}"}

            print("=== CONSULTANDO AUTORIZACION ===")
            for intento in range(5):
                time.sleep(8)
                resultado_auth = consultar_autorizacion(clave_acceso, config.ambiente)
                print(f"Intento {intento+1}: {resultado_auth}")
                if resultado_auth.get("ok") or resultado_auth.get("estado") not in ("PENDIENTE", "ERROR"):
                    break

            if resultado_auth.get("ok"):
                config.siguiente_secuencial += 1
                invoice.status = InvoiceStatus.PAID
                db.commit()

            return {
                "ok": resultado_auth.get("ok", False),
                "estado": resultado_auth.get("estado", "PENDIENTE"),
                "clave_acceso": clave_acceso,
                "numero_autorizacion": resultado_auth.get("numero_autorizacion", ""),
                "factura_id": invoice_id,
                "mensajes": str(resultado_auth.get("mensajes", "")),
            }
        except Exception as e:
            print(f"=== ERROR: {e} ===")
            import traceback
            traceback.print_exc()
            return {"ok": False, "error": str(e)}
