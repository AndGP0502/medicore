from datetime import datetime
import uuid

fecha = "2026-06-07"
tipo_comprobante = "01"
ruc = "1752384303001"
ambiente = 1
codigo_establecimiento = "001"
punto_emision = "001"
secuencial = "000000001"
codigo_numerico = str(uuid.uuid4().int)[:8]
tipo_emision = 1

fecha_fmt = datetime.strptime(fecha, "%Y-%m-%d").strftime("%d%m%Y")
serie = codigo_establecimiento + punto_emision

clave_sin_dv = f"{fecha_fmt}{tipo_comprobante}{ruc}{ambiente}{serie}{secuencial}{codigo_numerico}{tipo_emision}"
print(f"Clave sin DV: {clave_sin_dv}")
print(f"Longitud sin DV: {len(clave_sin_dv)}")

def modulo11(clave):
    factores = [2, 3, 4, 5, 6, 7]
    suma = 0
    factor_idx = 0
    for digito in reversed(clave):
        suma += int(digito) * factores[factor_idx % 6]
        factor_idx += 1
    residuo = suma % 11
    if residuo == 0: return 0
    if residuo == 1: return 1
    return 11 - residuo

dv = modulo11(clave_sin_dv)
clave_completa = clave_sin_dv + str(dv)
print(f"Clave completa: {clave_completa}")
print(f"Longitud final: {len(clave_completa)}")
