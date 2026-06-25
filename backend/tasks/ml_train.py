from ..celery_app.celery import celery_app
from pathlib import Path
import os, joblib, psycopg2
import pandas as pd

MODEL_DIR = Path(os.getenv("ML_MODEL_DIR", "./ml/models"))
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def _get_db():
    return psycopg2.connect(os.getenv("DATABASE_URL", ""))


# ── Retrain recommender weekly ─────────────────────────────────────────────────
@celery_app.task(bind=True, max_retries=2, default_retry_delay=300)
def retrain_recommender(self):
    """Full recommender pipeline: fetch data → train → save model."""
    try:
        from ml.recommender.train import run_training
        model_path = MODEL_DIR / "recommender.pkl"
        result = run_training(output_path=str(model_path))
        return {"status": "ok", "model": str(model_path), "metrics": result}
    except Exception as exc:
        raise self.retry(exc=exc)


# ── Re-embed book catalog for RAG chatbot ─────────────────────────────────────
@celery_app.task(bind=True, max_retries=2, default_retry_delay=120)
def reembed_catalog(self):
    """Fetch all books from DB and rebuild the FAISS embedding index."""
    try:
        from ml.chatbot.rag import build_index
        conn = _get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, title, author, genre, description, price, cover_url FROM books WHERE is_active=TRUE"
        )
        rows = cur.fetchall()
        conn.close()

        books = [
            {
                "id": r[0], "title": r[1], "author": r[2],
                "genre": r[3], "description": r[4] or "",
                "price": float(r[5] or 0), "cover_url": r[6] or "",
            }
            for r in rows
        ]
        index_path = str(MODEL_DIR / "catalog.faiss")
        build_index(books, index_path)
        return {"status": "ok", "books_indexed": len(books), "index": index_path}
    except Exception as exc:
        raise self.retry(exc=exc)


# ── Batch sentiment scoring ───────────────────────────────────────────────────
@celery_app.task
def batch_sentiment_score():
    """Run VADER on all un-scored reviews and store compound score."""
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    analyzer = SentimentIntensityAnalyzer()
    conn = _get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, comment FROM reviews WHERE comment IS NOT NULL AND sentiment_score IS NULL")
    reviews = cur.fetchall()
    for rev_id, comment in reviews:
        score = analyzer.polarity_scores(comment)["compound"]
        cur.execute("UPDATE reviews SET sentiment_score=%s WHERE id=%s", (score, rev_id))
    conn.commit()
    conn.close()
    return {"scored": len(reviews)}