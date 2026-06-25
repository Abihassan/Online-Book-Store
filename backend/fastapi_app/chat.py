from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import os, asyncpg, uuid
from datetime import datetime

router = APIRouter()
DB_URL = os.getenv("DATABASE_URL", "")


class ChatMessage(BaseModel):
    role: str   # "user" | "bot"
    content: str


class ChatRequest(BaseModel):
    message: str
    userId: Optional[str] = None
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str
    intent: str
    books: Optional[list] = []


async def get_conn():
    return await asyncpg.connect(DB_URL)


async def _save_messages(user_id: Optional[str], user_msg: str, bot_reply: str):
    if not DB_URL:
        return
    conn = await get_conn()
    try:
        now = datetime.utcnow()
        await conn.executemany(
            "INSERT INTO chat_logs (id, user_id, role, message, timestamp) VALUES ($1,$2,$3,$4,$5)",
            [
                (str(uuid.uuid4()), user_id, "user", user_msg, now),
                (str(uuid.uuid4()), user_id, "bot",  bot_reply, now),
            ]
        )
    except Exception as e:
        print(f"[chat] Failed to save logs: {e}")
    finally:
        await conn.close()


# ── POST /chat ────────────────────────────────────────────────────────────────
@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Full chatbot pipeline:
    1. Detect intent
    2. RAG retrieval for book queries
    3. LLM generation (falls back to rule-based if unavailable)
    4. Save logs
    """
    try:
        # Import ML chatbot modules
        from ml.chatbot.intent import detect_intent
        from ml.chatbot.rag import retrieve_books
        from ml.chatbot.llm import generate_reply
        from ml.chatbot.history import load_history
        from ml.chatbot.prompt import build_prompt
        from ml.chatbot.fallback import fallback_response

        intent = detect_intent(req.message)
        books = []

        # Load conversation history from DB
        history = await load_history(req.userId, limit=6) if req.userId else []

        if intent in ("recommend", "search"):
            books = retrieve_books(req.message, top_k=3)

        try:
            prompt = build_prompt(
                user_message=req.message,
                intent=intent,
                books=books,
                history=history,
            )
            reply = generate_reply(prompt)
        except Exception:
            reply = fallback_response(req.message)

        await _save_messages(req.userId, req.message, reply)

        return ChatResponse(
            reply=reply,
            intent=intent,
            books=[{"id": b.get("id"), "title": b.get("title"),
                    "author": b.get("author"), "price": b.get("price"),
                    "coverImage": b.get("cover_url")} for b in books],
        )

    except ImportError:
        # ML modules not yet installed — use simple rule-based fallback
        from ml.chatbot.fallback import fallback_response
        reply = fallback_response(req.message)
        await _save_messages(req.userId, req.message, reply)
        return ChatResponse(reply=reply, intent="unknown", books=[])