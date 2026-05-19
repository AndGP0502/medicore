from pydantic import BaseModel
from typing import Optional

class ConfigSRICreate(BaseModel):
    ruc: str
    razon_social: str
    nombre_comercial: Optional[str] = None
    direccion_matriz: Optional[str] = None
    direccion_sucursal: Optional[str] = None
    codigo_establecimiento: str = "001"
    punto_emision: str = "001"
    ambiente: int = 2
    tipo_emision: int = 1
    ruta_certificado: Optional[str] = None
    clave_certificado: Optional[str] = None
    clave_sri: Optional[str] = None

class ConfigSRIOut(ConfigSRICreate):
    id: int
    siguiente_secuencial: int

    class Config:
        from_attributes = True

class EmitirFacturaRequest(BaseModel):
    invoice_id: str
