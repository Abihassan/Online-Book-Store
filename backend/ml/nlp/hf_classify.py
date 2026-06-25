"""
Optional HuggingFace zero-shot genre classification.
Uses facebook/bart-large-mnli (no fine-tuning needed).

Install: pip install transformers torch
Run:     python -m ml.nlp.hf_classify
"""
from typing import List, Optional

CANDIDATE_GENRES = [
    "Fiction", "Science Fiction", "Fantasy", "Mystery", "Thriller",
    "Romance", "Biography", "Self-Help", "History", "Science",
    "Finance", "Psychology", "Philosophy", "Travel", "Children",
]

_classifier = None


def _get_classifier():
    global _classifier
    if _classifier is None:
        try:
            from transformers import pipeline
            _classifier = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli",
                device=-1,          # CPU; change to 0 for GPU
            )
            print("HuggingFace zero-shot classifier loaded.")
        except ImportError:
            raise ImportError(
                "transformers and torch are required for HuggingFace classification. "
                "Install with: pip install transformers torch"
            )
    return _classifier


def classify_genre(
    text: str,
    candidate_labels: Optional[List[str]] = None,
    threshold: float = 0.2,
) -> dict:
    """
    Zero-shot classify text into one of the candidate genres.
    Returns {'genre': str, 'score': float, 'all_scores': dict}
    """
    labels = candidate_labels or CANDIDATE_GENRES
    clf = _get_classifier()
    result = clf(text, candidate_labels=labels, multi_label=False)
    top_label = result["labels"][0]
    top_score = result["scores"][0]

    if top_score < threshold:
        top_label = "Unknown"

    return {
        "genre": top_label,
        "score": round(top_score, 4),
        "all_scores": {
            label: round(score, 4)
            for label, score in zip(result["labels"], result["scores"])
        },
    }


def classify_book(book: dict) -> dict:
    """Classify a single book dict using its title + description."""
    text = f"{book.get('title', '')} {book.get('description', '')}"
    result = classify_genre(text)
    return {**result, "bookId": book.get("id")}


def classify_books_batch(books: list) -> list:
    """
    Classify a list of book dicts.
    Returns list with added 'predicted_genre' field.
    """
    results = []
    for book in books:
        try:
            r = classify_book(book)
            results.append({**book, "predicted_genre": r["genre"], "genre_score": r["score"]})
        except Exception as e:
            results.append({**book, "predicted_genre": None, "error": str(e)})
    return results


if __name__ == "__main__":
    sample = "A detective investigates a series of mysterious murders in 1920s London."
    result = classify_genre(sample)
    print(f"Text:  {sample}")
    print(f"Genre: {result['genre']}  (score={result['score']})")
    print(f"All:   {result['all_scores']}")