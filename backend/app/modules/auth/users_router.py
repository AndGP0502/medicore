from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.modules.auth.models import User, Role
from app.modules.auth.schemas import UserOut

router = APIRouter(prefix="/users", tags=["Usuarios"])

@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(User).filter(User.is_active == True).all()

@router.get("/doctors", response_model=list[UserOut])
def list_doctors(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(User).join(Role).filter(Role.name == "doctor", User.is_active == True).all()
