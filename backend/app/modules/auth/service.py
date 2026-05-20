from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.config import settings
from app.modules.auth.models import User, UserSession

class AuthService:
    def login(self, db: Session, email: str, password: str, ip: str = None):
        user = db.query(User).filter(User.email == email, User.is_active == True).first()
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})
        session = UserSession(user_id=user.id, refresh_token=refresh_token, ip_address=ip, expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
        db.add(session)
        user.last_login = datetime.utcnow()
        db.commit()
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token": access_token,
            "user": {
              "id": str(user.id),
              "email": user.email,
              "full_name": user.full_name
            }
        }

    def logout(self, db: Session, refresh_token: str):
        session = db.query(UserSession).filter(UserSession.refresh_token == refresh_token, UserSession.is_active == True).first()
        if session:
            session.is_active = False
            db.commit()

auth_service = AuthService()
