"""
BookHaven — Unified FastAPI Server (port 8000)
All Flask routes + FastAPI async features merged into one server.

Run:
    uvicorn unified.main:app --reload --port 8000
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from .limiter import limiter

load_dotenv()

# ── Import all routers ─────────────────────────────────────────────────────────
from .routers.auth     import router as auth_router
from .routers.books    import router as books_router
from .routers.cart     import router as cart_router
from .routers.wishlist import router as wishlist_router
from .routers.orders   import router as orders_router
from .routers.reviews  import router as reviews_router
from .routers.admin    import router as admin_router
from .routers.chat     import router as chat_router
from .routers.sessions import router as sessions_router
from .routers.ml       import router as ml_router
from .routers.analytics import router as analytics_router
from .routers.ws       import router as ws_router
from .database         import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (safe — no-op if they exist)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("BookHaven unified server starting on http://localhost:8000")
    yield
    await engine.dispose()
    print("BookHaven unified server stopped.")


app = FastAPI(
    title="BookHaven API",
    description="Unified BookHaven server — auth, books, cart, orders, chat, ML",
    version="2.0.0",
    lifespan=lifespan,
)

# ── Rate limiting (slowapi) ──────────────────────────────────────────────────
# See unified/limiter.py for the shared Limiter instance. Specific limits
# are applied per-endpoint with @limiter.limit(...) in auth.py and chat.py.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routers ───────────────────────────────────────────────────────
app.include_router(auth_router,      prefix="/api/auth",      tags=["Auth"])
app.include_router(books_router,     prefix="/api/books",     tags=["Books"])
app.include_router(cart_router,      prefix="/api/cart",      tags=["Cart"])
app.include_router(wishlist_router,  prefix="/api/wishlist",  tags=["Wishlist"])
app.include_router(orders_router,    prefix="/api/orders",    tags=["Orders"])
app.include_router(reviews_router,   prefix="/api/reviews",   tags=["Reviews"])
app.include_router(admin_router,     prefix="/api/admin",     tags=["Admin"])
app.include_router(chat_router,      prefix="/chat",          tags=["Chatbot"])
app.include_router(sessions_router,  prefix="/sessions",      tags=["Reading Sessions"])
app.include_router(ml_router,        prefix="/ml",            tags=["ML"])
app.include_router(analytics_router, prefix="/analytics",     tags=["Analytics"])
app.include_router(ws_router,        prefix="/ws",            tags=["WebSocket"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "BookHaven Unified API"}


@app.get("/health")
async def health_root():
    return {"status": "ok", "service": "BookHaven Unified API"}