import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.database.session import SessionLocal
from app.database.base import Base
from app.database.session import engine
from app.modules.auth.models import Role, User
from app.core.security import hash_password

ROLES = [
    {"name": "admin", "description": "Administrador del sistema"},
    {"name": "doctor", "description": "Medico"},
    {"name": "receptionist", "description": "Recepcionista"},
    {"name": "cashier", "description": "Cajero"},
    {"name": "lab", "description": "Laboratorista"},
    {"name": "pharmacy", "description": "Farmaceutico"},
]

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        role_map = {}
        for r in ROLES:
            existing = db.query(Role).filter(Role.name == r["name"]).first()
            if not existing:
                role = Role(**r)
                db.add(role)
                db.flush()
                role_map[r["name"]] = role
            else:
                role_map[r["name"]] = existing

        admin_role = role_map["admin"]
        if not db.query(User).filter(User.email == "admin@medicore.local").first():
            db.add(User(
                email="admin@medicore.local",
                hashed_password=hash_password("admin1234"),
                full_name="Administrador MediCore",
                role_id=admin_role.id,
            ))
        db.commit()
        print("Seed OK ? admin@medicore.local / admin1234")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
