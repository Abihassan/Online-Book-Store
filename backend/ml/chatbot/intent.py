"""
Intent detection for the BookHaven chatbot.
Uses keyword matching with a lightweight sklearn classifier as upgrade path.
Intents: recommend | search | buy | read | help | shipping | returns |
         payment | account | orders | greeting | unknown
"""
import re
from typing import Tuple

# Ordered by priority — first match wins
INTENT_RULES = [
    ("greeting",   r"\b(hi|hello|hey|hiya|howdy|good\s+(morning|evening|afternoon))\b"),
    ("recommend",  r"\b(recommend|suggest|what should i read|good book|best book|similar to|like this)\b"),
    ("search",     r"\b(find|search|looking for|do you have|show me|is there|any books (about|on))\b"),
    ("buy",        r"\b(buy|purchase|add to cart|price|how much|cost|checkout)\b"),
    ("read",       r"\b(read|reading|library|download|epub|pdf|start reading)\b"),
    ("shipping",   r"\b(ship|deliver|delivery|how long|arrival|tracking|dispatch)\b"),
    ("returns",    r"\b(return|refund|cancel|money back|exchange)\b"),
    ("payment",    r"\b(pay|payment|card|credit|debit|visa|mastercard|stripe|invoice)\b"),
    ("account",    r"\b(account|profile|password|login|sign in|register|email)\b"),
    ("orders",     r"\b(order|orders|history|past purchase|my purchase|status)\b"),
]


def detect_intent(message: str) -> str:
    """
    Classify user message into an intent string.
    Returns the intent label as a string.
    """
    if not message:
        return "unknown"

    text = message.lower().strip()

    for intent, pattern in INTENT_RULES:
        if re.search(pattern, text):
            return intent

    return "unknown"


def detect_intent_with_confidence(message: str) -> Tuple[str, float]:
    """
    Returns (intent, confidence_score).
    Confidence is 1.0 for rule-based matches, 0.5 for unknown.
    """
    intent = detect_intent(message)
    confidence = 0.5 if intent == "unknown" else 1.0
    return intent, confidence


# ── Optional: sklearn upgrade ─────────────────────────────────────────────────
def train_intent_classifier(examples: list) -> None:
    """
    Train a simple sklearn classifier on labeled examples.
    examples = [{"text": "...", "intent": "..."}, ...]
    Saves model to ml/models/intent_clf.pkl
    """
    import joblib
    from pathlib import Path
    from sklearn.pipeline import Pipeline
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression

    X = [e["text"] for e in examples]
    y = [e["intent"] for e in examples]

    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), stop_words="english")),
        ("clf",   LogisticRegression(max_iter=300, C=1.0)),
    ])
    pipe.fit(X, y)
    path = Path("./ml/models/intent_clf.pkl")
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe, path)
    print(f"Intent classifier saved → {path}")