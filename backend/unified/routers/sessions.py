"""
routers/sessions.py — Reading session endpoints (/sessions/...)
"""
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from ..database import get_db
from ..models import ReadingSession

router = APIRouter()


class SessionStart(BaseModel):
    userId: str
    bookId: str
    deviceType: Optional[str] = "web"

class SessionEnd(BaseModel):
    sessionId: str
    pagesRead: Optional[int] = 0
    durationSeconds: Optional[int] = None


@router.post("/start")
async def start_session(body: SessionStart, db: AsyncSession = Depends(get_db)):
    session = ReadingSession(
        id=str(uuid.uuid4()),
        user_id=body.userId,
        book_id=body.bookId,
        started_at=datetime.utcnow(),
        device_type=body.deviceType,
    )
    db.add(session)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(500, str(e))
    return {"sessionId": session.id, "startedAt": session.started_at.isoformat()}


@router.post("/end")
async def end_session(body: SessionEnd, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ReadingSession).where(ReadingSession.id == body.sessionId)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")

    now = datetime.utcnow()
    duration = body.durationSeconds
    if duration is None:
        duration = int((now - session.started_at).total_seconds())

    session.ended_at = now
    session.duration_seconds = duration
    session.pages_read = body.pagesRead or 0
    await db.commit()
    return {"sessionId": session.id, "durationSeconds": duration, "endedAt": now.isoformat()}


@router.get("/user/{user_id}")
async def get_user_sessions(
    user_id: str,
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReadingSession)
        .where(ReadingSession.user_id == user_id)
        .order_by(ReadingSession.started_at.desc())
        .limit(limit)
    )
    return [s.to_dict() for s in result.scalars().all()]
