from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required,
    get_jwt_identity, get_jwt,
)
from app.extensions import db, bcrypt, token_blacklist
from app.models import User
from datetime import datetime
import secrets

auth_bp = Blueprint("auth", __name__)


def _user_or_404(user_id):
    user = User.query.get(user_id)
    if not user or not user.is_active:
        return None, ({"error": "User not found"}, 404)
    return user, None


# ── POST /api/auth/register ───────────────────────────────────────────────────
@auth_bp.post("/register")
def register():
    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")
    name = (data.get("name") or "").strip()

    if not email or not password or not name:
        return jsonify({"error": "email, password and name are required"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(email=email, password_hash=pw_hash, name=name, role="customer")
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    return jsonify({"user": user.to_dict(), "accessToken": access_token, "refreshToken": refresh_token}), 201


# ── POST /api/auth/login ──────────────────────────────────────────────────────
@auth_bp.post("/login")
def login():
    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401
    if not user.is_active:
        return jsonify({"error": "Account is deactivated"}), 403

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    return jsonify({"user": user.to_dict(), "accessToken": access_token, "refreshToken": refresh_token})


# ── POST /api/auth/refresh ────────────────────────────────────────────────────
@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return jsonify({"accessToken": access_token})


# ── POST /api/auth/logout ─────────────────────────────────────────────────────
@auth_bp.post("/logout")
@jwt_required(verify_type=False)
def logout():
    jti = get_jwt()["jti"]
    token_blacklist.add(jti)
    return jsonify({"message": "Logged out successfully"})


# ── GET /api/auth/me ──────────────────────────────────────────────────────────
@auth_bp.get("/me")
@jwt_required()
def get_me():
    user, err = _user_or_404(get_jwt_identity())
    if err: return err
    return jsonify(user.to_dict())


# ── PUT /api/auth/me ──────────────────────────────────────────────────────────
@auth_bp.put("/me")
@jwt_required()
def update_me():
    user, err = _user_or_404(get_jwt_identity())
    if err: return err
    data = request.get_json()
    if "name" in data:       user.name = data["name"].strip()
    if "email" in data:
        email = data["email"].strip().lower()
        if email != user.email and User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already in use"}), 409
        user.email = email
    if "avatar_url" in data: user.avatar_url = data["avatar_url"]
    db.session.commit()
    return jsonify(user.to_dict())


# ── PUT /api/auth/change-password ─────────────────────────────────────────────
@auth_bp.put("/change-password")
@jwt_required()
def change_password():
    user, err = _user_or_404(get_jwt_identity())
    if err: return err
    data = request.get_json()
    current_pw = data.get("currentPassword", "")
    new_pw = data.get("newPassword", "")

    if not bcrypt.check_password_hash(user.password_hash, current_pw):
        return jsonify({"error": "Current password is incorrect"}), 400
    if len(new_pw) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400

    user.password_hash = bcrypt.generate_password_hash(new_pw).decode("utf-8")
    db.session.commit()
    return jsonify({"message": "Password updated successfully"})


# ── POST /api/auth/forgot-password ────────────────────────────────────────────
@auth_bp.post("/forgot-password")
def forgot_password():
    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    user = User.query.filter_by(email=email).first()

    # Always return 200 to prevent email enumeration
    if user:
        token = secrets.token_urlsafe(32)
        # In production: save token + expiry to DB, then send via Celery
        # from tasks.email import send_password_reset_email
        # send_password_reset_email.delay(user.email, token)
        print(f"[DEV] Password reset token for {email}: {token}")

    return jsonify({"message": "If that email is registered, a reset link has been sent."})