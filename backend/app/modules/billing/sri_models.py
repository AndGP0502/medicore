from sqlalchemy import Column, String, Integer
from app.models.base_model import TimeStampedModel

class ConfiguracionSRI(TimeStampedModel):
    __tablename__ = "configuracion_sri"
    id = Column(Integer, primary_key=True, default=1)
    ruc = Column(String(13), nullable=False)
    razon_social = Column(String(300), nullable=False)
    nombre_comercial = Column(String(300))
    direccion_matriz = Column(String(500))
    direccion_sucursal = Column(String(500))
    codigo_establecimiento = Column(String(3), default="001")
    punto_emision = Column(String(3), default="001")
    ambiente = Column(Integer, default=2)
    tipo_emision = Column(Integer, default=1)
    ruta_certificado = Column(String(500))
    clave_certificado = Column(String(200))
    siguiente_secuencial = Column(Integer, default=1)
    clave_sri = Column(String(200))


class ConfiguracionEmail(TimeStampedModel):
    """Configuración SMTP para enviar facturas al cliente."""
    __tablename__ = "configuracion_email"
    id = Column(Integer, primary_key=True, default=1)
    host = Column(String(200), nullable=False, default="smtp.gmail.com")
    puerto = Column(Integer, nullable=False, default=587)
    usuario = Column(String(200), nullable=False)
    clave = Column(String(200), nullable=False)
    remitente_nombre = Column(String(200))
    usar_tls = Column(Integer, default=1)  # 1 = STARTTLS (587), 0 = SSL (465)
    envio_automatico = Column(Integer, default=1)  # enviar al autorizar


class ComprobanteEmitido(TimeStampedModel):
    """Registro de comprobantes autorizados: rutas del XML/RIDE y estado del correo."""
    __tablename__ = "comprobantes_emitidos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    invoice_id = Column(String(36), nullable=False, index=True)
    clave_acceso = Column(String(49), nullable=False, unique=True)
    numero_autorizacion = Column(String(49))
    fecha_autorizacion = Column(String(40))
    ruta_xml = Column(String(500))
    ruta_pdf = Column(String(500))
    correo_destinatario = Column(String(200))
    correo_enviado = Column(Integer, default=0)
    correo_error = Column(String(500))
