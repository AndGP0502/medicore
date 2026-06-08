import base64
from zeep import Client

# XML minimo oficial SRI version 2.1.0
xml = '<?xml version="1.0" encoding="UTF-8"?><factura id="comprobante" version="2.1.0"><infoTributaria><ambiente>1</ambiente><tipoEmision>1</tipoEmision><razonSocial>PRUEBA</razonSocial><nombreComercial>PRUEBA</nombreComercial><ruc>1752384303001</ruc><claveAcceso>0806202601175238430300110010010000000013000000017</claveAcceso><codDoc>01</codDoc><estab>001</estab><ptoEmi>001</ptoEmi><secuencial>000000001</secuencial><dirMatriz>QUITO</dirMatriz></infoTributaria><infoFactura><fechaEmision>08/06/2026</fechaEmision><dirEstablecimiento>QUITO</dirEstablecimiento><obligadoContabilidad>NO</obligadoContabilidad><tipoIdentificacionComprador>05</tipoIdentificacionComprador><razonSocialComprador>CONSUMIDOR FINAL</razonSocialComprador><identificacionComprador>9999999999999</identificacionComprador><direccionComprador>N/A</direccionComprador><totalSinImpuestos>10.00</totalSinImpuestos><totalDescuento>0.00</totalDescuento><totalConImpuestos><totalImpuesto><codigo>2</codigo><codigoPorcentaje>5</codigoPorcentaje><baseImponible>10.00</baseImponible><tarifa>15.00</tarifa><valor>1.50</valor></totalImpuesto></totalConImpuestos><propina>0.00</propina><importeTotal>11.50</importeTotal><moneda>DOLAR</moneda><pagos><pago><formaPago>01</formaPago><total>11.50</total><plazo>0</plazo><unidadTiempo>dias</unidadTiempo></pago></pagos></infoFactura><detalles><detalle><codigoPrincipal>001</codigoPrincipal><descripcion>SERVICIO</descripcion><cantidad>1.00</cantidad><precioUnitario>10.00</precioUnitario><descuento>0.00</descuento><precioTotalSinImpuesto>10.00</precioTotalSinImpuesto><impuestos><impuesto><codigo>2</codigo><codigoPorcentaje>5</codigoPorcentaje><tarifa>15.00</tarifa><baseImponible>10.00</baseImponible><valor>1.50</valor></impuesto></impuestos></detalle></detalles><infoAdicional><campoAdicional nombre="email">test@test.com</campoAdicional></infoAdicional></factura>'

xml_b64 = base64.b64encode(xml.encode("utf-8")).decode("utf-8")
client = Client("https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl")
response = client.service.validarComprobante(xml=xml_b64)
print("Estado:", response.estado)
if hasattr(response, "comprobantes") and response.comprobantes:
    for comp in response.comprobantes.comprobante:
        if hasattr(comp, "mensajes"):
            for m in comp.mensajes.mensaje:
                print("Error:", m.identificador, "-", m.mensaje, "-", m.tipo)
