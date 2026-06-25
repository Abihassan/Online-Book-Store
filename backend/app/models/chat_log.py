import uuid
from datetime import datetime
from app.extensions import db


def gen_uuid():
    return str(uuid.uuid4())


class WishlistItem(db.Model):
    __tablename__ = "wishlist_items"

    id       = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id  = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id  = db.Column(db.String(36), db.ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="wishlist_items")
    book = db.relationship("Book", back_populates="wishlist_items")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "bookId": self.book_id,
            "addedAt": self.added_at.isoformat() if self.added_at else None,
        }