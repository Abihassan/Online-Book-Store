from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import CartItem, Book

cart_bp = Blueprint("cart", __name__)


# ── GET /api/cart ─────────────────────────────────────────────────────────────
@cart_bp.get("/")
@jwt_required()
def get_cart():
    user_id = get_jwt_identity()
    items = CartItem.query.filter_by(user_id=user_id).all()
    return jsonify([i.to_dict() for i in items])


# ── POST /api/cart ────────────────────────────────────────────────────────────
@cart_bp.post("/")
@jwt_required()
def add_to_cart():
    user_id = get_jwt_identity()
    data = request.get_json()
    book_id = data.get("bookId")
    quantity = int(data.get("quantity", 1))

    book = Book.query.filter_by(id=book_id, is_active=True).first()
    if not book:
        return jsonify({"error": "Book not found"}), 404

    existing = CartItem.query.filter_by(user_id=user_id, book_id=book_id).first()
    if existing:
        existing.quantity += quantity
    else:
        item = CartItem(user_id=user_id, book_id=book_id, quantity=quantity)
        db.session.add(item)

    db.session.commit()
    items = CartItem.query.filter_by(user_id=user_id).all()
    return jsonify([i.to_dict() for i in items])


# ── PUT /api/cart/:item_id ────────────────────────────────────────────────────
@cart_bp.put("/<item_id>")
@jwt_required()
def update_cart_item(item_id):
    user_id = get_jwt_identity()
    item = CartItem.query.filter_by(id=item_id, user_id=user_id).first_or_404()
    data = request.get_json()
    qty = int(data.get("quantity", 1))
    if qty <= 0:
        db.session.delete(item)
    else:
        item.quantity = qty
    db.session.commit()
    return jsonify({"message": "Cart updated"})


# ── DELETE /api/cart/:item_id ─────────────────────────────────────────────────
@cart_bp.delete("/<item_id>")
@jwt_required()
def remove_from_cart(item_id):
    user_id = get_jwt_identity()
    item = CartItem.query.filter_by(id=item_id, user_id=user_id).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Item removed"})