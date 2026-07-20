from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.core.rate_limit import login_rate_limit
from app.modules.auth.schemas import LoginRequest, TokenResponse, RefreshRequest, UserOut
from app.modules.auth.service import auth_service

router = APIRouter(prefix="/auth", tags=["Autenticacion"])

@router.post("/login", response_model=TokenResponse, dependencies=[Depends(login_rate_limit)])
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else None
    return auth_service.login(db, payload.email, payload.password, ip)

@router.post("/logout")
def logout(payload: RefreshRequest, db: Session = Depends(get_db)):
    auth_service.logout(db, payload.refresh_token)
    return {"message": "Sesion cerrada"}

@router.get("/me", response_model=UserOut)
def me(current_user=Depends(get_current_user)):
    return current_user
