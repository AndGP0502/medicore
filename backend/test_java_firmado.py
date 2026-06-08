import base64
from zeep import Client

with open("debug_xml_java_firmado.xml", "rb") as f:
    xml_bytes = f.read()

# Quitar BOM si existe
if xml_bytes.startswith(b"\xef\xbb\xbf"):
    xml_bytes = xml_bytes[3:]

print("Primeros 150 bytes:", xml_bytes[:150])
print("Tiene Signature:", b"Signature" in xml_bytes)

xml_b64 = base64.b64encode(xml_bytes).decode("utf-8")
client = Client("https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl")
response = client.service.validarComprobante(xml=xml_b64)
print("Estado:", response.estado)
if hasattr(response, "comprobantes") and response.comprobantes:
    for comp in response.comprobantes.comprobante:
        if hasattr(comp, "mensajes"):
            for m in comp.mensajes.mensaje:
                print("Error:", m.identificador, "-", m.mensaje)
