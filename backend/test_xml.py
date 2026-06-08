import requests
from lxml import etree

# Descargar XSD del SRI
xsd_url = "https://www.sri.gob.ec/web/guest/facturacion-electronica"

# Validar estructura basica
with open("debug_xml_sin_firmar.xml", "rb") as f:
    content = f.read()

doc = etree.fromstring(content)
print("Elementos raiz:", doc.tag)
print("Hijos:", [c.tag for c in doc])
print("Atributos factura:", doc.attrib)

# Verificar elementos obligatorios
elementos = [c.tag for c in doc]
requeridos = ["infoTributaria", "infoFactura", "detalles"]
for r in requeridos:
    print(f"{r}: {'OK' if r in elementos else 'FALTA'}")
