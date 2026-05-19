import uuid
from sqlalchemy import Column, String, Integer
from sqlalchemy.dialects.postgresql import UUID
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
