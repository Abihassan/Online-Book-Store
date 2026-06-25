"""
Rule-based FAQ fallback for when the LLM is unavailable.
Maps intent / keywords → canned responses.
"""
import re
from typing import Optional

FAQ_MAP = {
    "shipping": (
        "📦 We offer **free shipping** on all orders! "
        "Standard delivery takes 5–7 business days. "
        "Digital books are available instantly in your Library after purchase."
    ),
    "returns": (
        "↩️ We have a **30-day return policy**. "
        "Physical items must be in original condition. "
        "For digital books, returns are accepted within 24 hours if the book hasn't been accessed."
    ),
    "payment": (
        "💳 We accept all major credit and debit cards (Visa, MasterCard, Amex). "
        "All transactions are encrypted and secure."
    ),
    "account": (
        "👤 Manage your account from the **Profile** page. "
        "You can update your name, email, change your password, and view your order history there."
    ),
    "orders": (
        "📋 View all your past orders in your **Profile** page under Order History. "
        "Each order shows books, total amount, date, and current status."
    ),
    "recommend": (
        "📚 I'd love to help you find a great book! "
        "Could you tell me which genre you enjoy? "
        "For example: Fiction, Science Fiction, Mystery, Self-Help, Biography…"
    ),
    "buy": (
        "🛒 You can add any book to your cart from the catalog page or book detail page. "
        "Proceed to checkout when you're ready — we accept all major cards."
    ),
    "read": (
        "📖 Once you've purchased a book it appears in your **Library**. "
        "Click 'Read' to open it in the in-browser reader, or 'Download' to save it."
    ),
    "greeting": (
        "👋 Hi there! I'm **BookBot**, your BookHaven assistant. "
        "I can help you find books, answer questions about orders, shipping, returns, and payments. "
        "What can I help you with today?"
    ),
}

KEYWORD_MAP = [
    (r"\b(ship|deliver|dispatch|arrival|tracking)\b", "shipping"),
    (r"\b(return|refund|cancel|money back)\b",        "returns"),
    (r"\b(pay|payment|card|visa|mastercard|stripe)\b","payment"),
    (r"\b(account|profile|password|login|sign.?in)\b","account"),
    (r"\b(order|purchase|history|status)\b",           "orders"),
    (r"\b(recommend|suggest|what should|best book|similar)\b", "recommend"),
    (r"\b(buy|add to cart|price|how much|cost)\b",    "buy"),
    (r"\b(read|library|download|epub|pdf)\b",          "read"),
    (r"\b(hi|hello|hey|hiya|howdy)\b",                 "greeting"),
]

UNKNOWN_RESPONSE = (
    "🤔 I'm not sure I understood that. I can help with:\n"
    "• **Book recommendations** — just tell me a genre\n"
    "• **Shipping & delivery** info\n"
    "• **Returns & refunds**\n"
    "• **Payment** questions\n"
    "• **Your orders & library**\n\n"
    "What would you like help with?"
)


def fallback_response(message: str, intent: Optional[str] = None) -> str:
    """
    Return a rule-based response string.
    Uses detected intent if provided, otherwise tries keyword matching.
    """
    if intent and intent in FAQ_MAP:
        return FAQ_MAP[intent]

    text = (message or "").lower()
    for pattern, key in KEYWORD_MAP:
        if re.search(pattern, text):
            return FAQ_MAP.get(key, UNKNOWN_RESPONSE)

    # Genre keyword check for recommendations
    genres = ["fiction", "mystery", "romance", "fantasy", "science fiction",
              "biography", "self-help", "history", "finance", "thriller"]
    for genre in genres:
        if genre in text:
            return (
                f"📚 Looking for **{genre.title()}** books? "
                f"Browse our full catalog and filter by genre — you'll find some great picks! "
                f"Would you like a specific recommendation?"
            )

    return UNKNOWN_RESPONSE