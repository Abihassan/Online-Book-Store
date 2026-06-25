"""
routers/orders.py — Order endpoints (/api/orders/...)
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Order, OrderItem, CartItem, Book
from ..auth_utils import get_current_user
from ..models import User

router = APIRouter()


class OrderItemBody(BaseModel):
    bookId: str
    quantity: int = 1

class CreateOrderBody(BaseModel):
    items: List[OrderItemBody]
    shippingAddress: Optional[dict] = None
    paymentMethod: Optional[str]   = None

class UpdateStatusBody(BaseModel):
    status: str


@router.post("/", status_code=201)
async def create_order(
    body: CreateOrderBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not body.items:
        raise HTTPException(400, "No items in order")

    total = 0.0
    order_items = []
    for item in body.items:
        book_result = await db.execute(select(Book).where(Book.id == item.bookId))
        book = book_result.scalar_one_or_none()
        if not book:
            raise HTTPException(404, f"Book {item.bookId} not found")
        qty   = item.quantity
        price = book.price
        total += price * qty
        order_items.append(OrderItem(book_id=book.id, quantity=qty, price=price))

    order = Order(
        user_id=current_user.id,
        total=round(total, 2),
        status="pending",
        shipping_address=body.shippingAddress,
        payment_method=body.paymentMethod,
    )
    order.order_items = order_items
    db.add(order)

    # Clear cart
    await db.execute(delete(CartItem).where(CartItem.user_id == current_user.id))

    await db.commit()
    await db.refresh(order)
    return order.to_dict()


@router.get("/")
async def get_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == "admin":
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.order_items))
            .order_by(Order.created_at.desc())
        )
    else:
        result = await db.execute(
            select(Order)
            .where(Order.user_id == current_user.id)
            .options(selectinload(Order.order_items))
            .order_by(Order.created_at.desc())
        )
    return [o.to_dict() for o in result.scalars().all()]


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.order_items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Unauthorized")
    return order.to_dict()


@router.put("/{order_id}/status")
async def update_order_status(
    order_id: str,
    body: UpdateStatusBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin access required")
    allowed = ["pending", "processing", "shipped", "delivered", "completed", "cancelled"]
    if body.status not in allowed:
        raise HTTPException(400, f"Invalid status. Choose from {allowed}")

    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.order_items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    order.status = body.status
    await db.commit()
    await db.refresh(order)
    return order.to_dict()
