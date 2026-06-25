import uuid
from datetime import datetime
from app.extensions import db

def gen_uuid(): return str(uuid.uuid4())

class ReadingSession(db.Model):
    __tablename__  = "reading_sessions"
    __table_args__ = (db.Index("ix_session_user_book", "user_id", "book_id"),)
    id               = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id          = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id          = db.Column(db.String(36), db.ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    started_at       = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    ended_at         = db.Column(db.DateTime, nullable=True)
    duration_seconds = db.Column(db.Integer, nullable=True)
    pages_read       = db.Column(db.Integer, default=0)
    device_type      = db.Column(db.String(50), default="web")

    user = db.relationship("User", back_populates="reading_sessions")
    book = db.relationship("Book", back_populates="reading_sessions")

    def to_dict(self):
        return {"id": self.id, "userId": self.user_id, "bookId": self.book_id,
                "startedAt": self.started_at.isoformat(),
                "endedAt": self.ended_at.isoformat() if self.ended_at else None,
                "durationSeconds": self.duration_seconds,
                "pagesRead": self.pages_read, "deviceType": self.device_type}