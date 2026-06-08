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

# Clave sin digito verificador (48 digitos)
clave_sin_dv = "070620260117523843030011001001000000001"
# Completar a 48 digitos
print(f"Longitud clave sin DV: {len(clave_sin_dv)}")
dv = modulo11(clave_sin_dv)
clave_completa = clave_sin_dv + str(dv)
print(f"Clave completa: {clave_completa}")
print(f"Longitud: {len(clave_completa)}")
