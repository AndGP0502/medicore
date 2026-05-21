from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "MediCore"
    DEBUG: bool = True
    DATABASE_URL: str = "postgresql://medicore:medicore@localhost:5432/medicore_db"
    SECRET_KEY: str = "cambia-esto-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str = "http://localhost:5173"
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
