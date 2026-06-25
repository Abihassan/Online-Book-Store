from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app.extensions import db
from app.models import Review, Book, Order, OrderItem

reviews_bp = Blueprint("reviews", __name__)


def _update_book_rating(book_id: str):
    """Recalculate and persist avg rating + count after any review change."""
    result = db.session.query(
        func.avg(Review.rating), func.count(Review.id)
    ).filter_by(book_id=book_id).first()
    avg, count = result
    book = Book.query.get(book_id)
    if book:
        book.rating = round(float(avg or 0), 2)
        book.review_count = count or 0
        db.session.commit()


# ── POST /api/reviews ─────────────────────────────────────────────────────────
@reviews_bp.post("/")
@jwt_required()
def post_review():
    user_id = get_jwt_identity()
    data = request.get_json()
    book_id = data.get("bookId")
    rating = int(data.get("rating", 0))
    comment = (data.get("comment") or "").strip()

    if not book_id or not (1 <= rating <= 5):
        return jsonify({"error": "bookId and a rating between 1-5 are required"}), 400

    # Check user purchased the book
    purchased = (
        OrderItem.query.join(Order)
        .filter(Order.user_id == user_id, OrderItem.book_id == book_id)
        .first()
    )
    if not purchased:
        return jsonify({"error": "You must purchase a book before reviewing it"}), 403

    # Enforce one review per user per book
    if Review.query.filter_by(user_id=user_id, book_id=book_id).first():
        return jsonify({"error": "You have already reviewed this book"}), 409

    review = Review(user_id=user_id, book_id=book_id, rating=rating, comment=comment)
    db.session.add(review)
    db.session.commit()
    _update_book_rating(book_id)

    return jsonify(review.to_dict()), 201


# ── GET /api/reviews/book/:book_id — paginated ────────────────────────────────
@reviews_bp.get("/book/<book_id>")
def get_book_reviews(book_id):
    page = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 10)), 50)
    paginated = (
        Review.query.filter_by(book_id=book_id)
        .order_by(Review.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )
    return jsonify({
        "reviews": [r.to_dict() for r in paginated.items],
        "total": paginated.total, "page": page, "pages": paginated.pages,
    })