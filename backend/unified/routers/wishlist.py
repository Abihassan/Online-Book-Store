"""
routers/wishlist.py — Wishlist endpoints (/api/wishlist/...)
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import WishlistItem, Book
from ..auth_utils import get_current_user
from ..models import User

router = APIRouter()


class AddWishlistBody(BaseModel):
    bookId: str


@router.get("/")
async def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WishlistItem)
        .where(WishlistItem.user_id == current_user.id)
        .options(selectinload(WishlistItem.book))
    )
    items = result.scalars().all()
    return [
        {**i.book.to_dict(), "wishlistItemId": i.id, "addedAt": i.added_at.isoformat()}
        for i in items if i.book
    ]


@router.post("/", status_code=201)
async def add_to_wishlist(
    body: AddWishlistBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    book_result = await db.execute(
        select(Book).where(Book.id == body.bookId, Book.is_active == True)
    )
    if not book_result.scalar_one_or_none():
        raise HTTPException(404, "Book not found")

    existing = await db.execute(
        select(WishlistItem).where(
            WishlistItem.user_id == current_user.id,
            WishlistItem.book_id == body.bookId,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Already in wishlist")

    item = WishlistItem(user_id=current_user.id, book_id=body.bookId)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {"message": "Added to wishlist", "id": item.id}


@router.delete("/{item_id}")
async def remove_from_wishlist(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WishlistItem).where(
            WishlistItem.id == item_id,
            WishlistItem.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Wishlist item not found")
    await db.delete(item)
    await db.commit()
    return {"message": "Removed from wishlist"}
