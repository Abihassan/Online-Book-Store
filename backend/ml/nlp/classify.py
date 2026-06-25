"""
Genre classifier using sklearn LogisticRegression on TF-IDF of title + description.
Train:   python -m ml.nlp.classify
"""
import os
import joblib
from pathlib import Path
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

MODEL_DIR = Path(os.getenv("ML_MODEL_DIR", "./ml/models"))
MODEL_PATH = MODEL_DIR / "genre_classifier.pkl"


def _build_text(df: pd.DataFrame) -> pd.Series:
    return (
        df["title"].fillna("") + " " +
        df["genre"].fillna("") + " " +
        df["description"].fillna("")
    )


def train(books_df: pd.DataFrame = None) -> dict:
    """
    Train genre classifier on books data.
    Saves model to MODEL_PATH.
    Returns evaluation metrics dict.
    """
    if books_df is None:
        from data.db_connect import get_books_df
        books_df = get_books_df()

    df = books_df.dropna(subset=["genre"]).copy()
    if len(df) < 10:
        print("Not enough labeled data to train genre classifier.")
        return {"error": "insufficient data"}

    X = _build_text(df)
    y = df["genre"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y if len(y.unique()) > 1 else None
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=10_000,
            ngram_range=(1, 2),
            stop_words="english",
            sublinear_tf=True,
        )),
        ("clf", LogisticRegression(
            max_iter=500,
            C=1.0,
            class_weight="balanced",
            random_state=42,
        )),
    ])

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    accuracy = report.get("accuracy", 0)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH, compress=3)
    print(f"Genre classifier saved → {MODEL_PATH}  (accuracy={accuracy:.3f})")
    return {"accuracy": accuracy, "report": report}


def predict(texts: list) -> list:
    """
    Predict genre for a list of text strings.
    Returns list of predicted genre labels.
    """
    if not MODEL_PATH.exists():
        train()
    pipeline = joblib.load(MODEL_PATH)
    return pipeline.predict(texts).tolist()


def predict_book(book: dict) -> str:
    """Predict genre for a single book dict."""
    text = f"{book.get('title','')} {book.get('description','')}"
    results = predict([text])
    return results[0] if results else "Unknown"


if __name__ == "__main__":
    metrics = train()
    print(f"\nAccuracy: {metrics.get('accuracy', 'N/A'):.3f}")