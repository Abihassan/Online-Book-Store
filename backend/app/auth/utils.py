"""JWT generation helpers and password utilities."""
from flask_jwt_extended import create_access_token, create_refresh_token
from app.extensions import bcrypt
import secrets
from datetime import datetime, timedelta


def hash_password(plain: str) -> str:
    return bcrypt.generate_password_hash(plain).decode("utf-8")


def check_password(plain: str, hashed: str) -> bool:
    return bcrypt.check_password_hash(hashed, plain)


def make_tokens(user_id: str) -> dict:
    return {
        "accessToken": create_access_token(identity=user_id),
        "refreshToken": create_refresh_token(identity=user_id),
    }


def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)