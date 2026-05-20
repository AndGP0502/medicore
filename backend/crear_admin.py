from app.database.session import SessionLocal
from app.core.security import hash_password
from sqlalchemy import text
from datetime import datetime
import uuid

db = SessionLocal()
now = datetime.now().isoformat()
password = hash_password("admin123")

role = db.execute(
    text("SELECT id FROM roles WHERE name = :name"),
    {"name": "admin"}
).fetchone()

if role:
    role_id = role[0]
else:
    role_id = str(uuid.uuid4())
    db.execute(text("""
    INSERT INTO roles (id, name, description, created_at, updated_at)
    VALUES (:id, :name, :description, :created_at, :updated_at)
    """), {
        "id": role_id,
        "name": "admin",
        "description": "Administrador del sistema",
        "created_at": now,
        "updated_at": now
    })
    db.commit()

user = db.execute(
    text("SELECT id FROM users WHERE email = :email"),
    {"email": "admin@medicore.com"}
).fetchone()

if user:
    db.execute(text("""
    UPDATE users 
    SET hashed_password = :password, role_id = :role_id, is_active = 1, updated_at = :updated_at
    WHERE email = :email
    """), {
        "password": password,
        "role_id": role_id,
        "updated_at": now,
        "email": "admin@medicore.com"
    })
    print("Admin actualizado correctamente")
else:
    user_id = str(uuid.uuid4())
    db.execute(text("""
    INSERT INTO users (id, email, hashed_password, full_name, role_id, is_active, created_at, updated_at)
    VALUES (:id, :email, :password, :name, :role_id, :active, :created_at, :updated_at)
    """), {
        "id": user_id,
        "email": "admin@medicore.com",
        "password": password,
        "name": "Administrador",
        "role_id": role_id,
        "active": 1,
        "created_at": now,
        "updated_at": now
    })
    print("Admin creado correctamente")

db.commit()
db.close()