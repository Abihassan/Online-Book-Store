import os
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models import Book, User, Review, Order, OrderItem
from sqlalchemy import or_

books_bp = Blueprint("books", __name__)


def _is_admin():
    user = User.query.get(get_jwt_identity())
    return user and user.role == "admin"


def allowed_file(filename):
    exts = current_app.config.get("ALLOWED_EXTENSIONS", {"pdf", "epub"})
    return "." in filename and filename.rsplit(".", 1)[1].lower() in exts


# ── GET /api/books ────────────────────────────────────────────────────────────
@books_bp.get("/")
def get_books():
    page     = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 12)), 100)
    genre    = request.args.get("genre")
    author   = request.args.get("author")
    min_rating = request.args.get("min_rating", type=float)
    min_price  = request.args.get("min_price",  type=float)
    max_price  = request.args.get("max_price",  type=float)
    search   = request.args.get("search")
    sort_by  = request.args.get("sort_by", "title")

    q = Book.query.filter_by(is_active=True)

    if search:
        term = f"%{search}%"
        q = q.filter(or_(Book.title.ilike(term), Book.author.ilike(term), Book.description.ilike(term)))
    if genre:     q = q.filter(Book.genre == genre)
    if author:    q = q.filter(Book.author == author)
    if min_rating: q = q.filter(Book.rating >= min_rating)
    if min_price:  q = q.filter(Book.price >= min_price)
    if max_price:  q = q.filter(Book.price <= max_price)

    sort_map = {
        "title": Book.title.asc(), "price-low": Book.price.asc(),
        "price-high": Book.price.desc(), "rating": Book.rating.desc(),
        "newest": Book.created_at.desc(),
    }
    q = q.order_by(sort_map.get(sort_by, Book.title.asc()))

    paginated = q.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        "books": [b.to_dict() for b in paginated.items],
        "total": paginated.total, "page": page,
        "pages": paginated.pages, "per_page": per_page,
    })


# ── GET /api/books/:id ────────────────────────────────────────────────────────
@books_bp.get("/<book_id>")
def get_book(book_id):
    book = Book.query.filter_by(id=book_id, is_active=True).first_or_404()
    data = book.to_dict()
    data["reviews"] = [r.to_dict() for r in book.reviews.order_by(Review.created_at.desc()).limit(20)]
    return jsonify(data)


# ── POST /api/books — admin only ──────────────────────────────────────────────
@books_bp.post("/")
@jwt_required()
def create_book():
    if not _is_admin():
        return jsonify({"error": "Admin access required"}), 403
    data = request.get_json()
    book = Book(
        title=data.get("title"), author=data.get("author"),
        genre=data.get("genre"), isbn=data.get("isbn"),
        price=float(data.get("price", 0)),
        original_price=data.get("original_price"),
        is_free=data.get("is_free", False),
        cover_url=data.get("cover_url"), description=data.get("description"),
        pages=data.get("pages"), language=data.get("language", "English"),
        badge=data.get("badge"), published_date=data.get("published_date"),
    )
    db.session.add(book)
    db.session.commit()
    return jsonify(book.to_dict()), 201


# ── PUT /api/books/:id — admin only ──────────────────────────────────────────
@books_bp.put("/<book_id>")
@jwt_required()
def update_book(book_id):
    if not _is_admin():
        return jsonify({"error": "Admin access required"}), 403
    book = Book.query.get_or_404(book_id)
    data = request.get_json()
    for field in ["title", "author", "genre", "isbn", "price", "original_price",
                  "is_free", "cover_url", "description", "pages", "language",
                  "badge", "published_date"]:
        if field in data:
            setattr(book, field, data[field])
    db.session.commit()
    return jsonify(book.to_dict())


# ── DELETE /api/books/:id — admin only (soft delete) ──────────────────────────
@books_bp.delete("/<book_id>")
@jwt_required()
def delete_book(book_id):
    if not _is_admin():
        return jsonify({"error": "Admin access required"}), 403
    book = Book.query.get_or_404(book_id)
    book.is_active = False
    db.session.commit()
    return jsonify({"message": "Book deleted"})


# ── POST /api/books/upload — admin only ───────────────────────────────────────
@books_bp.post("/upload")
@jwt_required()
def upload_book_file():
    if not _is_admin():
        return jsonify({"error": "Admin access required"}), 403
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    book_id = request.form.get("book_id")

    if not file or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Use PDF or EPUB."}), 400

    filename = secure_filename(f"{book_id}_{file.filename}")
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    if book_id:
        book = Book.query.get(book_id)
        if book:
            book.file_url = f"/api/books/{book_id}/download"
            db.session.commit()

    return jsonify({"message": "File uploaded", "filename": filename, "book_id": book_id}), 201


# ── GET /api/books/:id/download — authenticated ───────────────────────────────
@books_bp.get("/<book_id>/download")
@jwt_required()
def download_book(book_id):
    user_id = get_jwt_identity()
    book = Book.query.filter_by(id=book_id, is_active=True).first_or_404()

    # Verify user purchased the book
    purchased = (
        OrderItem.query
        .join(Order)
        .filter(Order.user_id == user_id, OrderItem.book_id == book_id)
        .first()
    )
    if not purchased and not book.is_free:
        return jsonify({"error": "You have not purchased this book"}), 403

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    files = [f for f in os.listdir(upload_folder) if f.startswith(book_id)] if os.path.exists(upload_folder) else []

    if not files:
        return jsonify({"error": "File not found on server"}), 404

    filepath = os.path.join(upload_folder, files[0])
    ext = files[0].rsplit(".", 1)[-1]
    mime = "application/epub+zip" if ext == "epub" else "application/pdf"

    return send_file(
        filepath,
        mimetype=mime,
        as_attachment=True,
        download_name=f"{book.title}.{ext}",
    )