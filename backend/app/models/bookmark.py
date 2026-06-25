import uuid
from datetime import datetime
from app.extensions import db


def gen_uuid():
    return str(uuid.uuid4())


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
        return {
            "id": self.id,
            "userId": self.user_id,
            "bookId": self.book_id,
            "pageNumber": self.page_number,
            "note": self.note,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }