"""
Migración única: asegura que la columna iva_porcentaje exista en invoice_items.
Ejecutar UNA vez: python migrar_iva.py
(Es idempotente: si la columna ya existe, no hace nada.)
"""
from app.database.session import engine
from sqlalchemy import text

with engine.begin() as conn:
    conn.execute(text(
        "ALTER TABLE invoice_items "
        "ADD COLUMN IF NOT EXISTS iva_porcentaje NUMERIC(5,2) DEFAULT 0"
    ))
print("OK: columna iva_porcentaje verificada/creada en invoice_items")