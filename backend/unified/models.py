"""
models.py — All SQLAlchemy models for the unified server.
Mirrors the Flask models exactly so the existing DB schema is reused.
"""
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String, Float, Integer, Boolean, Text, DateTime,
    ForeignKey, JSON, UniqueConstraint, Index, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


# ── User ──────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id:            Mapped[str]           = mapped_column(String(36), primary_key=True, default=gen_uuid)
    email:         Mapped[str]           = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str]           = mapped_column(String(255), nullable=False)
    name:          Mapped[str]           = mapped_column(String(255), nullable=False)
    role:          Mapped[str]           = mapped_column(String(20),  nullable=False, default="customer")
    is_active:     Mapped[bool]          = mapped_column(Boolean, default=True, nullable=False)
    avatar_url:    Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at:    Mapped[datetime]      = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at:    Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    orders:           Mapped[List["Order"]]          = relationship("Order",          back_populates="user")
    reviews:          Mapped[List["Review"]]         = relationship("Review",         back_populates="user")
    reading_sessions: Mapped[List["ReadingSession"]] = relationship("ReadingSession", back_populates="user")
    cart_items:       Mapped[List["CartItem"]]       = relationship("CartItem",       back_populates="user")
    wishlist_items:   Mapped[List["WishlistItem"]]   = relationship("WishlistItem",   back_populates="user")
    downloads:        Mapped[List["Download"]]       = relationship("Download",       back_populates="user")
    bookmarks:        Mapped[List["Bookmark"]]       = relationship("Bookmark",       back_populates="user")
    chat_logs:        Mapped[List["ChatLog"]]        = relationship("ChatLog",        back_populates="user")

    def to_dict(self):
        return {
            "id": self.id, "email": self.email, "name": self.name,
            "role": self.role, "is_active": self.is_active,
            "avatar_url": self.avatar_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ── Book ──────────────────────────────────────────────────────────────────────
class Book(Base):
    __tablename__ = "books"

    id:             Mapped[str]           = mapped_column(String(36),  primary_key=True, default=gen_uuid)
    title:          Mapped[str]           = mapped_column(String(500), nullable=False)
    author:         Mapped[str]           = mapped_column(String(255), nullable=False)
    genre:          Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    isbn:           Mapped[Optional[str]] = mapped_column(String(20),  nullable=True)
    price:          Mapped[float]         = mapped_column(Float, nullable=False)
    original_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_free:        Mapped[bool]          = mapped_column(Boolean, default=False)
    file_url:       Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    cover_url:      Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description:    Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pages:          Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    language:       Mapped[str]           = mapped_column(String(50), default="English")
    rating:         Mapped[float]         = mapped_column(Float, default=0.0)
    review_count:   Mapped[int]           = mapped_column(Integer, default=0)
    badge:          Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    published_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_active:      Mapped[bool]          = mapped_column(Boolean, default=True)
    created_at:     Mapped[datetime]      = mapped_column(DateTime, default=datetime.utcnow)
    updated_at:     Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reviews:          Mapped[List["Review"]]         = relationship("Review",         back_populates="book")
    reading_sessions: Mapped[List["ReadingSession"]] = relationship("ReadingSession", back_populates="book")
    order_items:      Mapped[List["OrderItem"]]      = relationship("OrderItem",      back_populates="book")
    downloads:        Mapped[List["Download"]]       = relationship("Download",       back_populates="book")
    cart_items:       Mapped[List["CartItem"]]       = relationship("CartItem",       back_populates="book")
    wishlist_items:   Mapped[List["WishlistItem"]]   = relationship("WishlistItem",   back_populates="book")
    bookmarks:        Mapped[List["Bookmark"]]       = relationship("Bookmark",       back_populates="book")

    def to_dict(self):
        return {
            "id": self.id, "title": self.title, "author": self.author,
            "genre": self.genre, "category": self.genre, "isbn": self.isbn,
            "price": self.price, "originalPrice": self.original_price,
            "isFree": self.is_free, "fileUrl": self.file_url,
            "coverUrl": self.cover_url, "coverImage": self.cover_url,
            "description": self.description, "pages": self.pages,
            "language": self.language, "rating": self.rating,
            "reviewCount": self.review_count, "reviews": self.review_count,
            "badge": self.badge, "publishedDate": self.published_date,
        }


# ── Order + OrderItem ─────────────────────────────────────────────────────────
class Order(Base):
    __tablename__ = "orders"

    id:               Mapped[str]           = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id:          Mapped[str]           = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    total:            Mapped[float]         = mapped_column(Float, nullable=False)
    status:           Mapped[str]           = mapped_column(String(50), default="pending")
    shipping_address: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    payment_method:   Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at:       Mapped[datetime]      = mapped_column(DateTime, default=datetime.utcnow)

    user:        Mapped["User"]            = relationship("User",      back_populates="orders")
    order_items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id, "userId": self.user_id, "total": self.total,
            "status": self.status, "shippingAddress": self.shipping_address,
            "paymentMethod": self.payment_method,
            "createdAt": self.created_at.isoformat(),
            "items": [i.to_dict() for i in self.order_items],
        }


class OrderItem(Base):
    __tablename__ = "order_items"

    id:       Mapped[str]   = mapped_column(String(36), primary_key=True, default=gen_uuid)
    order_id: Mapped[str]   = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    book_id:  Mapped[str]   = mapped_column(String(36), ForeignKey("books.id"), nullable=False)
    quantity: Mapped[int]   = mapped_column(Integer, nullable=False, default=1)
    price:    Mapped[float] = mapped_column(Float, nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="order_items")
    book:  Mapped["Book"]  = relationship("Book",  back_populates="order_items")

    def to_dict(self):
        return {"bookId": self.book_id, "quantity": self.quantity, "price": self.price}


# ── Review ────────────────────────────────────────────────────────────────────
class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("user_id", "book_id", name="uq_user_book_review"),)

    id:              Mapped[str]           = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id:         Mapped[str]           = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id:         Mapped[str]           = mapped_column(String(36), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    rating:          Mapped[int]           = mapped_column(Integer, nullable=False)
    comment:         Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sentiment_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at:      Mapped[datetime]      = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="reviews")
    book: Mapped["Book"] = relationship("Book", back_populates="reviews")

    def to_dict(self):
        return {
            "id": self.id, "userId": self.user_id, "bookId": self.book_id,
            "userName": self.user.name if self.user else "Unknown",
            "rating": self.rating, "comment": self.comment,
            "sentimentScore": self.sentiment_score,
            "createdAt": self.created_at.isoformat(),
        }


# ── ReadingSession ────────────────────────────────────────────────────────────
class ReadingSession(Base):
    __tablename__  = "reading_sessions"
    __table_args__ = (Index("ix_session_user_book", "user_id", "book_id"),)

    id:               Mapped[str]           = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id:          Mapped[str]           = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id:          Mapped[str]           = mapped_column(String(36), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    started_at:       Mapped[datetime]      = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at:         Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    pages_read:       Mapped[int]           = mapped_column(Integer, default=0)
    device_type:      Mapped[str]           = mapped_column(String(50), default="web")

    user: Mapped["User"] = relationship("User", back_populates="reading_sessions")
    book: Mapped["Book"] = relationship("Book", back_populates="reading_sessions")

    def to_dict(self):
        return {
            "id": self.id, "userId": self.user_id, "bookId": self.book_id,
            "startedAt": self.started_at.isoformat(),
            "endedAt": self.ended_at.isoformat() if self.ended_at else None,
            "durationSeconds": self.duration_seconds,
            "pagesRead": self.pages_read, "deviceType": self.device_type,
        }


# ── CartItem ──────────────────────────────────────────────────────────────────
class CartItem(Base):
    __tablename__ = "cart_items"

    id:       Mapped[str]      = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id:  Mapped[str]      = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id:  Mapped[str]      = mapped_column(String(36), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    quantity: Mapped[int]      = mapped_column(Integer, default=1, nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="cart_items")
    book: Mapped["Book"] = relationship("Book", back_populates="cart_items")

    def to_dict(self):
        return {
            "id": self.id, "userId": self.user_id, "bookId": self.book_id,
            "quantity": self.quantity, "price": self.book.price if self.book else 0,
            "addedAt": self.added_at.isoformat(),
        }


# ── WishlistItem ──────────────────────────────────────────────────────────────
class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id:       Mapped[str]      = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id:  Mapped[str]      = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id:  Mapped[str]      = mapped_column(String(36), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="wishlist_items")
    book: Mapped["Book"] = relationship("Book", back_populates="wishlist_items")


# ── Download ──────────────────────────────────────────────────────────────────
class Download(Base):
    __tablename__ = "downloads"

    id:            Mapped[str]      = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id:       Mapped[str]      = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id:       Mapped[str]      = mapped_column(String(36), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    downloaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="downloads")
    book: Mapped["Book"] = relationship("Book", back_populates="downloads")


# ── Bookmark ──────────────────────────────────────────────────────────────────
class Bookmark(Base):
    __tablename__ = "bookmarks"

    id:          Mapped[str]           = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id:     Mapped[str]           = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id:     Mapped[str]           = mapped_column(String(36), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    page_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    note:        Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at:  Mapped[datetime]      = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="bookmarks")
    book: Mapped["Book"] = relationship("Book", back_populates="bookmarks")

    def to_dict(self):
        return {
            "id": self.id, "userId": self.user_id, "bookId": self.book_id,
            "pageNumber": self.page_number, "note": self.note,
            "createdAt": self.created_at.isoformat(),
        }


# ── ChatLog ───────────────────────────────────────────────────────────────────
class ChatLog(Base):
    __tablename__ = "chat_logs"

    id:        Mapped[str]           = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id:   Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    role:      Mapped[str]           = mapped_column(String(10), nullable=False)
    message:   Mapped[str]           = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime]      = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[Optional["User"]] = relationship("User", back_populates="chat_logs")

    def to_dict(self):
        return {
            "id": self.id, "userId": self.user_id, "role": self.role,
            "message": self.message, "timestamp": self.timestamp.isoformat(),
        }
