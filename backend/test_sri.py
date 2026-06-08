import base64
from zeep import Client

xml_test = '<?xml version="1.0" encoding="UTF-8"?><factura id="comprobante" version="2.1.0"><infoTributaria><ambiente>1</ambiente><tipoEmision>1</tipoEmision><razonSocial>TEST</razonSocial><nombreComercial>TEST</nombreComercial><ruc>1752384303001</ruc><claveAcceso>0706202601175238430300110010010000000012700000011</claveAcceso><codDoc>01</codDoc><estab>001</estab><ptoEmi>001</ptoEmi><secuencial>000000001</secuencial><dirMatriz>Quito</dirMatriz></infoTributaria></factura>'

xml_b64 = base64.b64encode(xml_test.encode("utf-8")).decode("utf-8")
client = Client("https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl")
response = client.service.validarComprobante(xml=xml_b64)
print("Estado:", response.estado)
if hasattr(response, "comprobantes") and response.comprobantes:
    for comp in response.comprobantes.comprobante:
        if hasattr(comp, "mensajes"):
            for m in comp.mensajes.mensaje:
                print("Error:", m.identificador, "-", m.mensaje)
