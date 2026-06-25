"""
Review sentiment scoring using VADER SentimentIntensityAnalyzer.
Run standalone to batch-score all reviews:
    python -m ml.nlp.sentiment
"""
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer = None


def get_analyzer() -> SentimentIntensityAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = SentimentIntensityAnalyzer()
    return _analyzer


def score_text(text: str) -> dict:
    """
    Score a single text string.
    Returns: {compound, pos, neu, neg, label}
    """
    if not text or not text.strip():
        return {"compound": 0.0, "pos": 0.0, "neu": 1.0, "neg": 0.0, "label": "neutral"}

    analyzer = get_analyzer()
    scores = analyzer.polarity_scores(text)
    compound = scores["compound"]

    if compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"

    return {
        "compound": round(compound, 4),
        "pos": round(scores["pos"], 4),
        "neu": round(scores["neu"], 4),
        "neg": round(scores["neg"], 4),
        "label": label,
    }


def score_book_reviews(book_id: str, reviews: list) -> dict:
    """
    Aggregate sentiment for a list of review dicts (each has 'comment').
    Returns average compound score + label breakdown.
    """
    if not reviews:
        return {"bookId": book_id, "sentiment": "neutral", "score": 0.0,
                "reviewCount": 0, "breakdown": {"positive": 0, "neutral": 0, "negative": 0}}

    scores = [score_text(r.get("comment", "")) for r in reviews]
    avg = sum(s["compound"] for s in scores) / len(scores)
    breakdown = {"positive": 0, "neutral": 0, "negative": 0}
    for s in scores:
        breakdown[s["label"]] += 1

    label = "positive" if avg >= 0.05 else "negative" if avg <= -0.05 else "neutral"
    return {
        "bookId": book_id,
        "sentiment": label,
        "score": round(avg, 4),
        "reviewCount": len(reviews),
        "breakdown": breakdown,
    }


def batch_score_all_reviews():
    """
    Fetch all reviews without a sentiment score from the DB,
    compute VADER scores, and persist them back.
    Run via Celery task or directly.
    """
    import psycopg2, os
    conn = psycopg2.connect(os.getenv("DATABASE_URL", ""))
    cur = conn.cursor()
    cur.execute(
        "SELECT id, comment FROM reviews WHERE sentiment_score IS NULL AND comment IS NOT NULL"
    )
    rows = cur.fetchall()
    updated = 0
    for review_id, comment in rows:
        result = score_text(comment)
        cur.execute(
            "UPDATE reviews SET sentiment_score = %s WHERE id = %s",
            (result["compound"], review_id),
        )
        updated += 1
    conn.commit()
    cur.close()
    conn.close()
    print(f"Scored {updated} reviews.")
    return updated


if __name__ == "__main__":
    batch_score_all_reviews()