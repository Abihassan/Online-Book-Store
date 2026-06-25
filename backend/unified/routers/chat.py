"""
routers/chat.py — Chat endpoint (/chat/...)
Ported from fastapi_app/chat.py

Now backed by a LOCAL LLM via Ollama (see ml/chatbot/llm.py) instead of a
hosted API — replies are generated entirely on your own machine, with no
per-message API cost. The RAG retrieval step (ml/chatbot/rag.py) was
already local (FAISS + sentence-transformers), so this endpoint is now
fully local end-to-end when Ollama is installed and running.

Left intentionally open to anonymous (non-logged-in) visitors, since
helping a shopper find a book before they've created an account is a
reasonable use case for a storefront assistant — but rate-limited (see
the security audit) since the previous version had no limit at all,
which is meaningful now that each message triggers local model inference
(CPU/GPU cost) rather than a metered third-party API call.
"""
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert

from ..database import get_db
from ..models import ChatLog
from ..limiter import limiter

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    userId: Optional[str] = None
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    reply: str
    intent: str
    books: Optional[list] = []


async def _save_messages(user_id: Optional[str], user_msg: str, bot_reply: str, db: AsyncSession):
    try:
        now = datetime.utcnow()
        db.add(ChatLog(id=str(uuid.uuid4()), user_id=user_id, role="user",  message=user_msg,  timestamp=now))
        db.add(ChatLog(id=str(uuid.uuid4()), user_id=user_id, role="bot",   message=bot_reply, timestamp=now))
        await db.commit()
    except Exception as e:
        print(f"[chat] Failed to save logs: {e}")


@router.post("/", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat(request: Request, req: ChatRequest, db: AsyncSession = Depends(get_db)):
    try:
        import sys, os
        # Add backend root to path so ml.* imports work
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)

        from ml.chatbot.intent   import detect_intent
        from ml.chatbot.rag      import retrieve_books
        from ml.chatbot.llm      import generate_reply
        from ml.chatbot.prompt   import build_prompt
        from ml.chatbot.fallback import fallback_response

        intent = detect_intent(req.message)
        books  = []

        if intent in ("recommend", "search"):
            books = retrieve_books(req.message, top_k=3)

        try:
            prompt = build_prompt(
                user_message=req.message,
                intent=intent,
                books=books,
                history=[],
            )
            reply = generate_reply(prompt)
        except Exception:
            reply = fallback_response(req.message)

        await _save_messages(req.userId, req.message, reply, db)
        return ChatResponse(
            reply=reply, intent=intent,
            books=[{
                "id": b.get("id"), "title": b.get("title"),
                "author": b.get("author"), "price": b.get("price"),
                "coverImage": b.get("cover_url"),
            } for b in books],
        )

    except ImportError:
        from ml.chatbot.fallback import fallback_response
        reply = fallback_response(req.message)
        await _save_messages(req.userId, req.message, reply, db)
        return ChatResponse(reply=reply, intent="unknown", books=[])
    except Exception:
        reply = "I'm sorry, I couldn't process that. Please try again!"
        await _save_messages(req.userId, req.message, reply, db)
        return ChatResponse(reply=reply, intent="error", books=[])