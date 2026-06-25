from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, extract
from app.extensions import db
from app.models import User, Book, Order, OrderItem

admin_bp = Blueprint("admin", __name__)


def _require_admin():
    user = User.query.get(get_jwt_identity())
    if not user or user.role != "admin":
        return False
    return True


# ── GET /api/admin/users ──────────────────────────────────────────────────────
@admin_bp.get("/users")
@jwt_required()
def get_users():
    if not _require_admin():
        return jsonify({"error": "Admin only"}), 403
    page = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 20)), 100)
    search = request.args.get("search")
    q = User.query
    if search:
        q = q.filter(User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
    paginated = q.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        "users": [u.to_dict() for u in paginated.items],
        "total": paginated.total, "page": page, "pages": paginated.pages,
    })


# ── PUT /api/admin/users/:id ──────────────────────────────────────────────────
@admin_bp.put("/users/<user_id>")
@jwt_required()
def update_user(user_id):
    if not _require_admin():
        return jsonify({"error": "Admin only"}), 403
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    if "is_active" in data: user.is_active = bool(data["is_active"])
    if "role" in data and data["role"] in ("admin", "customer"): user.role = data["role"]
    db.session.commit()
    return jsonify(user.to_dict())


# ── GET /api/admin/stats ──────────────────────────────────────────────────────
@admin_bp.get("/stats")
@jwt_required()
def get_stats():
    if not _require_admin():
        return jsonify({"error": "Admin only"}), 403
    total_revenue = db.session.query(func.sum(Order.total)).scalar() or 0
    return jsonify({
        "totalBooks": Book.query.filter_by(is_active=True).count(),
        "totalUsers": User.query.count(),
        "totalOrders": Order.query.count(),
        "totalRevenue": round(float(total_revenue), 2),
    })


# ── GET /api/admin/revenue — monthly grouped ──────────────────────────────────
@admin_bp.get("/revenue")
@jwt_required()
def get_revenue():
    if not _require_admin():
        return jsonify({"error": "Admin only"}), 403
    rows = (
        db.session.query(
            extract("year", Order.created_at).label("year"),
            extract("month", Order.created_at).label("month"),
            func.sum(Order.total).label("revenue"),
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .limit(12)
        .all()
    )
    import calendar
    result = [
        {
            "month": f"{calendar.month_abbr[int(r.month)]} {int(r.year) % 100:02d}",
            "revenue": round(float(r.revenue), 2),
        }
        for r in rows
    ]
    return jsonify(result)


# ── GET /api/admin/top-books ──────────────────────────────────────────────────
@admin_bp.get("/top-books")
@jwt_required()
def get_top_books():
    if not _require_admin():
        return jsonify({"error": "Admin only"}), 403
    n = int(request.args.get("n", 10))
    rows = (
        db.session.query(OrderItem.book_id, func.sum(OrderItem.quantity).label("sales"))
        .group_by(OrderItem.book_id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(n)
        .all()
    )
    result = []
    for row in rows:
        book = Book.query.get(row.book_id)
        if book:
            result.append({"title": book.title[:25], "sales": int(row.sales)})
    return jsonify(result)