"""
routers/auth.py — Auth endpoints (/api/auth/...)
"""
import secrets
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import User
from ..auth_utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token, token_blacklist,
    get_current_user,
)
from ..limiter import limiter

router = APIRouter()
bearer = HTTPBearer(auto_error=False)


# ── Schemas ───────────────────────────────────────────────────────────────────
class RegisterBody(BaseModel):
    email: str
    password: str
    name: str

class LoginBody(BaseModel):
    email: str
    password: str

class UpdateMeBody(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None

class ChangePasswordBody(BaseModel):
    currentPassword: str
    newPassword: str

class ForgotPasswordBody(BaseModel):
    email: str


def _user_response(user: User, access: str, refresh: str):
    return {"user": user.to_dict(), "accessToken": access, "refreshToken": refresh}


# ── POST /api/auth/register ───────────────────────────────────────────────────
@router.post("/register", status_code=201)
@limiter.limit("5/hour")
async def register(request: Request, body: RegisterBody, db: AsyncSession = Depends(get_db)):
    email    = body.email.strip().lower()
    password = body.password
    name     = body.name.strip()

    if not email or not password or not name:
        raise HTTPException(400, "email, password and name are required")
    # Changed from "min 8" to "exactly 8" to match the segmented 8-box
    # password input on the frontend (Auth.tsx) — the UI cannot produce a
    # password of any other length, so the backend must enforce the same
    # exact rule rather than silently accepting lengths the UI can't send.
    if len(password) != 8:
        raise HTTPException(400, "Password must be exactly 8 characters")

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Email already registered")

    user = User(email=email, password_hash=hash_password(password), name=name, role="customer")
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return _user_response(user, create_access_token(user.id), create_refresh_token(user.id))


# ── POST /api/auth/login ──────────────────────────────────────────────────────
@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, body: LoginBody, db: AsyncSession = Depends(get_db)):
    email = body.email.strip().lower()

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(403, "Account is deactivated")

    return _user_response(user, create_access_token(user.id), create_refresh_token(user.id))


# ── POST /api/auth/refresh ────────────────────────────────────────────────────
@router.post("/refresh")
async def refresh_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
):
    if not credentials:
        raise HTTPException(401, "Refresh token required")
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Not a refresh token")
    user_id = payload.get("sub")
    return {"accessToken": create_access_token(user_id)}


# ── POST /api/auth/logout ─────────────────────────────────────────────────────
@router.post("/logout")
async def logout(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
):
    if credentials:
        key = credentials.credentials
        token_blacklist.add(key[:64])  # store prefix as identifier
    return {"message": "Logged out successfully"}


# ── GET /api/auth/me ──────────────────────────────────────────────────────────
@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user.to_dict()


# ── PUT /api/auth/me ──────────────────────────────────────────────────────────
@router.put("/me")
async def update_me(
    body: UpdateMeBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.name:       current_user.name = body.name.strip()
    if body.avatar_url: current_user.avatar_url = body.avatar_url
    if body.email:
        email = body.email.strip().lower()
        if email != current_user.email:
            existing = await db.execute(select(User).where(User.email == email))
            if existing.scalar_one_or_none():
                raise HTTPException(409, "Email already in use")
            current_user.email = email
    await db.commit()
    await db.refresh(current_user)
    return current_user.to_dict()


# ── PUT /api/auth/change-password ─────────────────────────────────────────────
@router.put("/change-password")
async def change_password(
    body: ChangePasswordBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(body.currentPassword, current_user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    if len(body.newPassword) != 8:
        raise HTTPException(400, "New password must be exactly 8 characters")
    current_user.password_hash = hash_password(body.newPassword)
    await db.commit()
    return {"message": "Password updated successfully"}


# ── POST /api/auth/forgot-password ────────────────────────────────────────────
@router.post("/forgot-password")
async def forgot_password(
    body: ForgotPasswordBody,
    db: AsyncSession = Depends(get_db),
):
    email = body.email.strip().lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        token = secrets.token_urlsafe(32)
        print(f"[DEV] Password reset token for {email}: {token}")
    return {"message": "If that email is registered, a reset link has been sent."}