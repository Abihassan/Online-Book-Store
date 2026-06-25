import uuid
from datetime import datetime
from app.extensions import db

def gen_uuid(): return str(uuid.uuid4())

class Review(db.Model):
    __tablename__ = "reviews"
    __table_args__ = (db.UniqueConstraint("user_id", "book_id", name="uq_user_book_review"),)
    id              = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id         = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id         = db.Column(db.String(36), db.ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    rating          = db.Column(db.Integer, nullable=False)
    comment         = db.Column(db.Text, nullable=True)
    sentiment_score = db.Column(db.Float, nullable=True)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="reviews")
    book = db.relationship("Book", back_populates="reviews")

    def to_dict(self):
        return {"id": self.id, "userId": self.user_id, "bookId": self.book_id,
                "userName": self.user.name if self.user else "Unknown",
                "rating": self.rating, "comment": self.comment,
                "sentimentScore": self.sentiment_score,
                "createdAt": self.created_at.isoformat()}