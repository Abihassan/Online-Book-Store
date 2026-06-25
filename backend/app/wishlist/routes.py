from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import WishlistItem, Book

wishlist_bp = Blueprint("wishlist", __name__)


@wishlist_bp.get("/")
@jwt_required()
def get_wishlist():
    user_id = get_jwt_identity()
    items = WishlistItem.query.filter_by(user_id=user_id).all()
    return jsonify([
        {**i.book.to_dict(), "wishlistItemId": i.id, "addedAt": i.added_at.isoformat()}
        for i in items if i.book
    ])


@wishlist_bp.post("/")
@jwt_required()
def add_to_wishlist():
    user_id = get_jwt_identity()
    book_id = request.get_json().get("bookId")
    if not Book.query.filter_by(id=book_id, is_active=True).first():
        return jsonify({"error": "Book not found"}), 404
    if WishlistItem.query.filter_by(user_id=user_id, book_id=book_id).first():
        return jsonify({"error": "Already in wishlist"}), 409
    item = WishlistItem(user_id=user_id, book_id=book_id)
    db.session.add(item)
    db.session.commit()
    return jsonify({"message": "Added to wishlist", "id": item.id}), 201


@wishlist_bp.delete("/<item_id>")
@jwt_required()
def remove_from_wishlist(item_id):
    user_id = get_jwt_identity()
    item = WishlistItem.query.filter_by(id=item_id, user_id=user_id).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Removed from wishlist"})