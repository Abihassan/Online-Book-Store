from flask import Flask
from flask_cors import CORS
from .extensions import db, jwt, bcrypt, mail
from .config import config_by_name
import os


def create_app(config_name: str = None) -> Flask:
    app = Flask(__name__)

    # ── Config ───────────────────────────────────────────────────────────────
    env = config_name or os.getenv("FLASK_ENV", "development")
    app.config.from_object(config_by_name[env])

    # ── Extensions ───────────────────────────────────────────────────────────
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)

    # ── CORS — allow React dev server ─────────────────────────────────────────
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                os.getenv("FRONTEND_URL", "http://localhost:5173"),
                "http://localhost:3000",
            ],
            "supports_credentials": True,
            "allow_headers": ["Content-Type", "Authorization"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        }
    })

    # ── Blueprints ────────────────────────────────────────────────────────────
    from .auth.routes import auth_bp
    from .books.routes import books_bp
    from .orders.routes import orders_bp
    from .reviews.routes import reviews_bp
    from .cart.routes import cart_bp
    from .wishlist.routes import wishlist_bp
    from .admin.routes import admin_bp

    app.register_blueprint(auth_bp,     url_prefix="/api/auth")
    app.register_blueprint(books_bp,    url_prefix="/api/books")
    app.register_blueprint(orders_bp,   url_prefix="/api/orders")
    app.register_blueprint(reviews_bp,  url_prefix="/api/reviews")
    app.register_blueprint(cart_bp,     url_prefix="/api/cart")
    app.register_blueprint(wishlist_bp, url_prefix="/api/wishlist")
    app.register_blueprint(admin_bp,    url_prefix="/api/admin")

    # ── Health check ──────────────────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return {"status": "ok", "service": "BookHaven Flask API"}

    return app