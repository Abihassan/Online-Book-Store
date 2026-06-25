"""
routers/admin.py — Admin endpoints (/api/admin/...)
"""
import calendar
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract

from ..database import get_db
from ..models import User, Book, Order, OrderItem
from ..auth_utils import get_admin_user

router = APIRouter()


class UpdateUserBody(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str]       = None


# ── GET /api/admin/users ──────────────────────────────────────────────────────
@router.get("/users")
async def get_users(
    page:     int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search:   Optional[str] = None,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(User)
    if search:
        term = f"%{search}%"
        q = q.where(User.name.ilike(term) | User.email.ilike(term))
    q = q.order_by(User.created_at.desc())

    count_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = count_result.scalar() or 0

    result = await db.execute(q.offset((page - 1) * per_page).limit(per_page))
    users = result.scalars().all()

    import math
    return {
        "users": [u.to_dict() for u in users],
        "total": total, "page": page,
        "pages": math.ceil(total / per_page) if total else 0,
    }


# ── PUT /api/admin/users/:id ──────────────────────────────────────────────────
@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    body: UpdateUserBody,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.role and body.role in ("admin", "customer"):
        user.role = body.role
    await db.commit()
    await db.refresh(user)
    return user.to_dict()


# ── GET /api/admin/stats ──────────────────────────────────────────────────────
@router.get("/stats")
async def get_stats(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    total_revenue = await db.execute(select(func.sum(Order.total)))
    revenue = total_revenue.scalar() or 0

    total_books  = await db.execute(select(func.count(Book.id)).where(Book.is_active == True))
    total_users  = await db.execute(select(func.count(User.id)))
    total_orders = await db.execute(select(func.count(Order.id)))

    return {
        "totalBooks":   total_books.scalar() or 0,
        "totalUsers":   total_users.scalar() or 0,
        "totalOrders":  total_orders.scalar() or 0,
        "totalRevenue": round(float(revenue), 2),
    }


# ── GET /api/admin/revenue ────────────────────────────────────────────────────
@router.get("/revenue")
async def get_revenue(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            extract("year",  Order.created_at).label("year"),
            extract("month", Order.created_at).label("month"),
            func.sum(Order.total).label("revenue"),
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .limit(12)
    )
    rows = result.all()
    return [
        {
            "month":   f"{calendar.month_abbr[int(r.month)]} {int(r.year) % 100:02d}",
            "revenue": round(float(r.revenue), 2),
        }
        for r in rows
    ]


# ── GET /api/admin/top-books ──────────────────────────────────────────────────
@router.get("/top-books")
async def get_top_books(
    n: int = Query(10, ge=1, le=50),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrderItem.book_id, func.sum(OrderItem.quantity).label("sales"))
        .group_by(OrderItem.book_id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(n)
    )
    rows = result.all()
    output = []
    for row in rows:
        book_result = await db.execute(select(Book).where(Book.id == row.book_id))
        book = book_result.scalar_one_or_none()
        if book:
            output.append({"title": book.title[:25], "sales": int(row.sales)})
    return output
