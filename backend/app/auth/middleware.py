"""Auth middleware decorators for Flask routes."""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User


def require_auth(fn):
    """Verify JWT and inject current user. Returns 401 if token missing/invalid."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception as e:
            return jsonify({"error": "Authentication required", "detail": str(e)}), 401
        return fn(*args, **kwargs)
    return wrapper


def require_admin(fn):
    """Verify JWT and ensure user has admin role. Returns 403 otherwise."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception as e:
            return jsonify({"error": "Authentication required", "detail": str(e)}), 401
        user = User.query.get(get_jwt_identity())
        if not user or user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper