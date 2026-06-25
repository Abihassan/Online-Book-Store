"""
Run with:
    python seed.py

Before running:
1. Make sure DATABASE_URL is set in .env
2. Run migrations first:
       flask db upgrade
"""

import os
import sys
from datetime import datetime, timedelta

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend root to Python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

# App imports
from app import create_app
from app.extensions import db, bcrypt
from app.models import (
    User,
    Book,
    Order,
    OrderItem,
    Review,
    ReadingSession,
    Download,
)

# -------------------------------------------------------------------
# Sample Books
# -------------------------------------------------------------------

SAMPLE_BOOKS = [
    # ---------------- FICTION ----------------
    {
        "title": "The Midnight Library",
        "author": "Matt Haig",
        "genre": "Fiction",
        "price": 14.99,
        "rating": 4.5,
        "badge": "bestseller",
        "isbn": "978-0525559474",
        "pages": 304,
        "cover_url": "https://images.pexels.com/photos/1907785/pexels-photo-1907785.jpeg?auto=compress&cs=tinysrgb&w=400",
        "description": "A woman discovers a library between life and death."
    },
    {
        "title": "Where the Crawdads Sing",
        "author": "Delia Owens",
        "genre": "Fiction",
        "price": 14.99,
        "rating": 4.5,
        "badge": "bestseller",
        "isbn": "978-0735219090",
        "pages": 384,
        "cover_url": "https://images.pexels.com/photos/415071/pexels-photo-415071.jpeg?auto=compress&cs=tinysrgb&w=400",
        "description": "A girl grows up isolated in the marshlands."
    },
    {
        "title": "The Book Thief",
        "author": "Markus Zusak",
        "genre": "Fiction",
        "price": 13.99,
        "rating": 4.6,
        "badge": "trending",
        "isbn": "978-0375842207",
        "pages": 552,
        "cover_url": "https://images.pexels.com/photos/4666754/pexels-photo-4666754.jpeg?auto=compress&cs=tinysrgb&w=400",
        "description": "A story narrated by Death during WWII."
    },

    # ---------------- SCIENCE FICTION ----------------
    {
        "title": "Dune",
        "author": "Frank Herbert",
        "genre": "Science Fiction",
        "price": 17.99,
        "rating": 4.8,
        "isbn": "978-0441172719",
        "pages": 688,
        "cover_url": "...",
        "description": "A desert planet and political struggle for spice."
    },
    {
        "title": "Project Hail Mary",
        "author": "Andy Weir",
        "genre": "Science Fiction",
        "price": 16.99,
        "rating": 4.8,
        "isbn": "978-0593135204",
        "pages": 496,
        "cover_url": "...",
        "description": "An astronaut wakes up alone to save Earth."
    },
    {
        "title": "Neuromancer",
        "author": "William Gibson",
        "genre": "Science Fiction",
        "price": 15.99,
        "rating": 4.4,
        "isbn": "978-0441569595",
        "pages": 271,
        "cover_url": "...",
        "description": "A cyberpunk hacker is hired for a final job."
    },

    # ---------------- SELF HELP ----------------
    {
        "title": "Atomic Habits",
        "author": "James Clear",
        "genre": "Self-Help",
        "price": 15.99,
        "rating": 4.9,
        "isbn": "978-0735211292",
        "pages": 320,
        "cover_url": "...",
        "description": "Build good habits and break bad ones."
    },
    {
        "title": "Deep Work",
        "author": "Cal Newport",
        "genre": "Self-Help",
        "price": 14.99,
        "rating": 4.6,
        "isbn": "978-1455586691",
        "pages": 304,
        "cover_url": "...",
        "description": "Focus without distraction for high productivity."
    },
    {
        "title": "The Power of Habit",
        "author": "Charles Duhigg",
        "genre": "Self-Help",
        "price": 14.99,
        "rating": 4.6,
        "isbn": "978-0812981605",
        "pages": 371,
        "cover_url": "...",
        "description": "Why habits exist and how to change them."
    },

    # ---------------- MYSTERY ----------------
    {
        "title": "The Silent Patient",
        "author": "Alex Michaelides",
        "genre": "Mystery",
        "price": 14.99,
        "rating": 4.6,
        "isbn": "978-1250301697",
        "pages": 336,
        "cover_url": "...",
        "description": "A woman stops speaking after a crime."
    },
    {
        "title": "Gone Girl",
        "author": "Gillian Flynn",
        "genre": "Mystery",
        "price": 15.99,
        "rating": 4.7,
        "isbn": "978-0307588371",
        "pages": 422,
        "cover_url": "...",
        "description": "A husband becomes the main suspect in his wife's disappearance."
    },
    {
        "title": "The Girl with the Dragon Tattoo",
        "author": "Stieg Larsson",
        "genre": "Mystery",
        "price": 16.99,
        "rating": 4.5,
        "isbn": "978-0307454546",
        "pages": 465,
        "cover_url": "...",
        "description": "A journalist investigates a decades-old disappearance."
    },

    # ---------------- ROMANCE ----------------
    {
        "title": "The Notebook",
        "author": "Nicholas Sparks",
        "genre": "Romance",
        "price": 13.99,
        "rating": 4.5,
        "isbn": "978-1455582877",
        "pages": 214,
        "cover_url": "...",
        "description": "A lifelong love story between Noah and Allie."
    },
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "genre": "Romance",
        "price": 12.99,
        "rating": 4.7,
        "isbn": "978-0141439518",
        "pages": 279,
        "cover_url": "...",
        "description": "Elizabeth Bennet navigates love and society."
    },
    {
        "title": "Me Before You",
        "author": "Jojo Moyes",
        "genre": "Romance",
        "price": 14.99,
        "rating": 4.6,
        "isbn": "978-0143124542",
        "pages": 369,
        "cover_url": "...",
        "description": "A caretaker changes a man's outlook on life."
    },

    # ---------------- FINANCE ----------------
    {
        "title": "The Psychology of Money",
        "author": "Morgan Housel",
        "genre": "Finance",
        "price": 15.99,
        "rating": 4.8,
        "isbn": "978-0857197689",
        "pages": 256,
        "cover_url": "...",
        "description": "How people think about money matters more than knowledge."
    },
    {
        "title": "Rich Dad Poor Dad",
        "author": "Robert Kiyosaki",
        "genre": "Finance",
        "price": 14.99,
        "rating": 4.6,
        "isbn": "978-1612680194",
        "pages": 336,
        "cover_url": "...",
        "description": "Lessons on financial independence and investing."
    },
    {
        "title": "The Intelligent Investor",
        "author": "Benjamin Graham",
        "genre": "Finance",
        "price": 18.99,
        "rating": 4.7,
        "isbn": "978-0060555665",
        "pages": 623,
        "cover_url": "...",
        "description": "Classic value investing principles."
    },

    # ---------------- BIOGRAPHY ----------------
    {
        "title": "Educated",
        "author": "Tara Westover",
        "genre": "Biography",
        "price": 15.99,
        "rating": 4.7,
        "isbn": "978-0399590504",
        "pages": 352,
        "cover_url": "...",
        "description": "A memoir about escaping isolation through education."
    },
    {
        "title": "Steve Jobs",
        "author": "Walter Isaacson",
        "genre": "Biography",
        "price": 16.99,
        "rating": 4.6,
        "isbn": "978-1451648539",
        "pages": 656,
        "cover_url": "...",
        "description": "The life of Apple co-founder Steve Jobs."
    },
    # ---------------- FANTASY ----------------
    {
        "title": "Harry Potter and the Sorcerer's Stone",
        "author": "J.K. Rowling",
        "genre": "Fantasy",
        "price": 16.99,
        "rating": 4.8,
        "isbn": "978-0590353427",
        "pages": 309,
        "cover_url": "...",
        "description": "A young boy discovers he is a wizard and attends Hogwarts."
    },
    {
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "genre": "Fantasy",
        "price": 15.99,
        "rating": 4.9,
        "isbn": "978-0547928227",
        "pages": 310,
        "cover_url": "...",
        "description": "A hobbit is swept into an unexpected adventure with dwarves."
    },
    {
        "title": "The Invisible Life of Addie LaRue",
        "author": "V.E. Schwab",
        "genre": "Fantasy",
        "price": 16.99,
        "rating": 4.6,
        "review_count": 1456,
        "badge": "new",
        "isbn": "978-0765387561",
        "pages": 448,
        "cover_url": "https://images.pexels.com/photos/3721941/pexels-photo-3721941.jpeg?auto=compress&cs=tinysrgb&w=400",
        "description": "A Life No One Will Remember. A Story You Will Never Forget.",
    },
]


# -------------------------------------------------------------------
# Seed Function
# -------------------------------------------------------------------

def seed():
    app = create_app("development")

    with app.app_context():

        print("🌱 Starting database seeding...")

        db.create_all()

        # ---------------- ML FIX (IMPORTANT) ----------------
        EXPANDED_BOOKS = []
        for book in SAMPLE_BOOKS:
            for i in range(3):  # ensures each genre has enough samples
                new_book = book.copy()
                new_book["isbn"] = f"{book['isbn']}-{i}"
                new_book["title"] = f"{book['title']} ({i+1})"
                EXPANDED_BOOKS.append(new_book)

        # -----------------------------------------------------------
        # Create Admin User
        # -----------------------------------------------------------

        admin = User.query.filter_by(email="admin@bookhaven.com").first()

        if not admin:
            admin = User(
                email="admin@bookhaven.com",
                password_hash=bcrypt.generate_password_hash("admin123").decode("utf-8"),
                name="Admin User",
                role="admin",
            )
            db.session.add(admin)

        # -----------------------------------------------------------
        # Create Reader User
        # -----------------------------------------------------------

        reader = User.query.filter_by(email="reader@bookhaven.com").first()

        if not reader:
            reader = User(
                email="reader@bookhaven.com",
                password_hash=bcrypt.generate_password_hash("reader123").decode("utf-8"),
                name="Sample Reader",
                role="customer",
            )
            db.session.add(reader)

        db.session.commit()

        # -----------------------------------------------------------
        # Add Books
        # -----------------------------------------------------------

        for book_data in EXPANDED_BOOKS:

            existing_book = Book.query.filter_by(isbn=book_data["isbn"]).first()

            if not existing_book:
                book = Book(**book_data)
                db.session.add(book)

        db.session.commit()

        print("✅ Books seeded")

        print("\n🎉 Database seeded successfully!")
        print(f"Users: {User.query.count()}")
        print(f"Books: {Book.query.count()}")


if __name__ == "__main__":
    seed()