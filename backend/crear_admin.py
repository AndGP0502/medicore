import os
os.environ["DATABASE_URL"] = "postgresql://medicore:medicore2024@localhost:5433/medicore"

from app.database.session import SessionLocal
from app.modules.auth.models import User, Role
from app.core.security import hash_password as get_password_hash

db = SessionLocal()
rol = db.query(Role).filter_by(name="admin").first()
if not rol:
    rol = Role(name="admin", description="Administrador")
    db.add(rol); db.commit(); db.refresh(rol)

u = db.query(User).filter_by(email="admin@medicore.com").first()
if not u:
    u = User(email="admin@medicore.com",
             hashed_password=get_password_hash("Admin123!"),
             full_name="Administrador", role_id=rol.id, is_active=True)
    db.add(u); db.commit()
    print("Creado: admin@medicore.com / Admin123!")
else:
    u.hashed_password = get_password_hash("Admin123!")
    db.commit()
    print("Clave reseteada: admin@medicore.com / Admin123!")