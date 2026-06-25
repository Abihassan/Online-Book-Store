from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
import json

router = APIRouter()

# Track active connections: user_id → websocket
active_connections: Dict[str, WebSocket] = {}


@router.websocket("/session")
async def reading_session_ws(websocket: WebSocket):
    """
    WebSocket endpoint for live reading session tracking.
    Client sends: {"type": "heartbeat", "userId": "...", "bookId": "...", "page": N}
    Server responds: {"type": "ack", "sessionId": "..."}
    """
    await websocket.accept()
    user_id = None
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            msg_type = data.get("type")

            if msg_type == "connect":
                user_id = data.get("userId")
                if user_id:
                    active_connections[user_id] = websocket
                await websocket.send_json({"type": "connected", "userId": user_id})

            elif msg_type == "heartbeat":
                # In production: update reading_session in DB via asyncpg
                page = data.get("page", 0)
                await websocket.send_json({
                    "type": "ack",
                    "userId": data.get("userId"),
                    "bookId": data.get("bookId"),
                    "page": page,
                })

            elif msg_type == "disconnect":
                break

    except WebSocketDisconnect:
        if user_id and user_id in active_connections:
            del active_connections[user_id]
    except Exception as e:
        print(f"WebSocket error: {e}")
        if user_id and user_id in active_connections:
            del active_connections[user_id]