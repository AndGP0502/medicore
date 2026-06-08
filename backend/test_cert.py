import ssl
import socket

# Conectar al SRI produccion y ver su certificado
context = ssl.create_default_context()
with socket.create_connection(("cel.sri.gob.ec", 443)) as sock:
    with context.wrap_socket(sock, server_hostname="cel.sri.gob.ec") as ssock:
        cert = ssock.getpeercert()
        print("Emisor SRI:", cert.get("issuer"))

# Ver el certificado de nuestro .p12
from cryptography.hazmat.primitives.serialization.pkcs12 import load_key_and_certificates
from cryptography.hazmat.primitives.serialization import Encoding

with open("certificados/firma.p12", "rb") as f:
    datos = f.read()

_, cert, chain = load_key_and_certificates(datos, b"UUqsvC")
print("Emisor nuestro certificado:", cert.issuer)
print("Valido hasta:", cert.not_valid_after_utc)
if chain:
    for c in chain:
        print("Cadena:", c.issuer)
