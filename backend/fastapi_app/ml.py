from fastapi import APIRouter, HTTPException
import os, joblib, asyncpg
from pathlib import Path

router = APIRouter()

MODEL_DIR = Path(os.getenv("ML_MODEL_DIR", "./ml/models"))
DB_URL = os.getenv("DATABASE_URL", "")


async def get_conn():
    return await asyncpg.connect(DB_URL)


# ── GET /ml/recommend/:userId ─────────────────────────────────────────────────
@router.get("/recommend/{user_id}")
async def get_recommendations(user_id: str, n: int = 10):
    """Return top-N recommended book IDs for a user."""
    model_path = MODEL_DIR / "recommender.pkl"
    if not model_path.exists():
        # Fallback: return bestsellers from DB
        conn = await get_conn()
        try:
            rows = await conn.fetch(
                "SELECT id FROM books WHERE is_active=TRUE ORDER BY rating DESC, review_count DESC LIMIT $1", n
            )
            return {"userId": user_id, "recommendations": [r["id"] for r in rows], "fallback": True}
        finally:
            await conn.close()

    try:
        model_data = joblib.load(model_path)
        hybrid = model_data.get("hybrid")
        book_ids = model_data.get("book_ids", [])

        if not hybrid or not book_ids:
            raise ValueError("Model missing required components")

        # Get books the user has already read
        conn = await get_conn()
        try:
            read_rows = await conn.fetch(
                "SELECT DISTINCT book_id FROM reading_sessions WHERE user_id=$1", user_id
            )
            read_ids = {r["book_id"] for r in read_rows}
        finally:
            await conn.close()

        scores = hybrid.get(user_id, {})
        ranked = sorted(
            [(bid, score) for bid, score in scores.items() if bid not in read_ids],
            key=lambda x: x[1], reverse=True
        )
        return {"userId": user_id, "recommendations": [bid for bid, _ in ranked[:n]], "fallback": False}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")


# ── GET /ml/sentiment/:bookId ─────────────────────────────────────────────────
@router.get("/sentiment/{book_id}")
async def get_sentiment(book_id: str):
    """Return aggregated sentiment for all reviews of a book."""
    conn = await get_conn()
    try:
        rows = await conn.fetch(
            "SELECT comment FROM reviews WHERE book_id=$1 AND comment IS NOT NULL", book_id
        )
        if not rows:
            return {"bookId": book_id, "sentiment": "neutral", "score": 0.0, "reviewCount": 0}

        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        analyzer = SentimentIntensityAnalyzer()
        scores = [analyzer.polarity_scores(r["comment"])["compound"] for r in rows]
        avg_score = round(sum(scores) / len(scores), 3)

        if avg_score >= 0.05:
            label = "positive"
        elif avg_score <= -0.05:
            label = "negative"
        else:
            label = "neutral"

        return {
            "bookId": book_id,
            "sentiment": label,
            "score": avg_score,
            "reviewCount": len(rows),
        }
    finally:
        await conn.close()