from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os, asyncpg
import asyncpg

router = APIRouter()

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:abi123@localhost:5432/online_book_store")


async def get_conn():
    return await asyncpg.connect(DB_URL)


class SessionStart(BaseModel):
    userId: str
    bookId: str
    deviceType: Optional[str] = "web"


class SessionEnd(BaseModel):
    sessionId: str
    pagesRead: Optional[int] = 0
    durationSeconds: Optional[int] = None


# ── POST /sessions/start ──────────────────────────────────────────────────────
@router.post("/start")
async def start_session(body: SessionStart):
    conn = await get_conn()
    try:
        import uuid
        session_id = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO reading_sessions (id, user_id, book_id, started_at, device_type)
               VALUES ($1, $2, $3, $4, $5)""",
            session_id, body.userId, body.bookId, datetime.utcnow(), body.deviceType,
        )
        return {"sessionId": session_id, "startedAt": datetime.utcnow().isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await conn.close()


# ── POST /sessions/end ────────────────────────────────────────────────────────
@router.post("/end")
async def end_session(body: SessionEnd):
    conn = await get_conn()
    try:
        now = datetime.utcnow()
        row = await conn.fetchrow(
            "SELECT started_at FROM reading_sessions WHERE id=$1", body.sessionId
        )
        if not row:
            raise HTTPException(status_code=404, detail="Session not found")

        duration = body.durationSeconds
        if duration is None:
            delta = now - row["started_at"]
            duration = int(delta.total_seconds())

        await conn.execute(
            """UPDATE reading_sessions
               SET ended_at=$1, duration_seconds=$2, pages_read=$3
               WHERE id=$4""",
            now, duration, body.pagesRead, body.sessionId,
        )
        return {"sessionId": body.sessionId, "durationSeconds": duration, "endedAt": now.isoformat()}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await conn.close()


# ── GET /sessions/user/:userId ────────────────────────────────────────────────
@router.get("/user/{user_id}")
async def get_user_sessions(user_id: str, limit: int = 50):
    conn = await get_conn()
    try:
        rows = await conn.fetch(
            """SELECT id, book_id, started_at, ended_at, duration_seconds, pages_read, device_type
               FROM reading_sessions WHERE user_id=$1
               ORDER BY started_at DESC LIMIT $2""",
            user_id, limit,
        )
        return [dict(r) for r in rows]
    finally:
        await conn.close()