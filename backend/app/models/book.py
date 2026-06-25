import uuid
from datetime import datetime
from app.extensions import db

def gen_uuid(): return str(uuid.uuid4())

class Book(db.Model):
    __tablename__ = "books"
    id             = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    title          = db.Column(db.String(500), nullable=False)
    author         = db.Column(db.String(255), nullable=False)
    genre          = db.Column(db.String(100), nullable=True)
    isbn           = db.Column(db.String(20),  nullable=True)
    price          = db.Column(db.Float, nullable=False)
    original_price = db.Column(db.Float, nullable=True)
    is_free        = db.Column(db.Boolean, default=False)
    file_url       = db.Column(db.String(500), nullable=True)
    cover_url      = db.Column(db.String(500), nullable=True)
    description    = db.Column(db.Text, nullable=True)
    pages          = db.Column(db.Integer, nullable=True)
    language       = db.Column(db.String(50), default="English")
    rating         = db.Column(db.Float, default=0.0)
    review_count   = db.Column(db.Integer, default=0)
    badge          = db.Column(db.String(50), nullable=True)   # new | bestseller | trending | sale
    stock          = db.Column(db.Integer, default=0, server_default="0")
    published_date = db.Column(db.String(20), nullable=True)
    is_active      = db.Column(db.Boolean, default=True)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at     = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reviews          = db.relationship("Review",         back_populates="book", lazy="dynamic")
    reading_sessions = db.relationship("ReadingSession", back_populates="book", lazy="dynamic")
    order_items      = db.relationship("OrderItem",      back_populates="book", lazy="dynamic")
    downloads        = db.relationship("Download",       back_populates="book", lazy="dynamic")
    cart_items       = db.relationship("CartItem",       back_populates="book", lazy="dynamic")
    wishlist_items   = db.relationship("WishlistItem",   back_populates="book", lazy="dynamic")
    bookmarks        = db.relationship("Bookmark",       back_populates="book", lazy="dynamic")

    def to_dict(self):
        return {"id": self.id, "title": self.title, "author": self.author,
                "genre": self.genre, "category": self.genre, "isbn": self.isbn,
                "price": self.price, "originalPrice": self.original_price,
                "isFree": self.is_free, "fileUrl": self.file_url,
                "coverUrl": self.cover_url, "coverImage": self.cover_url,
                "description": self.description, "pages": self.pages,
                "language": self.language, "rating": self.rating,
                "reviewCount": self.review_count, "reviews": self.review_count,
                "badge": self.badge, "stock": self.stock, "publishedDate": self.published_date}