"""
routers/ml.py — ML recommendation and sentiment endpoints (/ml/...)
"""
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import ReadingSession, Review

router = APIRouter()

MODEL_DIR = Path(os.getenv("ML_MODEL_DIR", "./ml/models"))


@router.get("/recommend/{user_id}")
async def get_recommendations(user_id: str, n: int = 10, db: AsyncSession = Depends(get_db)):
    model_path = MODEL_DIR / "recommender.pkl"

    if not model_path.exists():
        # Fallback: return top-rated books from DB
        from ..models import Book
        from sqlalchemy import func
        result = await db.execute(
            select(Book)
            .where(Book.is_active == True)
            .order_by(Book.rating.desc(), Book.review_count.desc())
            .limit(n)
        )
        books = result.scalars().all()
        return {"userId": user_id, "recommendations": [b.id for b in books], "fallback": True}

    try:
        import joblib
        model_data = joblib.load(model_path)
        hybrid = model_data.get("hybrid")
        if not hybrid:
            raise ValueError("Model missing hybrid component")

        read_result = await db.execute(
            select(ReadingSession.book_id).where(ReadingSession.user_id == user_id).distinct()
        )
        read_ids = {r[0] for r in read_result.all()}

        scores = hybrid.get(user_id, {})
        ranked = sorted(
            [(bid, score) for bid, score in scores.items() if bid not in read_ids],
            key=lambda x: x[1], reverse=True,
        )
        return {"userId": user_id, "recommendations": [bid for bid, _ in ranked[:n]], "fallback": False}

    except Exception as e:
        raise HTTPException(500, f"Recommendation error: {str(e)}")


@router.get("/sentiment/{book_id}")
async def get_sentiment(book_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review.comment)
        .where(Review.book_id == book_id, Review.comment.is_not(None))
    )
    comments = [r[0] for r in result.all()]

    if not comments:
        return {"bookId": book_id, "sentiment": "neutral", "score": 0.0, "reviewCount": 0}

    try:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        analyzer = SentimentIntensityAnalyzer()
        scores = [analyzer.polarity_scores(c)["compound"] for c in comments]
        avg = round(sum(scores) / len(scores), 3)
        label = "positive" if avg >= 0.05 else ("negative" if avg <= -0.05 else "neutral")
        return {"bookId": book_id, "sentiment": label, "score": avg, "reviewCount": len(comments)}
    except ImportError:
        return {"bookId": book_id, "sentiment": "neutral", "score": 0.0, "reviewCount": len(comments)}
