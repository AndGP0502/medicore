# Facturador SRI — referencia del funcionamiento LOCAL

Documento de referencia del módulo de facturación electrónica SRI **tal como
funciona en modo local/escritorio**, incluyendo el código original de las partes
que se ajustaron para la versión web (2026-07-19). El núcleo de firma
(`signer.py`, `xml_generator.py`, `sri_client.py`, `ride.py`, `emailer.py`)
**no fue modificado**.

## Mapa de archivos

| Archivo | Rol |
|---|---|
| `backend/app/sri/xml_generator.py` | Genera el XML de factura v2.1.0 + clave de acceso (módulo 11) |
| `backend/app/sri/signer.py` | Firma XAdES-BES con el .p12 (carga robusta multi-entidad: Lazzate/Uanataca/etc.) |
| `backend/app/sri/sri_client.py` | SOAP (zeep) contra SRI: recepción y autorización |
| `backend/app/sri/ride.py` | Genera el RIDE (PDF, reportlab) con logo opcional |
| `backend/app/sri/emailer.py` | Envía XML+RIDE por SMTP (smtplib estándar, TLS/SSL) |
| `backend/app/modules/billing/service.py` | Orquesta el flujo `emitir_factura_sri` completo |
| `backend/app/modules/billing/router.py` | Endpoints REST `/api/v1/billing/*` |
| `backend/app/modules/billing/sri_models.py` | Tablas: `ConfiguracionSRI` (id=1), `ConfiguracionEmail` (id=1), `ComprobanteEmitido` |

## Flujo de emisión (`POST /api/v1/billing/invoices/{id}/emitir`)

1. Lee `ConfiguracionSRI` (fila única id=1): RUC, razón social, establecimiento,
   punto de emisión, ambiente (1=pruebas/celcer, 2=producción/cel),
   `ruta_certificado` y `clave_certificado` (en texto plano en la DB).
2. Construye `factura_dict` con datos del paciente y `detalles` desde los items
   (cada detalle: descripcion, cantidad, precio_unitario, descuento,
   porcentaje_iva, subtotal, iva, total).
3. `generar_xml_factura(config, factura, detalles)` → `(xml, clave_acceso, secuencial)`.
4. `firmar_xml(xml, ruta_p12, clave)` → XAdES-BES embebido. El .p12 se abre en
   **cada** emisión (carga lazy: sin cert el sistema arranca igual, solo falla
   este endpoint — modo degradado).
5. `enviar_comprobante(xml_firmado, ambiente)` → SOAP `validarComprobante`
   (base64). OK si estado `RECIBIDA`.
6. Bucle de autorización: hasta **10 intentos × 15 s** (`time.sleep`) consultando
   `autorizacionComprobante`. Bloqueante: la petición HTTP puede durar ~150 s
   (endpoint sync `def` → corre en threadpool, no bloquea el resto del server).
7. Si `AUTORIZADO`: incrementa `siguiente_secuencial`, marca la factura PAID,
   guarda XML autorizado + RIDE en `$MEDICORE_COMP_DIR/<ddmmyyyy>/<clave>.{xml,pdf}`
   y envía correo al paciente si `ConfiguracionEmail.envio_automatico`.

## Rutas y datos en modo local

- `MEDICORE_CERT_DIR` / `MEDICORE_COMP_DIR` los fija `app/main.py`:
  dev → `backend/certificados` y `backend/comprobantes`; empaquetado (.exe) →
  `%APPDATA%/MediCore/…`. En el VPS resuelven a `/opt/medicore/backend/…`.
- El cert se sube por `POST /billing/config-sri/upload-certificado` →
  `$MEDICORE_CERT_DIR/firma.p12`; el frontend guarda la **ruta absoluta**
  devuelta en `ConfiguracionSRI.ruta_certificado`.
- Cert actual: Lazzate (`CN=Lazzate Emisor CA2`), titular André Garzón, válido
  hasta **2026-11-29**. La cadena NO es de confianza en producción SRI.
- Endpoints SOAP: `celcer.sri.gob.ec` (pruebas) / `cel.sri.gob.ec` (producción).

## Verificación realizada (2026-07-19, local)

- XML + firma XAdES: **OK** (pipeline completo en local con el .p12 real).
- Envío a celcer (pruebas): responde pero **DEVUELTA error 35** — la estructura
  del XML es idéntica tag-a-tag a comprobantes ya **AUTORIZADOS en producción**
  (11/06/2026, en `comprobantes/11062026/`), así que el error es ambiental
  (RUC/cert no habilitado en el ambiente de pruebas), no del código.
- Conclusión: el facturador **es funcional en servidor web** — no tiene
  dependencias de escritorio (sin Java en runtime, sin GUI, sin rutas Windows
  fijas; todo por env vars y SMTP/SOAP salientes).

## Código ORIGINAL de las partes ajustadas para la web

### 1. `router.py` — respuesta de guardar configuración (original)

Devolvía el modelo completo, **incluyendo `clave_certificado` y `clave_sri`**
en la respuesta HTTP (aceptable en escritorio; fuga en web):

```python
@router.post("/config-sri", response_model=ConfigSRIOut)
def save_config_sri(data: ConfigSRICreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return billing_service.save_config_sri(db, data)
```

### 2. `service.py` — XML de depuración (original)

Escribía en el directorio de trabajo; si la escritura fallaba, abortaba la
emisión real:

```python
# Guardar XML sin firmar para debug y para Java
with open("debug_xml_sin_firmar.xml", "w", encoding="utf-8") as f:
    f.write(xml_content)
print("=== XML sin firmar guardado ===")
...
with open("debug_xml_firmado.xml", "w", encoding="utf-8") as f:
    f.write(xml_firmado)
print("=== XML firmado guardado ===")
```

### 3. `service.py` — resolución del certificado (original)

Usaba únicamente la ruta absoluta guardada en la DB (se rompe si la DB se migra
del escritorio al VPS con paths de Windows):

```python
if not config.ruta_certificado or not os.path.exists(config.ruta_certificado):
    raise HTTPException(status_code=400, detail="No hay certificado .p12 cargado.")
...
xml_firmado = firmar_xml(xml_content, config.ruta_certificado, config.clave_certificado)
```

## Limitaciones conocidas (sin cambiar, documentadas)

1. `clave_certificado` y `clave_sri` se guardan **en texto plano** en la DB
   (cifrarlas tocaría el módulo aprobado; mitigado: DB solo en localhost del VPS).
2. La clave del .p12 aparece hardcodeada en `backend/test_cert.py` (script de
   prueba; considerar rotarla junto con el nuevo certificado).
3. El bucle de autorización (150 s máx) es sync; para la app móvil conviene a
   futuro un job asíncrono con polling desde el cliente.
4. Para probar en celcer hay que habilitar el RUC en ambiente de pruebas del SRI.
