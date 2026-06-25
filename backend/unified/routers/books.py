"""
routers/books.py — Book CRUD endpoints (/api/books/...)
"""
import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Book, Review, Order, OrderItem
from ..auth_utils import get_current_user, get_admin_user, get_optional_user
from ..models import User

router = APIRouter()


# ── RAG index auto-refresh ───────────────────────────────────────────────────
# The chatbot's book-retrieval (ml/chatbot/rag.py) reads from a FAISS index
# that previously only got rebuilt by a manually-triggered Celery task
# (tasks/ml_train.py: reembed_catalog), meaning newly added/edited books
# would be invisible to the chatbot until someone ran that task by hand.
# This re-runs the (local, no-API-cost) embedding + index build synchronously
# whenever a book is created, updated, or deleted, so the chatbot always
# reflects the current catalog with no extra infrastructure required. If
# Celery/Redis ARE set up separately, the scheduled task still works fine
# too — this just adds an immediate, zero-dependency safety net on top.
#
# Failures here are logged but never raised — keeping the chatbot's search
# index in sync is supplementary, and should never block a book save.
async def _refresh_rag_index(db: AsyncSession):
    try:
        from ml.chatbot.rag import build_index
        result = await db.execute(select(Book).where(Book.is_active == True))
        books = result.scalars().all()
        books_data = [
            {
                "id": b.id, "title": b.title, "author": b.author,
                "genre": b.genre or "", "description": b.description or "",
                "price": float(b.price or 0), "cover_url": b.cover_url or "",
            }
            for b in books
        ]
        build_index(books_data)
    except Exception as e:
        print(f"[books] RAG index refresh skipped/failed (non-fatal): {e}")


# ── Schemas ───────────────────────────────────────────────────────────────────
class BookCreate(BaseModel):
    title: str
    author: str
    genre: Optional[str]   = None
    isbn: Optional[str]    = None
    price: float           = 0.0
    original_price: Optional[float] = None
    is_free: bool          = False
    cover_url: Optional[str] = None
    description: Optional[str] = None
    pages: Optional[int]   = None
    language: str          = "English"
    badge: Optional[str]   = None
    published_date: Optional[str] = None


class BookUpdate(BaseModel):
    title: Optional[str]   = None
    author: Optional[str]  = None
    genre: Optional[str]   = None
    isbn: Optional[str]    = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    is_free: Optional[bool] = None
    cover_url: Optional[str] = None
    description: Optional[str] = None
    pages: Optional[int]   = None
    language: Optional[str] = None
    badge: Optional[str]   = None
    published_date: Optional[str] = None


# ── GET /api/books ────────────────────────────────────────────────────────────
@router.get("/")
async def get_books(
    page:       int   = Query(1, ge=1),
    per_page:   int   = Query(12, ge=1, le=100),
    genre:      Optional[str] = None,
    author:     Optional[str] = None,
    search:     Optional[str] = None,
    sort_by:    str   = "title",
    min_rating: Optional[float] = None,
    min_price:  Optional[float] = None,
    max_price:  Optional[float] = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Book).where(Book.is_active == True)

    if search:
        term = f"%{search}%"
        q = q.where(or_(
            Book.title.ilike(term),
            Book.author.ilike(term),
            Book.description.ilike(term),
        ))
    if genre:      q = q.where(Book.genre == genre)
    if author:     q = q.where(Book.author == author)
    if min_rating: q = q.where(Book.rating >= min_rating)
    if min_price:  q = q.where(Book.price >= min_price)
    if max_price:  q = q.where(Book.price <= max_price)

    sort_map = {
        "title":      Book.title.asc(),
        "price-low":  Book.price.asc(),
        "price-high": Book.price.desc(),
        "rating":     Book.rating.desc(),
        "newest":     Book.created_at.desc(),
    }
    q = q.order_by(sort_map.get(sort_by, Book.title.asc()))

    # Count total
    count_q = select(func.count()).select_from(q.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    # Paginate
    q = q.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(q)
    books = result.scalars().all()

    import math
    return {
        "books":    [b.to_dict() for b in books],
        "total":    total,
        "page":     page,
        "pages":    math.ceil(total / per_page) if total else 0,
        "per_page": per_page,
    }


# ── GET /api/books/:id ────────────────────────────────────────────────────────
@router.get("/{book_id}")
async def get_book(book_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Book)
        .where(Book.id == book_id, Book.is_active == True)
        .options(selectinload(Book.reviews))
    )
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(404, "Book not found")
    data = book.to_dict()
    data["reviews"] = [r.to_dict() for r in sorted(book.reviews, key=lambda r: r.created_at, reverse=True)[:20]]
    return data


# ── POST /api/books ───────────────────────────────────────────────────────────
@router.post("/", status_code=201)
async def create_book(
    body: BookCreate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    book = Book(**body.model_dump())
    db.add(book)
    await db.commit()
    await db.refresh(book)
    await _refresh_rag_index(db)
    return book.to_dict()


# ── PUT /api/books/:id ────────────────────────────────────────────────────────
@router.put("/{book_id}")
async def update_book(
    book_id: str,
    body: BookUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(404, "Book not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(book, field, value)
    await db.commit()
    await db.refresh(book)
    await _refresh_rag_index(db)
    return book.to_dict()


# ── DELETE /api/books/:id ─────────────────────────────────────────────────────
@router.delete("/{book_id}")
async def delete_book(
    book_id: str,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(404, "Book not found")
    book.is_active = False
    await db.commit()
    await _refresh_rag_index(db)
    return {"message": "Book deleted"}


# ── POST /api/books/upload ────────────────────────────────────────────────────
@router.post("/upload", status_code=201)
async def upload_book_file(
    book_id: str = Form(...),
    file: UploadFile = File(...),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    allowed = {"pdf", "epub", "jpg", "jpeg", "png", "webp"}
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in allowed:
        raise HTTPException(400, f"Invalid file type. Allowed: {allowed}")

    upload_folder = os.getenv("UPLOAD_FOLDER", "./uploads")
    os.makedirs(upload_folder, exist_ok=True)

    from werkzeug.utils import secure_filename
    filename = secure_filename(f"{book_id}_{file.filename}")
    filepath = os.path.join(upload_folder, filename)
    with open(filepath, "wb") as f:
        f.write(await file.read())

    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if book:
        book.file_url = f"/api/books/{book_id}/download"
        await db.commit()

    return {"message": "File uploaded", "filename": filename, "book_id": book_id}


# ── GET /api/books/:id/download ──────────────────────────────────────────────
@router.get("/{book_id}/download")
async def download_book(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Book).where(Book.id == book_id, Book.is_active == True))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(404, "Book not found")

    # Verify purchase (unless free)
    if not book.is_free:
        purchased = await db.execute(
            select(OrderItem.id)
            .join(Order)
            .where(Order.user_id == current_user.id, OrderItem.book_id == book_id)
            .limit(1)
        )
        # A user can legitimately have purchased the same book across more
        # than one order (e.g. bought it twice), which means this query can
        # return multiple matching rows. We only need to know whether AT
        # LEAST ONE match exists, so use first() rather than
        # scalar_one_or_none() — the latter raises MultipleResultsFound
        # (and crashes with a 500) the moment there's more than one match.
        if not purchased.first():
            raise HTTPException(403, "You have not purchased this book")

    upload_folder = os.getenv("UPLOAD_FOLDER", "./uploads")
    if not os.path.exists(upload_folder):
        raise HTTPException(404, "File not found")

    files = [f for f in os.listdir(upload_folder) if f.startswith(book_id)]
    if not files:
        raise HTTPException(404, "File not found on server")

    filepath = os.path.join(upload_folder, files[0])
    ext = files[0].rsplit(".", 1)[-1]
    media_type = "application/epub+zip" if ext == "epub" else "application/pdf"
    return FileResponse(filepath, media_type=media_type, filename=f"{book.title}.{ext}")