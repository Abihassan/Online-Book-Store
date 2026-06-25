import uuid
from datetime import datetime
from app.extensions import db

def gen_uuid(): return str(uuid.uuid4())

class User(db.Model):
    __tablename__ = "users"
    id            = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    email         = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name          = db.Column(db.String(255), nullable=False)
    role          = db.Column(db.String(20), nullable=False, default="customer")
    is_active     = db.Column(db.Boolean, default=True, nullable=False)
    avatar_url    = db.Column(db.String(500), nullable=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at    = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    orders           = db.relationship("Order",          back_populates="user", lazy="dynamic")
    reviews          = db.relationship("Review",         back_populates="user", lazy="dynamic")
    reading_sessions = db.relationship("ReadingSession", back_populates="user", lazy="dynamic")
    cart_items       = db.relationship("CartItem",       back_populates="user", lazy="dynamic")
    wishlist_items   = db.relationship("WishlistItem",   back_populates="user", lazy="dynamic")
    downloads        = db.relationship("Download",       back_populates="user", lazy="dynamic")
    bookmarks        = db.relationship("Bookmark",       back_populates="user", lazy="dynamic")
    chat_logs        = db.relationship("ChatLog",        back_populates="user", lazy="dynamic")

    def to_dict(self):
        return {"id": self.id, "email": self.email, "name": self.name,
                "role": self.role, "is_active": self.is_active,
                "avatar_url": self.avatar_url,
                "created_at": self.created_at.isoformat() if self.created_at else None}