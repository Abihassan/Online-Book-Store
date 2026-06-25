import uuid
from datetime import datetime
from app.extensions import db


def gen_uuid():
    return str(uuid.uuid4())


class Download(db.Model):
    __tablename__ = "downloads"

    id            = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id       = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id       = db.Column(db.String(36), db.ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    downloaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="downloads")
    book = db.relationship("Book", back_populates="downloads")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "bookId": self.book_id,
            "downloadedAt": self.downloaded_at.isoformat() if self.downloaded_at else None,
        }