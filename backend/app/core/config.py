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

    # Producción: lista separada por comas, ej. "https://medicore.ec,https://www.medicore.ec"
    CORS_ORIGINS: str = ""

    # Ollama (IA) — solo accesible desde localhost del servidor
    OLLAMA_URL: str = "http://127.0.0.1:11434/api/generate"
    OLLAMA_MODEL: str = "llama3.2"

    # Rate limiting del login: intentos permitidos por IP dentro de la ventana
    LOGIN_RATE_LIMIT_ATTEMPTS: int = 5
    LOGIN_RATE_LIMIT_WINDOW_SECONDS: int = 60

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
