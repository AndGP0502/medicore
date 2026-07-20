"""Rate limiter en memoria por IP, sin dependencias externas.

Suficiente para un solo proceso uvicorn detrás del reverse proxy.
Si algún día se escala a varios workers/procesos, migrar a Redis.
"""
import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request

from app.core.config import settings

_attempts: dict[str, deque] = defaultdict(deque)
_lock = Lock()


def _client_ip(request: Request) -> str:
    # Detrás de Caddy/Nginx la IP real llega en X-Forwarded-For
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def login_rate_limit(request: Request) -> None:
    ip = _client_ip(request)
    now = time.monotonic()
    window = settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS
    max_attempts = settings.LOGIN_RATE_LIMIT_ATTEMPTS

    with _lock:
        q = _attempts[ip]
        while q and now - q[0] > window:
            q.popleft()
        if len(q) >= max_attempts:
            raise HTTPException(
                status_code=429,
                detail="Demasiados intentos de inicio de sesión. Intenta de nuevo en un minuto.",
            )
        q.append(now)
