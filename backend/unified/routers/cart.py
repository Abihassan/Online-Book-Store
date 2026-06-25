"""
routers/cart.py — Cart endpoints (/api/cart/...)
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import CartItem, Book
from ..auth_utils import get_current_user
from ..models import User

router = APIRouter()


class AddToCartBody(BaseModel):
    bookId: str
    quantity: int = 1

class UpdateCartBody(BaseModel):
    quantity: int


@router.get("/")
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CartItem)
        .where(CartItem.user_id == current_user.id)
        .options(selectinload(CartItem.book))
    )
    items = result.scalars().all()
    return [i.to_dict() for i in items]


@router.post("/")
async def add_to_cart(
    body: AddToCartBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    book_result = await db.execute(
        select(Book).where(Book.id == body.bookId, Book.is_active == True)
    )
    book = book_result.scalar_one_or_none()
    if not book:
        raise HTTPException(404, "Book not found")

    existing_result = await db.execute(
        select(CartItem).where(
            CartItem.user_id == current_user.id,
            CartItem.book_id == body.bookId,
        )
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        existing.quantity += body.quantity
    else:
        item = CartItem(user_id=current_user.id, book_id=body.bookId, quantity=body.quantity)
        db.add(item)

    await db.commit()

    result = await db.execute(
        select(CartItem)
        .where(CartItem.user_id == current_user.id)
        .options(selectinload(CartItem.book))
    )
    return [i.to_dict() for i in result.scalars().all()]


@router.put("/{item_id}")
async def update_cart_item(
    item_id: str,
    body: UpdateCartBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CartItem).where(CartItem.id == item_id, CartItem.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Cart item not found")

    if body.quantity <= 0:
        await db.delete(item)
    else:
        item.quantity = body.quantity
    await db.commit()
    return {"message": "Cart updated"}


@router.delete("/{item_id}")
async def remove_from_cart(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CartItem).where(CartItem.id == item_id, CartItem.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Cart item not found")
    await db.delete(item)
    await db.commit()
    return {"message": "Item removed"}
