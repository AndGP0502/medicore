from lxml import etree
from signxml import XMLSigner, methods
from cryptography.hazmat.primitives.serialization.pkcs12 import load_key_and_certificates
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption


def firmar_xml(xml_content: str, ruta_p12: str, clave_p12: str) -> str:
    with open(ruta_p12, "rb") as f:
        datos_p12 = f.read()
    clave_bytes = clave_p12.encode("utf-8")
    clave_privada, certificado, _ = load_key_and_certificates(datos_p12, clave_bytes)
    key_pem = clave_privada.private_bytes(encoding=Encoding.PEM, format=PrivateFormat.PKCS8, encryption_algorithm=NoEncryption())
    cert_pem = certificado.public_bytes(Encoding.PEM)
    signer = XMLSigner(method=methods.enveloped, signature_algorithm="rsa-sha256", digest_algorithm="sha256", c14n_algorithm="http://www.w3.org/2006/12/xml-c14n11")
    root = etree.fromstring(xml_content.encode("utf-8"))
    signed = signer.sign(root, key=key_pem, cert=cert_pem)
    return etree.tostring(signed, pretty_print=True, encoding="unicode")
