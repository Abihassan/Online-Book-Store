"""
Prompt builder for the BookHaven chatbot.
Injects retrieved books, user context, conversation history,
and intent into a structured prompt for the LLM.
"""
from typing import List, Optional


SYSTEM_PROMPT = """You are BookBot, the friendly AI assistant for BookHaven — an online bookstore.
You help customers find books, answer questions about orders, shipping, returns, and payments.
Always be concise, warm, and helpful. If recommending books, mention the title, author, and a one-line reason.
If you don't know something, say so and offer to help with something else.
Never invent book titles or prices. Only recommend books from the catalog provided."""


def _format_book(book: dict) -> str:
    price = f"${book.get('price', 0):.2f}" if book.get("price") else ""
    return (
        f"• {book.get('title', 'Unknown')} by {book.get('author', 'Unknown')} "
        f"[{book.get('genre', '')}] {price} — {book.get('description', '')[:80]}…"
    )


def _format_history(history: list) -> str:
    if not history:
        return ""
    lines = []
    for msg in history[-6:]:  # last 6 messages
        role = "User" if msg.get("role") == "user" else "BookBot"
        lines.append(f"{role}: {msg.get('content', msg.get('message', ''))}")
    return "\n".join(lines)


def build_prompt(
    user_message: str,
    intent: str = "unknown",
    books: Optional[List[dict]] = None,
    history: Optional[list] = None,
    user_name: Optional[str] = None,
    cart_count: int = 0,
) -> str:
    """
    Build the full prompt string to send to the LLM.
    """
    parts = []

    # User context
    if user_name:
        parts.append(f"[Context] The user's name is {user_name}.")
    if cart_count > 0:
        parts.append(f"[Context] The user currently has {cart_count} item(s) in their cart.")
    if intent != "unknown":
        parts.append(f"[Detected intent: {intent}]")

    # Retrieved books from RAG
    if books:
        book_lines = "\n".join(_format_book(b) for b in books)
        parts.append(
            f"[Relevant books from catalog]\n{book_lines}"
        )

    # Conversation history
    history_str = _format_history(history or [])
    if history_str:
        parts.append(f"[Conversation so far]\n{history_str}")

    # Current user message
    parts.append(f"User: {user_message}")
    parts.append("BookBot:")

    return "\n\n".join(parts)


def build_full_messages(
    user_message: str,
    intent: str = "unknown",
    books: Optional[List[dict]] = None,
    history: Optional[list] = None,
    user_name: Optional[str] = None,
) -> dict:
    """
    Returns {'system': str, 'user': str} for use with the local LLM
    (see ml/chatbot/llm.py — Ollama chat completions).
    """
    user_parts = []
    if user_name:
        user_parts.append(f"My name is {user_name}.")
    if intent != "unknown":
        user_parts.append(f"(My intent seems to be: {intent})")
    if books:
        book_lines = "\n".join(_format_book(b) for b in books)
        user_parts.append(f"Relevant catalog books:\n{book_lines}")
    history_str = _format_history(history or [])
    if history_str:
        user_parts.append(f"Recent conversation:\n{history_str}")
    user_parts.append(f"My message: {user_message}")

    return {
        "system": SYSTEM_PROMPT,
        "user": "\n\n".join(user_parts),
    }