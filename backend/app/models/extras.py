import uuid
from datetime import datetime
from app.extensions import db

def gen_uuid(): return str(uuid.uuid4())


class Download(db.Model):
    __tablename__ = "downloads"
    id            = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id       = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id       = db.Column(db.String(36), db.ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    downloaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship("User", back_populates="downloads")
    book = db.relationship("Book", back_populates="downloads")


class Bookmark(db.Model):
    __tablename__ = "bookmarks"
    id          = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id     = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id     = db.Column(db.String(36), db.ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    page_number = db.Column(db.Integer, nullable=True)
    note        = db.Column(db.Text, nullable=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship("User", back_populates="bookmarks")
    book = db.relationship("Book", back_populates="bookmarks")

    def to_dict(self):
        return {"id": self.id, "userId": self.user_id, "bookId": self.book_id,
                "pageNumber": self.page_number, "note": self.note,
                "createdAt": self.created_at.isoformat()}


class CartItem(db.Model):
    __tablename__ = "cart_items"
    id       = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id  = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id  = db.Column(db.String(36), db.ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship("User", back_populates="cart_items")
    book = db.relationship("Book", back_populates="cart_items")

    def to_dict(self):
        return {"id": self.id, "userId": self.user_id, "bookId": self.book_id,
                "quantity": self.quantity, "price": self.book.price if self.book else 0,
                "addedAt": self.added_at.isoformat()}


class WishlistItem(db.Model):
    __tablename__ = "wishlist_items"
    id       = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id  = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id  = db.Column(db.String(36), db.ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship("User", back_populates="wishlist_items")
    book = db.relationship("Book", back_populates="wishlist_items")


class ChatLog(db.Model):
    __tablename__ = "chat_logs"
    id        = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id   = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    role      = db.Column(db.String(10), nullable=False)   # user | bot
    message   = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship("User", back_populates="chat_logs")

    def to_dict(self):
        return {"id": self.id, "userId": self.user_id, "role": self.role,
                "message": self.message, "timestamp": self.timestamp.isoformat()}