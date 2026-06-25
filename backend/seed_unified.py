"""
seed.py — Async database seeder for the unified FastAPI server.

Run with:
    python seed.py

Before running:
    1. Make sure DATABASE_URL is set in backend/.env
    2. The unified server will auto-create tables on first startup (via lifespan),
       OR you can run: python -c "import asyncio; from unified.database import engine, Base; asyncio.run(engine.begin().__aenter__().run_sync(Base.metadata.create_all))"
       But the easiest way is just to start the server once first, then run this seed.
"""

import asyncio
import os
import sys
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from unified.database import AsyncSessionLocal, engine, Base
from unified.models import User, Book

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

SAMPLE_BOOKS = [
    # ---------------- FICTION ----------------
    {"title": "The Midnight Library",       "author": "Matt Haig",         "genre": "Fiction",         "price": 14.99, "rating": 4.5, "badge": "bestseller",  "isbn": "978-0525559474",  "pages": 304, "cover_url": "https://images.pexels.com/photos/1907785/pexels-photo-1907785.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "A woman discovers a library between life and death."},
    {"title": "Where the Crawdads Sing",    "author": "Delia Owens",       "genre": "Fiction",         "price": 14.99, "rating": 4.5, "badge": "bestseller",  "isbn": "978-0735219090",  "pages": 384, "cover_url": "https://images.pexels.com/photos/415071/pexels-photo-415071.jpeg?auto=compress&cs=tinysrgb&w=400",    "description": "A girl grows up isolated in the marshlands."},
    {"title": "The Book Thief",             "author": "Markus Zusak",      "genre": "Fiction",         "price": 13.99, "rating": 4.6, "badge": "trending",    "isbn": "978-0375842207",  "pages": 552, "cover_url": "https://images.pexels.com/photos/4666754/pexels-photo-4666754.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "A story narrated by Death during WWII."},
    {"title": "Normal People",              "author": "Sally Rooney",      "genre": "Fiction",         "price": 13.99, "rating": 4.2, "badge": "new",         "isbn": "978-0571334650",  "pages": 288, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "A love story between two Irish students."},
    # ---------------- SCIENCE FICTION ----------------
    {"title": "Dune",                       "author": "Frank Herbert",     "genre": "Science Fiction", "price": 17.99, "rating": 4.8, "badge": "bestseller",  "isbn": "978-0441172719",  "pages": 688, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "A desert planet and political struggle for spice."},
    {"title": "Project Hail Mary",          "author": "Andy Weir",         "genre": "Science Fiction", "price": 16.99, "rating": 4.8, "badge": "trending",    "isbn": "978-0593135204",  "pages": 496, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "An astronaut wakes up alone to save Earth."},
    {"title": "The Martian",                "author": "Andy Weir",         "genre": "Science Fiction", "price": 14.99, "rating": 4.7, "badge": "bestseller",  "isbn": "978-0804139021",  "pages": 369, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "An astronaut is stranded on Mars."},
    {"title": "Ender's Game",               "author": "Orson Scott Card",  "genre": "Science Fiction", "price": 13.99, "rating": 4.5, "badge": "new",         "isbn": "978-0312853235",  "pages": 352, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "A child prodigy trains to fight an alien war."},
    # ---------------- SELF HELP ----------------
    {"title": "Atomic Habits",              "author": "James Clear",       "genre": "Self-Help",       "price": 15.99, "rating": 4.9, "badge": "bestseller",  "isbn": "978-0735211292",  "pages": 320, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "Build good habits and break bad ones."},
    {"title": "Deep Work",                  "author": "Cal Newport",       "genre": "Self-Help",       "price": 14.99, "rating": 4.6, "badge": "trending",    "isbn": "978-1455586691",  "pages": 304, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "Focus without distraction for high productivity."},
    {"title": "The Power of Habit",         "author": "Charles Duhigg",   "genre": "Self-Help",       "price": 14.99, "rating": 4.6, "badge": "new",         "isbn": "978-0812981605",  "pages": 371, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "Why habits exist and how to change them."},
    {"title": "Think and Grow Rich",        "author": "Napoleon Hill",     "genre": "Self-Help",       "price": 11.99, "rating": 4.3, "badge": "bestseller",  "isbn": "978-1585424337",  "pages": 238, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "Timeless principles of success and wealth."},
    # ---------------- MYSTERY ----------------
    {"title": "The Silent Patient",         "author": "Alex Michaelides",  "genre": "Mystery",         "price": 14.99, "rating": 4.6, "badge": "new",         "isbn": "978-1250301697",  "pages": 336, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "A woman stops speaking after a crime."},
    {"title": "Gone Girl",                  "author": "Gillian Flynn",     "genre": "Mystery",         "price": 14.99, "rating": 4.3, "badge": "trending",    "isbn": "978-0307588364",  "pages": 422, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "A husband becomes the prime suspect in his wife's disappearance."},
    {"title": "Big Little Lies",            "author": "Liane Moriarty",   "genre": "Mystery",         "price": 13.99, "rating": 4.4, "badge": "bestseller",  "isbn": "978-0399167065",  "pages": 460, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "Three women's lives unravel at a school fundraiser."},
    # ---------------- FANTASY ----------------
    {"title": "The Name of the Wind",       "author": "Patrick Rothfuss",  "genre": "Fantasy",         "price": 16.99, "rating": 4.7, "badge": "bestseller",  "isbn": "978-0756404079",  "pages": 662, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "A legendary wizard recounts his life story."},
    {"title": "The Way of Kings",           "author": "Brandon Sanderson", "genre": "Fantasy",         "price": 18.99, "rating": 4.8, "badge": "trending",    "isbn": "978-0765326355",  "pages": 1007,"cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "An epic fantasy on a storm-ravaged world."},
    {"title": "American Gods",              "author": "Neil Gaiman",       "genre": "Fantasy",         "price": 15.99, "rating": 4.5, "badge": "new",         "isbn": "978-0062472106",  "pages": 635, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "Old gods battle new gods in America."},
    # ---------------- BIOGRAPHY ----------------
    {"title": "Educated",                   "author": "Tara Westover",     "genre": "Biography",       "price": 14.99, "rating": 4.8, "badge": "bestseller",  "isbn": "978-0399590504",  "pages": 334, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "A woman raised off-the-grid pursues education."},
    {"title": "Becoming",                   "author": "Michelle Obama",    "genre": "Biography",       "price": 16.99, "rating": 4.7, "badge": "trending",    "isbn": "978-1524763138",  "pages": 426, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "Michelle Obama's memoir of her remarkable life."},
    # ---------------- HISTORY ----------------
    {"title": "Sapiens",                    "author": "Yuval Noah Harari", "genre": "History",         "price": 17.99, "rating": 4.7, "badge": "bestseller",  "isbn": "978-0062316097",  "pages": 443, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "A brief history of humankind."},
    {"title": "Homo Deus",                  "author": "Yuval Noah Harari", "genre": "History",         "price": 16.99, "rating": 4.4, "badge": "new",         "isbn": "978-0062464316",  "pages": 464, "cover_url": "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400",  "description": "A brief history of tomorrow."},
]


async def seed():
    print("🌱 BookHaven database seeder starting...")

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables verified")

    async with AsyncSessionLocal() as db:
        from sqlalchemy import select

        # ── Admin user ────────────────────────────────────────────────────────
        existing_admin = await db.execute(select(User).where(User.email == "admin@bookhaven.com"))
        if not existing_admin.scalar_one_or_none():
            admin = User(
                email="admin@bookhaven.com",
                password_hash=pwd_ctx.hash("admin123"),
                name="Admin User",
                role="admin",
            )
            db.add(admin)
            print("✅ Admin user created  →  admin@bookhaven.com / admin123")
        else:
            print("ℹ️  Admin user already exists")

        # ── Reader user ───────────────────────────────────────────────────────
        existing_reader = await db.execute(select(User).where(User.email == "reader@bookhaven.com"))
        if not existing_reader.scalar_one_or_none():
            reader = User(
                email="reader@bookhaven.com",
                password_hash=pwd_ctx.hash("reader123"),
                name="Sample Reader",
                role="customer",
            )
            db.add(reader)
            print("✅ Reader user created →  reader@bookhaven.com / reader123")
        else:
            print("ℹ️  Reader user already exists")

        await db.commit()

        # ── Books ─────────────────────────────────────────────────────────────
        added = 0
        for book_data in SAMPLE_BOOKS:
            existing = await db.execute(select(Book).where(Book.isbn == book_data["isbn"]))
            if not existing.scalar_one_or_none():
                book = Book(**book_data)
                db.add(book)
                added += 1

        await db.commit()
        print(f"✅ {added} books added")

        # Counts
        total_users = await db.execute(select(User))
        total_books = await db.execute(select(Book))
        print(f"\n🎉 Seed complete!")
        print(f"   Users: {len(total_users.scalars().all())}")
        print(f"   Books: {len(total_books.scalars().all())}")


if __name__ == "__main__":
    asyncio.run(seed())


#http://localhost:8000/docs
#http://127.0.0.1:8000/docs#/
#http://127.0.0.1:8000/redoc#tag/Auth