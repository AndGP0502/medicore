from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.dependencies import get_db, get_current_user
from app.core.security import hash_password, verify_password
from app.modules.auth.models import User, Role
from app.modules.auth.schemas import UserOut, UserCreate, UserUpdate, ChangePasswordRequest, RoleOut

router = APIRouter(prefix="/users", tags=["Usuarios"])


@router.get("", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(User).filter(User.is_active == True).all()


@router.get("/roles", response_model=List[RoleOut])
def list_roles(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Role).filter(Role.is_active == True).all()


@router.post("/roles", response_model=RoleOut, status_code=201)
def create_role(data: dict, db: Session = Depends(get_db), _=Depends(get_current_user)):
    name = data.get("name", "").lower().strip().replace(" ", "_")
    if not name:
        raise HTTPException(status_code=400, detail="El nombre del rol es requerido")
    existing = db.query(Role).filter(Role.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un rol con ese nombre")
    role = Role(name=name, description=data.get("description", ""))
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.delete("/roles/{role_id}")
def delete_role(role_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    users_with_role = db.query(User).filter(User.role_id == role_id, User.is_active == True).count()
    if users_with_role > 0:
        raise HTTPException(status_code=400, detail=f"No se puede eliminar: {users_with_role} usuario(s) tienen este rol")
    role.is_active = False
    db.commit()
    return {"message": "Rol eliminado"}


@router.post("", response_model=UserOut, status_code=201)
def create_user(data: UserCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese email")
    user = User(email=data.email, hashed_password=hash_password(data.password), full_name=data.full_name, role_id=data.role_id)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: str, data: UserUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if str(current_user.id) == user_id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.is_active = False
    db.commit()
    return {"message": "Usuario desactivado"}


@router.post("/change-password")
def change_password(data: ChangePasswordRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Contrasena actual incorrecta")
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Contrasena actualizada correctamente"}


@router.get("/doctors", response_model=List[UserOut])
def list_doctors(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(User).join(Role).filter(Role.name == "doctor", User.is_active == True).all()
