from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Order, OrderItem, CartItem, Book, User

orders_bp = Blueprint("orders", __name__)


def _is_admin():
    user = User.query.get(get_jwt_identity())
    return user and user.role == "admin"


# ── POST /api/orders ──────────────────────────────────────────────────────────
@orders_bp.post("/")
@jwt_required()
def create_order():
    user_id = get_jwt_identity()
    data = request.get_json()

    items_data = data.get("items", [])
    if not items_data:
        return jsonify({"error": "No items in order"}), 400

    total = 0.0
    order_items = []

    for item in items_data:
        book = Book.query.get(item.get("bookId"))
        if not book:
            return jsonify({"error": f"Book {item.get('bookId')} not found"}), 404
        qty = int(item.get("quantity", 1))
        price = book.price
        total += price * qty
        order_items.append(OrderItem(book_id=book.id, quantity=qty, price=price))

    order = Order(
        user_id=user_id,
        total=round(total, 2),
        status="pending",
        shipping_address=data.get("shippingAddress"),
        payment_method=data.get("paymentMethod"),
    )
    order.order_items = order_items
    db.session.add(order)

    # Clear server-side cart
    CartItem.query.filter_by(user_id=user_id).delete()

    db.session.commit()

    # Trigger confirmation email via Celery (when Celery is set up)
    # from tasks.email import send_order_confirmation
    # send_order_confirmation.delay(user_id, order.id)

    return jsonify(order.to_dict()), 201


# ── GET /api/orders ───────────────────────────────────────────────────────────
@orders_bp.get("/")
@jwt_required()
def get_orders():
    user_id = get_jwt_identity()
    if _is_admin():
        orders = Order.query.order_by(Order.created_at.desc()).all()
    else:
        orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders])


# ── GET /api/orders/:id ───────────────────────────────────────────────────────
@orders_bp.get("/<order_id>")
@jwt_required()
def get_order(order_id):
    user_id = get_jwt_identity()
    order = Order.query.get_or_404(order_id)
    if order.user_id != user_id and not _is_admin():
        return jsonify({"error": "Unauthorized"}), 403
    return jsonify(order.to_dict())


# ── PUT /api/orders/:id/status — admin only ───────────────────────────────────
@orders_bp.put("/<order_id>/status")
@jwt_required()
def update_order_status(order_id):
    if not _is_admin():
        return jsonify({"error": "Admin access required"}), 403
    order = Order.query.get_or_404(order_id)
    data = request.get_json()
    status = data.get("status")
    allowed = ["pending", "processing", "shipped", "delivered", "completed", "cancelled"]
    if status not in allowed:
        return jsonify({"error": f"Invalid status. Choose from {allowed}"}), 400
    order.status = status
    db.session.commit()
    return jsonify(order.to_dict())