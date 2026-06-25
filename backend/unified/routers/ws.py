"""
routers/ws.py — WebSocket endpoint (/ws/...)
"""
import json
from typing import Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

active_connections: Dict[str, WebSocket] = {}


@router.websocket("/session")
async def reading_session_ws(websocket: WebSocket):
    await websocket.accept()
    user_id = None
    try:
        while True:
            raw  = await websocket.receive_text()
            data = json.loads(raw)
            msg_type = data.get("type")

            if msg_type == "connect":
                user_id = data.get("userId")
                if user_id:
                    active_connections[user_id] = websocket
                await websocket.send_json({"type": "connected", "userId": user_id})

            elif msg_type == "heartbeat":
                await websocket.send_json({
                    "type": "ack",
                    "userId": data.get("userId"),
                    "bookId": data.get("bookId"),
                    "page":   data.get("page", 0),
                })

            elif msg_type == "disconnect":
                break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if user_id and user_id in active_connections:
            del active_connections[user_id]
