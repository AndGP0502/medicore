"""
Envío de comprobantes electrónicos por correo (XML + RIDE en PDF).
Solo librería estándar (smtplib + email) — compatible con PyInstaller.
"""

import os
import smtplib
import ssl
from email.message import EmailMessage


def enviar_factura_correo(
    smtp_config: dict,
    destinatario: str,
    razon_social_emisor: str,
    numero_factura: str,
    importe_total: str,
    ruta_xml: str,
    ruta_pdf: str,
) -> dict:
    """
    Envía la factura electrónica al cliente con el XML y el RIDE adjuntos.

    smtp_config requiere: host, puerto, usuario, clave, remitente_nombre,
    usar_tls (True para STARTTLS puerto 587, False para SSL puerto 465).
    """
    if not destinatario or "@" not in destinatario:
        return {"ok": False, "error": "El cliente no tiene un correo válido registrado."}

    msg = EmailMessage()
    msg["Subject"] = f"Factura electrónica {numero_factura} - {razon_social_emisor}"
    msg["From"] = f"{smtp_config.get('remitente_nombre') or razon_social_emisor} <{smtp_config['usuario']}>"
    msg["To"] = destinatario

    msg.set_content(
        f"Estimado cliente,\n\n"
        f"Adjuntamos su factura electrónica No. {numero_factura} "
        f"por un valor de ${importe_total}, autorizada por el SRI.\n\n"
        f"Encontrará adjuntos:\n"
        f"  - El comprobante en formato XML (documento tributario)\n"
        f"  - La representación impresa (RIDE) en PDF\n\n"
        f"Este es un correo automático, por favor no responder.\n\n"
        f"Atentamente,\n{razon_social_emisor}"
    )

    for ruta, mime in [(ruta_xml, ("application", "xml")), (ruta_pdf, ("application", "pdf"))]:
        if ruta and os.path.exists(ruta):
            with open(ruta, "rb") as f:
                msg.add_attachment(
                    f.read(),
                    maintype=mime[0],
                    subtype=mime[1],
                    filename=os.path.basename(ruta),
                )

    try:
        contexto = ssl.create_default_context()
        host = smtp_config["host"]
        puerto = int(smtp_config["puerto"])

        if smtp_config.get("usar_tls", True):
            # STARTTLS (típico puerto 587 — Gmail, Outlook)
            with smtplib.SMTP(host, puerto, timeout=30) as server:
                server.starttls(context=contexto)
                server.login(smtp_config["usuario"], smtp_config["clave"])
                server.send_message(msg)
        else:
            # SSL directo (típico puerto 465)
            with smtplib.SMTP_SSL(host, puerto, context=contexto, timeout=30) as server:
                server.login(smtp_config["usuario"], smtp_config["clave"])
                server.send_message(msg)

        return {"ok": True, "destinatario": destinatario}

    except smtplib.SMTPAuthenticationError:
        return {"ok": False, "error": "Usuario o clave SMTP incorrectos. Si usas Gmail, necesitas una 'contraseña de aplicación', no tu clave normal."}
    except Exception as e:
        return {"ok": False, "error": f"Error enviando correo: {e}"}


def probar_conexion_smtp(smtp_config: dict) -> dict:
    """Prueba la conexión y autenticación SMTP sin enviar nada."""
    try:
        contexto = ssl.create_default_context()
        host = smtp_config["host"]
        puerto = int(smtp_config["puerto"])
        if smtp_config.get("usar_tls", True):
            with smtplib.SMTP(host, puerto, timeout=15) as server:
                server.starttls(context=contexto)
                server.login(smtp_config["usuario"], smtp_config["clave"])
        else:
            with smtplib.SMTP_SSL(host, puerto, context=contexto, timeout=15) as server:
                server.login(smtp_config["usuario"], smtp_config["clave"])
        return {"ok": True}
    except smtplib.SMTPAuthenticationError:
        return {"ok": False, "error": "Autenticación fallida. Si usas Gmail, genera una 'contraseña de aplicación' en https://myaccount.google.com/apppasswords"}
    except Exception as e:
        return {"ok": False, "error": str(e)}
