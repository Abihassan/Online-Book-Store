"""
Conversation history handler.
Loads and saves the last N messages from the chat_logs PostgreSQL table.
Falls back to an in-memory store if DB is unavailable.
"""
import os
import asyncpg
from typing import List, Optional
from datetime import datetime

_memory_store: dict = {}   # fallback: {user_id: [messages]}

DB_URL = os.getenv("DATABASE_URL", "")


async def load_history(user_id: str, limit: int = 10) -> List[dict]:
    """
    Load the last `limit` messages for a user from DB.
    Falls back to in-memory store if DB is unavailable.
    Returns list of {"role": "user"|"bot", "content": str, "timestamp": str}
    """
    if not DB_URL or not user_id:
        return _memory_store.get(user_id, [])[-limit:]

    try:
        conn = await asyncpg.connect(DB_URL)
        rows = await conn.fetch(
            """SELECT role, message, timestamp
               FROM chat_logs
               WHERE user_id = $1
               ORDER BY timestamp DESC
               LIMIT $2""",
            user_id, limit,
        )
        await conn.close()
        return [
            {"role": r["role"], "content": r["message"],
             "timestamp": r["timestamp"].isoformat()}
            for r in reversed(rows)
        ]
    except Exception as e:
        print(f"[history] DB load failed: {e}. Using memory store.")
        return _memory_store.get(user_id, [])[-limit:]


async def save_messages(user_id: Optional[str], messages: List[dict]) -> None:
    """
    Save a list of {"role": str, "content": str} messages to DB.
    Falls back to in-memory store.
    """
    if not DB_URL:
        if user_id:
            store = _memory_store.setdefault(user_id, [])
            store.extend(messages)
            _memory_store[user_id] = store[-100:]  # cap at 100
        return

    try:
        conn = await asyncpg.connect(DB_URL)
        import uuid
        now = datetime.utcnow()
        await conn.executemany(
            "INSERT INTO chat_logs (id, user_id, role, message, timestamp) VALUES ($1,$2,$3,$4,$5)",
            [
                (str(uuid.uuid4()), user_id, m["role"], m["content"], now)
                for m in messages
            ],
        )
        await conn.close()
    except Exception as e:
        print(f"[history] DB save failed: {e}. Saving to memory store.")
        if user_id:
            store = _memory_store.setdefault(user_id, [])
            store.extend(messages)
            _memory_store[user_id] = store[-100:]


def clear_memory(user_id: str) -> None:
    """Clear in-memory history for a user (useful for testing)."""
    _memory_store.pop(user_id, None)