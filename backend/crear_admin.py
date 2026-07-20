import os
<<<<<<< HEAD
os.environ["DATABASE_URL"] = "postgresql://medicore:medicore@localhost:5432/medicore_db"
=======
# Solo usa la DB local portable si no hay DATABASE_URL definida (en el VPS
# viene de /etc/medicore/medicore.env)
os.environ.setdefault("DATABASE_URL", "postgresql://medicore:medicore2024@localhost:5433/medicore")
>>>>>>> d508bb1cecbedae5998fafb62da042f787b5c06e

from app.database.session import SessionLocal
from app.modules.auth.models import User, Role
from app.core.security import hash_password as get_password_hash

db = SessionLocal()
rol = db.query(Role).filter_by(name="admin").first()
if not rol:
    rol = Role(name="admin", description="Administrador")
    db.add(rol); db.commit(); db.refresh(rol)

import getpass

email = os.environ.get("ADMIN_EMAIL", "admin@medicore.com")
password = os.environ.get("ADMIN_PASSWORD") or getpass.getpass(f"Clave para {email}: ")

u = db.query(User).filter_by(email=email).first()
if not u:
    u = User(email=email,
             hashed_password=get_password_hash(password),
             full_name="Administrador", role_id=rol.id, is_active=True)
    db.add(u); db.commit()
    print(f"Creado: {email}")
else:
    u.hashed_password = get_password_hash(password)
    db.commit()
    print(f"Clave reseteada: {email}")