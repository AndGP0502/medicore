from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str

class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: str
    is_active: bool

    class Config:
        from_attributes = True
