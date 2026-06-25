from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from .sessions import router as sessions_router
from .ws import router as ws_router
from .ml import router as ml_router
from .analytics import router as analytics_router
from .chat import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("BookHaven FastAPI service starting…")
    yield
    print("BookHaven FastAPI service stopping…")


app = FastAPI(
    title="BookHaven FastAPI",
    description="Real-time events, reading sessions, ML endpoints, and chatbot",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions_router,  prefix="/sessions",  tags=["Reading Sessions"])
app.include_router(ws_router,        prefix="/ws",        tags=["WebSocket"])
app.include_router(ml_router,        prefix="/ml",        tags=["ML"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
app.include_router(chat_router,      prefix="/chat",      tags=["Chatbot"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "BookHaven FastAPI"}