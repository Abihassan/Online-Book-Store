"""
auth_utils.py — JWT helpers and FastAPI auth dependencies.
Uses python-jose for JWT, passlib for bcrypt.
"""
import os
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .database import get_db
from .models import User

# ── Config ────────────────────────────────────────────────────────────────────
# SECURITY: no hardcoded fallback secret. Previously this was
# os.getenv("JWT_SECRET_KEY", "dev-jwt-secret") — if the env var was ever
# unset (a misconfigured deploy, a container missing its .env file, etc.)
# the app would silently start up using a publicly-known, hardcoded secret,
# letting anyone who has read this source code forge valid JWTs for any
# user. Failing loudly at import time is much safer than failing silently
# into an insecure default — see ANALYSIS_REPORT.md, security audit
# finding #1, for the full writeup.
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY is not set. Add it to backend/.env — e.g. generate "
        "one with: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
    )

ALGORITHM  = "HS256"
ACCESS_EXPIRES  = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES",  "3600"))    # seconds
REFRESH_EXPIRES = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", "2592000")) # seconds

pwd_ctx  = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer   = HTTPBearer(auto_error=False)

# In-memory token blacklist (dev only — use Redis in prod)
token_blacklist: set = set()


# ── Password helpers ──────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


# ── Token helpers ─────────────────────────────────────────────────────────────
def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(seconds=ACCESS_EXPIRES)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "access"},
        SECRET_KEY, algorithm=ALGORITHM,
    )


def create_refresh_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(seconds=REFRESH_EXPIRES)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "refresh"},
        SECRET_KEY, algorithm=ALGORITHM,
    )


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def get_jti(token: str) -> Optional[str]:
    """Extract jti or sub from token for blacklisting."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("jti") or payload.get("sub")
    except JWTError:
        return None


# ── FastAPI dependencies ──────────────────────────────────────────────────────
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    token = credentials.credentials
    payload = decode_token(token)

    # Check blacklist
    jti = payload.get("jti") or payload.get("sub")
    if jti in token_blacklist:
        raise HTTPException(status_code=401, detail="Token has been revoked")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or deactivated")

    return user


async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Returns user if authenticated, None otherwise."""
    if not credentials:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None