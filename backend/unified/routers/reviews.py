"""
routers/reviews.py — Review endpoints (/api/reviews/...)
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Review, Book, Order, OrderItem
from ..auth_utils import get_current_user
from ..models import User

router = APIRouter()


class CreateReviewBody(BaseModel):
    bookId: str
    rating: int
    comment: Optional[str] = None


async def _update_book_rating(book_id: str, db: AsyncSession):
    result = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .where(Review.book_id == book_id)
    )
    avg, count = result.one()
    book_result = await db.execute(select(Book).where(Book.id == book_id))
    book = book_result.scalar_one_or_none()
    if book:
        book.rating = round(float(avg or 0), 2)
        book.review_count = count or 0
        await db.commit()


@router.post("/", status_code=201)
async def post_review(
    body: CreateReviewBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not (1 <= body.rating <= 5):
        raise HTTPException(400, "Rating must be between 1 and 5")

    # Verify purchase
    purchased = await db.execute(
        select(OrderItem.id)
        .join(Order)
        .where(Order.user_id == current_user.id, OrderItem.book_id == body.bookId)
        .limit(1)
    )
    # Same fix as books.py's /download endpoint: a user can legitimately
    # have purchased this book across more than one order, so this query
    # can return multiple rows. scalar_one_or_none() would crash with
    # MultipleResultsFound in that case — we only need existence, so use
    # first() instead.
    if not purchased.first():
        raise HTTPException(403, "You must purchase a book before reviewing it")

    # One review per user per book
    existing = await db.execute(
        select(Review).where(
            Review.user_id == current_user.id,
            Review.book_id == body.bookId,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "You have already reviewed this book")

    review = Review(
        user_id=current_user.id,
        book_id=body.bookId,
        rating=body.rating,
        comment=(body.comment or "").strip() or None,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    await _update_book_rating(body.bookId, db)
    return review.to_dict()


@router.get("/book/{book_id}")
async def get_book_reviews(
    book_id: str,
    page:     int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    count_result = await db.execute(
        select(func.count(Review.id)).where(Review.book_id == book_id)
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        select(Review)
        .where(Review.book_id == book_id)
        .options(selectinload(Review.user))
        .order_by(Review.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    reviews = result.scalars().all()

    import math
    return {
        "reviews": [r.to_dict() for r in reviews],
        "total":   total,
        "page":    page,
        "pages":   math.ceil(total / per_page) if total else 0,
    }