# 📚 BookHaven — Full-Stack Digital Bookstore

> A production-grade, full-stack e-commerce platform for purchasing, reading, and managing digital books. Built on a dual-backend architecture (Flask + FastAPI), a React/TypeScript SPA frontend, a real-time WebSocket reading tracker, an ML-powered recommendation engine, a local LLM-backed RAG chatbot, and a Celery task queue for async jobs.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Project Structure](#project-structure)
4. [Architecture & Workflow](#architecture--workflow)
5. [Data Flow](#data-flow)
6. [Code Health & Known Issues](#code-health--known-issues)
7. [Prerequisites & Installation](#prerequisites--installation)
8. [Running the Project](#running-the-project)
9. [API Reference Summary](#api-reference-summary)
10. [Dependencies & Technologies](#dependencies--technologies)
11. [Environment Variables](#environment-variables)

---

## Project Overview

BookHaven is a digital bookstore where users can browse, purchase, read, and review eBooks. It solves the problem of building a realistic full-stack portfolio project that goes beyond CRUD — incorporating JWT authentication with refresh-token rotation, a local RAG chatbot that runs entirely on-device (no API key needed), ML-based hybrid book recommendations, real-time WebSocket reading sessions, Celery async email tasks, PDF/EPUB file delivery protected by purchase verification, and an admin dashboard with revenue analytics.

The frontend is a React 18 + TypeScript SPA that talks to two separate backends: a Flask REST API for all business logic and a FastAPI service for ML inference, reading session events, and WebSocket connections.

---

## Key Features

| Feature | Detail |
|---|---|
| **JWT Auth** | Access + refresh token rotation; token blacklist on logout; silent refresh interceptor in Axios |
| **Book Catalog** | Full-text search, genre/author/price/rating filters, pagination, soft-delete for admin |
| **Shopping Cart** | Server-side cart synced via `CartContext`; real-time badge in navbar |
| **Wishlist** | Add/remove books; books enriched with `wishlistItemId` for direct deletion |
| **Checkout & Orders** | Multi-step flow; server calculates price from DB (not client); cart cleared on order |
| **Digital Library** | Purchase-verified download; streamed as blob with JWT header (no open URL) |
| **In-Browser PDF Reader** | `react-pdf` powered reader with bookmark and reading-session WebSocket |
| **RAG Chatbot** | Intent detection → FAISS retrieval → local Ollama LLM generation → rule-based fallback |
| **ML Recommendations** | Hybrid content (TF-IDF) + collaborative (SVD) with cold-start bestseller fallback |
| **NLP Sentiment** | VADER sentiment scoring on reviews; spaCy entity extraction |
| **Reading Analytics** | FastAPI collects session heartbeats; admin views heatmap, peak hours, genre trends |
| **Admin Dashboard** | Stats cards, revenue chart, top books, user management, order status updates |
| **Celery Tasks** | Order confirmation email, ML re-training triggered async |
| **Error Boundary** | React `ErrorBoundary` wraps the whole app for graceful crash handling |

---

## Project Structure

```
online book store/
├── .env                          # Root-level env (rarely used — see backend/.env)
├── package.json                  # Frontend Node dependencies
├── vite.config.ts                # Vite + React plugin config
├── tailwind.config.js            # Tailwind CSS config
├── tsconfig.json / tsconfig.app.json
│
├── src/                          # ── FRONTEND ──────────────────────────────
│   ├── main.tsx                  # App entry point (mounts React root)
│   ├── App.tsx                   # Router, providers, global Chatbot + Toaster
│   ├── App.css                   # Minimal global CSS reset
│   ├── index.css                 # Tailwind directives + custom variables
│   ├── vite-env.d.ts             # Vite env type declarations
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx       # Auth state (user, login/logout/register, session restore)
│   │   └── CartContext.tsx       # Cart state synced from backend; cartCount for navbar badge
│   │
│   ├── hooks/
│   │   └── use-toast.ts          # Toast notification hook (Radix-based)
│   │
│   ├── lib/
│   │   ├── api.ts                # Axios client factory: JWT attach, 401 refresh interceptor
│   │   ├── auth.ts               # Auth API helpers (login, register, logout, fetchMe, etc.)
│   │   ├── booksApi.ts           # Books CRUD + upload + blob download
│   │   ├── cartApi.ts            # Cart CRUD
│   │   ├── ordersApi.ts          # Order create/get/update-status
│   │   ├── reviewsApi.ts         # Review post/get
│   │   ├── wishlistApi.ts        # Wishlist add/remove/get
│   │   ├── adminApi.ts           # Admin stats, revenue, users, ML analytics
│   │   ├── chatApi.ts            # Chat REST + ReadingSessionWS WebSocket class
│   │   ├── types.ts              # Shared TypeScript interfaces (User, Book, Order, etc.)
│   │   ├── validation.ts         # Client-side validators (email, Luhn card, expiry, etc.)
│   │   ├── utils.ts              # `cn()` Tailwind class merger
│   │   └── database.ts           # ⚠️ LEGACY — localStorage mock DB (see Issues)
│   │
│   ├── pages/
│   │   ├── Index.tsx             # Homepage: hero, featured books, trending
│   │   ├── Auth.tsx              # Login + Register tabs with segmented password input
│   │   ├── Books.tsx             # Catalog with filters, sort, pagination
│   │   ├── BookDetail.tsx        # Single book, reviews, add to cart/wishlist
│   │   ├── Cart.tsx              # Cart items, quantities, total, checkout CTA
│   │   ├── Checkout.tsx          # Multi-step: review → payment → confirm
│   │   ├── Library.tsx           # User's purchased books, download + read buttons
│   │   ├── BookReader.tsx        # In-browser PDF reader (react-pdf + bookmarks)
│   │   ├── Wishlist.tsx          # Wishlist grid with move-to-cart
│   │   ├── Profile.tsx           # Account info, order history, password change
│   │   ├── Admin.tsx             # Admin dashboard (stats, charts, users, orders)
│   │   ├── About.tsx             # Static about page
│   │   ├── Blog.tsx              # Static blog placeholder
│   │   ├── Careers.tsx           # Static careers placeholder
│   │   ├── PrivacyPolicy.tsx     # Static privacy page
│   │   ├── Terms.tsx             # Static terms page
│   │   └── NotFound.tsx          # 404 catch-all
│   │
│   ├── components/
│   │   ├── Navbar.tsx            # Sticky nav: cart badge (from CartContext), user dropdown
│   │   ├── Footer.tsx            # Links to static pages
│   │   ├── Chatbot.tsx           # Floating chatbot FAB → POST /chat via chatApi
│   │   ├── PdfReader.tsx         # PDF rendering (react-pdf), page nav, zoom
│   │   ├── BookCard.tsx          # Book tile for grid views
│   │   ├── EnhancedBookCard.tsx  # Richer card with badge, rating bar
│   │   ├── EnhancedCartFlyout.tsx # Slide-out cart drawer (used in Navbar)
│   │   ├── BookmarkPanel.tsx     # Bookmark sidebar for BookReader
│   │   ├── BookImageGallery.tsx  # Cover gallery component for BookDetail
│   │   ├── CollapsibleSection.tsx # Generic collapsible wrapper
│   │   ├── ErrorBoundary.tsx     # React error boundary (wraps whole app in App.tsx)
│   │   ├── Pagination.tsx        # Page number controls
│   │   ├── RecentlyViewed.tsx    # Small "recently viewed" chip list
│   │   ├── SimilarBooks.tsx      # Horizontal similar-books scroll
│   │   └── ui/                   # Shadcn-ui primitive components (50+ files)
│   │       ├── button.tsx, input.tsx, badge.tsx, card.tsx ...
│   │       └── segmentedpasswordinput.tsx  # Custom 8-box password input
│
└── backend/                      # ── BACKEND ───────────────────────────────
    ├── .env                      # Backend secrets (DB URL, JWT keys, etc.)
    ├── env.example               # Safe template for .env
    ├── requirements.txt          # Flask + supporting packages
    ├── requirements_fastapi.txt  # FastAPI service packages
    ├── seed.py                   # Primary DB seed (books + admin user)
    ├── seed_unified.py           # ⚠️ DUPLICATE seed script (see Issues)
    ├── celery.py                 # Celery app instance
    ├── celeryconfig.py           # ⚠️ EMPTY — config lives in celery.py (see Issues)
    ├── docker-compose.yml        # PostgreSQL + Redis + pgAdmin services
    ├── README.md                 # Backend-specific setup notes
    ├── ANALYSIS_REPORT.md        # Extended analysis notes (53 KB)
    │
    ├── app/                      # ── Flask application ─────────────────────
    │   ├── __init__.py           # App factory: extensions, CORS, blueprints
    │   ├── config.py             # Dev/Prod/Test config classes + env loading
    │   ├── extensions.py         # SQLAlchemy, JWTManager, Bcrypt, Mail singletons
    │   │
    │   ├── models/
    │   │   ├── __init__.py       # Re-exports all models (imports extras.py)
    │   │   ├── user.py           # User model (UUID PK)
    │   │   ├── book.py           # Book model (UUID PK, soft delete via is_active)
    │   │   ├── order.py          # Order + OrderItem models
    │   │   ├── review.py         # Review model; rating/count cached on Book
    │   │   ├── reading_session.py # ReadingSession model (WebSocket heartbeat data)
    │   │   ├── extras.py         # CartItem, WishlistItem, Bookmark, Download, ChatLog
    │   │   ├── bookmark.py       # ⚠️ DUPLICATE of Bookmark in extras.py
    │   │   ├── chat_log.py       # ⚠️ DUPLICATE of ChatLog in extras.py
    │   │   └── download.py       # ⚠️ DUPLICATE of Download in extras.py
    │   │
    │   ├── auth/
    │   │   ├── routes.py         # /register /login /refresh /logout /me /change-password
    │   │   ├── middleware.py     # ⚠️ ORPHANED — JWT middleware (unused; handled by flask-jwt-extended)
    │   │   └── utils.py          # ⚠️ ORPHANED — token helpers (superseded by flask-jwt-extended)
    │   │
    │   ├── books/
    │   │   └── routes.py         # GET/POST/PUT/DELETE books; upload; JWT-gated download
    │   ├── orders/
    │   │   └── routes.py         # POST/GET orders; admin status update
    │   ├── reviews/
    │   │   └── routes.py         # POST/GET reviews; purchase gate; rating recalculation
    │   ├── cart/
    │   │   └── routes.py         # GET/POST/PUT/DELETE cart items
    │   ├── wishlist/
    │   │   └── routes.py         # GET/POST/DELETE wishlist items
    │   └── admin/
    │       └── routes.py         # Users CRUD, stats, revenue, top-books (admin only)
    │
    ├── fastapi_app/              # ── FastAPI service ───────────────────────
    │   ├── __init__.py
    │   ├── main.py               # FastAPI app factory; CORS; 5 routers mounted
    │   ├── chat.py               # POST /chat: intent→RAG→LLM→fallback pipeline
    │   ├── sessions.py           # REST CRUD for reading sessions
    │   ├── ws.py                 # WebSocket /ws/session heartbeat endpoint
    │   ├── ml.py                 # /ml/recommend/:userId, /ml/sentiment/:bookId
    │   └── analytics.py         # /analytics/reading-stats, /analytics/heatmap-image
    │
    ├── ml/                       # ── ML modules ────────────────────────────
    │   ├── models/               # ✅ ACTIVE — FAISS index + metadata + recommender.pkl
    │   ├── ml/models/            # ⚠️ STALE DUPLICATE — older/smaller model artifacts
    │   │
    │   ├── chatbot/
    │   │   ├── rag.py            # FAISS vector store builder + retrieve_books()
    │   │   ├── llm.py            # Ollama (local LLM) integration; no OpenAI fallback by design
    │   │   ├── intent.py         # Rule-based intent classifier (recommend/search/faq/etc.)
    │   │   ├── prompt.py         # Prompt builder (injects history + retrieved books)
    │   │   ├── history.py        # Loads last N chat turns from PostgreSQL via asyncpg
    │   │   └── fallback.py       # Rule-based reply generator when LLM unavailable
    │   │
    │   ├── recommender/
    │   │   ├── content.py        # TF-IDF content-based filtering
    │   │   ├── collab.py         # SVD collaborative filtering (scikit-surprise)
    │   │   ├── hybrid.py         # Weighted blend; cold-start bestseller fallback
    │   │   └── train.py          # Training script: builds + saves .pkl artifacts
    │   │
    │   ├── nlp/
    │   │   ├── sentiment.py      # VADER sentiment analysis on review text
    │   │   ├── classify.py       # Genre classifier (sklearn)
    │   │   ├── hf_classify.py    # ⚠️ HuggingFace zero-shot alternative (unused in prod)
    │   │   ├── preprocess.py     # Text cleaning + tokenisation
    │   │   ├── summarise.py      # Extractive summarisation
    │   │   └── setup.py          # NLTK/spaCy model download helper
    │   │
    │   ├── analytics/
    │   │   ├── pipeline.py       # Orchestrates all analytics aggregations
    │   │   ├── heatmap.py        # Day/hour reading heatmap
    │   │   ├── peak.py           # Peak reading hour detection
    │   │   ├── trends.py         # Genre trend over time
    │   │   ├── engagement.py     # Per-book engagement score
    │   │   └── export.py         # CSV/JSON export helpers
    │   │
    │   ├── data/
    │   │   ├── collect.py        # Pulls interaction data from DB for ML training
    │   │   ├── db_connect.py     # SQLAlchemy connection helper for ML scripts
    │   │   └── interactions.py   # Interaction matrix builder
    │   │
    │   ├── notebooks/
    │   │   └── 01_recommender_exploration.ipynb
    │   └── requirements.txt      # ML-specific pip packages
    │
    ├── migrations/               # Alembic migration versions (001–007)
    │
    ├── tasks/                    # Celery async tasks
    │   ├── email.py              # send_order_confirmation, send_password_reset_email
    │   ├── ml_train.py           # retrain_recommender (triggered after N new reviews)
    │   └── reports.py            # generate_admin_report (monthly PDF/CSV)
    │
    └── unified/                  # ⚠️ ORPHANED FastAPI prototype (see Issues)
        ├── auth_utils.py
        ├── database.py
        ├── limiter.py
        ├── models.py
        └── routers/
```

---

## Architecture & Workflow

```
Browser (React SPA)
        │
        │  HTTP/JSON  (port 5173 dev / 80 prod)
        │
   ┌────▼────────────────────────────────────────────┐
   │           Vite Dev Server / Nginx                │
   └────┬───────────────────────────────────┬────────┘
        │  /api/*  (port 5000)              │  /  (port 8000)
        ▼                                   ▼
  ┌─────────────┐                   ┌──────────────────┐
  │  Flask API  │                   │  FastAPI Service │
  │  (Gunicorn) │                   │  (Uvicorn)       │
  │             │                   │                  │
  │ Auth        │                   │ /chat  (RAG+LLM) │
  │ Books       │                   │ /ml/*  (recs)    │
  │ Orders      │                   │ /analytics/*     │
  │ Cart        │                   │ /sessions/*      │
  │ Reviews     │                   │ /ws/session (WS) │
  │ Wishlist    │                   │                  │
  │ Admin       │                   └──────┬───────────┘
  └──────┬──────┘                          │
         │                                 │
         └────────────┬────────────────────┘
                      │
              ┌───────▼────────┐
              │  PostgreSQL    │
              │  (SQLAlchemy / │
              │   asyncpg)     │
              └───────┬────────┘
                      │
              ┌───────▼────────┐      ┌──────────────┐
              │  Redis         │◄─────│  Celery      │
              │  (broker +     │      │  Workers     │
              │   result store)│      │  (email,     │
              └────────────────┘      │   ML retrain)│
                                      └──────────────┘

ML Layer (loaded at FastAPI startup)
  FAISS index  ←→  sentence-transformers (all-MiniLM-L6-v2)
  recommender.pkl  ←→  scikit-surprise SVD + sklearn TF-IDF
  Ollama (local)  ←→  llama3.2 (or any pulled model)
```

### Request lifecycle — buying a book

1. User clicks **Add to Cart** → `CartContext.addToCart(bookId)` → `POST /api/cart/` with `Authorization: Bearer <access_token>`.
2. Flask verifies JWT, looks up the book, upserts a `CartItem` row, returns full cart.
3. `CartContext` updates `cartItems` state → Navbar badge re-renders instantly.
4. User hits **Checkout** → `POST /api/orders/` with `{ items, shippingAddress, paymentMethod }`.
5. Flask re-prices each item from the DB (client-supplied prices are ignored), creates `Order` + `OrderItem` rows, clears the cart, returns the new order.
6. Celery task `send_order_confirmation.delay(...)` fires (when worker is running).
7. User opens **Library** → `GET /api/books/:id/download` with JWT header → Flask verifies purchase via `OrderItem` join, streams the file as an authenticated blob — no public URL exposure.

### Chatbot pipeline

```
User message
    │
    ▼
detect_intent()   →  "recommend" | "search" | "faq" | "greeting" | "unknown"
    │
    ├── if recommend/search:
    │       retrieve_books(message, top_k=3)   ← FAISS cosine similarity
    │
    ├── load_history(userId, limit=6)          ← asyncpg query on chat_logs
    │
    ▼
build_prompt(message, intent, books, history)
    │
    ▼
generate_reply(prompt)    ←  Ollama HTTP POST /api/chat
    │  (raises if Ollama down)
    │
    └── except: fallback_response(message)    ← rule-based keyword replies
    │
    ▼
_save_messages(userId, user_msg, bot_reply)   ← asyncpg INSERT chat_logs
    │
    ▼
ChatResponse(reply, intent, books=[...])
```

---

## Data Flow

### Auth token flow

```
Login →  Flask returns { user, accessToken, refreshToken }
       →  Stored in localStorage (accessToken, refreshToken, bookhaven_user)
       →  Axios request interceptor: adds  Authorization: Bearer <accessToken>
       →  On 401: interceptor calls POST /api/auth/refresh with refreshToken
          →  success: new accessToken stored, queued requests retried
          →  failure: tokens cleared, redirect to /auth
```

### Type mapping (Frontend ↔ Backend)

The backend uses **camelCase JSON keys** (e.g. `accessToken`, `bookId`, `coverUrl`, `addedAt`) which directly match the TypeScript interfaces in `src/lib/types.ts`. The `Book.to_dict()` method intentionally returns both `coverUrl` **and** `coverImage` (same value) to support components that use either field name.

---

## Code Health & Known Issues

### 🔴 Critical Bugs

| Location | Issue | Impact | Fix |
|---|---|---|---|
| `src/main.tsx` | Imports and calls `db.initializeDatabase()` from the legacy `database.ts` localStorage module at the top level. This runs on every page load and overwrites browser storage with sample data if the store is empty. | Corrupts real user data in dev; dead code that must be removed before production. | **Delete lines 4–6** from `main.tsx`. Remove the `db` import entirely. |
| `src/pages/BookReader.tsx` | Also imports from `database.ts` for bookmarks and reading progress. | Bookmarks save to localStorage instead of the backend `Bookmark`/`ReadingSession` API. | Replace all `db.*` calls with `chatApi.ReadingSessionWS` (already in `chatApi.ts`) and new bookmark API calls. |
| `backend/app/models/bookmark.py` `backend/app/models/chat_log.py` `backend/app/models/download.py` | These three files each define a duplicate SQLAlchemy model class (`Bookmark`, `WishlistItem`-adjacent, `Download`) that is also defined — and actually used — inside `extras.py`. The `models/__init__.py` imports from `extras.py`, so the standalone files are never imported. | SQLAlchemy would raise a `InvalidRequestError: Table 'X' is already defined` if these were ever imported alongside `extras.py`. | **Delete** `bookmark.py`, `chat_log.py`, and `download.py`. All definitions live correctly in `extras.py`. |
| `backend/app/auth/middleware.py` `backend/app/auth/utils.py` | Custom JWT middleware and token-helper utilities that pre-date the addition of `flask-jwt-extended`. Neither file is imported anywhere. | Zero runtime impact, but create confusion and risk being accidentally imported. | **Delete both files.** |
| `backend/celeryconfig.py` | File is completely empty. Celery config is set in `celery.py` correctly. | Misleads future developers into thinking config should go here. | **Delete the file** or add a comment redirecting to `celery.py`. |

### 🟠 Logic & Design Issues

| Location | Issue | Recommendation |
|---|---|---|
| `backend/extensions.py` — `token_blacklist: set` | JWT blacklist is an in-memory Python `set`. It is wiped every time the Flask process restarts (e.g., gunicorn reload, Heroku dyno restart), silently unblocking all logged-out tokens. | Replace with a Redis-backed store: `redis.Redis(...).setex(jti, ttl_seconds, "1")` in the logout route and a corresponding `get` in the `token_in_blocklist_loader`. |
| `src/lib/validation.ts` — `validatePassword` | Password must be **exactly** 8 characters. The backend (`auth/routes.py:register`) enforces **minimum** 8 characters. These two rules are in direct conflict: a 12-character password passes the backend but fails the frontend validator, blocking the form from submitting. | Change the frontend validator to `password.length >= 8` **or** change the segmented input UI to be flexible-length. |
| `backend/app/books/routes.py` — `download_book` | Finds the file to serve with `os.listdir(upload_folder)` and returns the **first** result whose name starts with `book_id`. If two books have IDs that are prefixes of each other (e.g., UUID collision edge case), or if an old upload was never cleaned up, the wrong file is served. | Store the full filename in `book.file_url` at upload time and use it directly in `send_file`. |
| `backend/app/reviews/routes.py` — `post_review` | Users must have purchased the book to review it (good), but the purchase check queries `OrderItem` joined with `Order` **without** filtering by `Order.status`. A user who placed an order that was then cancelled can still submit a review. | Add `.filter(Order.status.in_(["processing", "completed"]))` to the purchase check. |
| `src/lib/chatApi.ts` — `ReadingSessionWS` | The WebSocket sends a `"disconnect"` message on `disconnect()` then calls `this.ws.close()`. If the server already closed the socket, `ws.send()` on a closing socket throws an `InvalidStateError`. | Guard with `if (this.ws.readyState === WebSocket.OPEN)` before sending the disconnect message (check already present, but both the `readyState` check and `ws.close()` should be in the same branch). |
| `backend/fastapi_app/chat.py` — `get_conn()` | Creates a new `asyncpg` connection on **every** chat request and closes it in `finally`. For production traffic this will exhaust DB connection limits quickly. | Replace with an `asyncpg.Pool` created in the FastAPI `lifespan` context and stored on `app.state`. |

### 🟡 Dead Code & Orphaned Files

| File / Symbol | Status | Action |
|---|---|---|
| `src/lib/database.ts` | 13 KB localStorage mock DB. Still imported by `main.tsx` and `BookReader.tsx`. All other pages now use real API calls. | Remove the two remaining imports, then delete the file. |
| `backend/unified/` (entire folder) | An abandoned second FastAPI prototype with its own auth, models, rate-limiter, and routers. Nothing in the active codebase imports it. | **Delete the entire `unified/` directory.** |
| `backend/ml/ml/models/` | Stale, smaller copies of `catalog.faiss`, `catalog_meta.json`, `genre_classifier.pkl`, `recommender.pkl`. The active code reads from `backend/ml/models/`. | **Delete `backend/ml/ml/`** to avoid confusion about which model artifacts are current. |
| `backend/seed_unified.py` | Duplicate seed script (12 KB). `seed.py` is the active one. | **Delete `seed_unified.py`.** |
| `backend/ml/nlp/hf_classify.py` | HuggingFace zero-shot classifier; not wired up anywhere in the FastAPI routes. | Keep if HF classification is planned; otherwise delete or move to a `experimental/` folder. |
| `src/lib/database.ts` — `SAMPLE_BOOKS` array | 400+ lines of hardcoded book data. The DB is seeded via `seed.py` instead. | Deleted with the file once the two remaining import sites are fixed. |
| `src/components/RecentlyViewed.tsx` `src/components/SimilarBooks.tsx` `src/components/BookImageGallery.tsx` `src/components/CollapsibleSection.tsx` | Defined but **not imported** by any page or component in the active app. | Audit whether they should be integrated into `BookDetail.tsx`, then delete if not. |

### 🔵 Performance Observations

| Area | Observation | Recommendation |
|---|---|---|
| `ml/chatbot/rag.py` — `_embed()` | Instantiates a new `SentenceTransformer` model on **every call** to `retrieve_books()`. The model is ~90 MB and takes 2–5 seconds to load on cold start. | Cache the model at module level: `_model: SentenceTransformer = None` and lazily load once. |
| `ml/chatbot/rag.py` — FAISS index | Loaded from disk on every call via `_load_index()`. With concurrent chat requests this re-reads the index repeatedly. | Load at FastAPI startup via the `lifespan` handler and cache on `app.state`. |
| `backend/app/books/routes.py` — `get_books()` | No DB indexes on `Book.genre`, `Book.author`, or `Book.title` beyond what Alembic migrations set. Full-text search uses `ILIKE '%term%'` which cannot use a B-tree index. | Add a PostgreSQL GIN index on a `tsvector` column for full-text search, or use `pg_trgm` with a GIN index for `ILIKE`-compatible trigram search. |
| `CartItem.to_dict()` in `extras.py` | Accesses `self.book.price` inline — triggers a lazy load per cart item if the `book` relationship isn't eagerly loaded. On a cart with 10+ items this is an N+1 query. | Add `lazy="joined"` or `lazy="subquery"` to the `CartItem.book` relationship, or use `joinedload` in the route query. |
| `admin/routes.py` — revenue calculation | Monthly revenue aggregation runs a fresh `GROUP BY` on the full `orders` table on every admin page load. | Cache the result in Redis with a 5-minute TTL using `flask_caching` or a simple `redis.set`/`get` wrapper. |

---

## Prerequisites & Installation

### System requirements

- **Python** 3.11+
- **Node.js** 18+ and npm 9+
- **PostgreSQL** 14+
- **Redis** 6+
- **Ollama** (optional — only needed for LLM chat replies; chatbot falls back gracefully without it)

### 1 — Clone

```bash
git clone https://github.com/Abihassan/Online-Book-Store.git
cd "Online-Book-Store"
```

### 2 — Backend: Python environment

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install Flask + supporting packages
pip install -r requirements.txt

# Install FastAPI service packages
pip install -r requirements_fastapi.txt

# Install ML packages
pip install -r ml/requirements.txt
```

### 3 — Backend: environment variables

```bash
cp env.example .env
# Edit .env and fill in the required values (see Environment Variables section below)
```

### 4 — Database setup

```bash
# Start PostgreSQL and Redis (or use Docker):
docker-compose up -d postgres redis

# Run Alembic migrations
alembic upgrade head

# Seed initial data (books + admin user)
python seed.py
```

Default admin credentials after seeding:
- **Email:** `admin@bookhaven.com`
- **Password:** `Admin123`

### 5 — ML model setup (optional but recommended for full chatbot)

```bash
# Build the FAISS catalog index from the seeded books
python -m ml.chatbot.rag

# Train the recommender (requires at least some order data)
python -m ml.recommender.train

# Install and pull Ollama model (for LLM replies)
# macOS/Linux: https://ollama.com/download
ollama pull llama3.2

# Download NLTK + spaCy data for NLP
python -m ml.nlp.setup
```

### 6 — Frontend

```bash
# From the repo root
npm install

# Create frontend env file
cp .env.example .env          # or create manually:
echo "VITE_FLASK_URL=http://localhost:5000/api" > .env
echo "VITE_FASTAPI_URL=http://localhost:8000"  >> .env
```

---

## Running the Project

Open **four terminal tabs**:

```bash
# Tab 1 — Flask API (port 5000)
cd backend
source .venv/bin/activate
flask run --port 5000

# Tab 2 — FastAPI + Uvicorn (port 8000)
cd backend
source .venv/bin/activate
uvicorn fastapi_app.main:app --reload --port 8000

# Tab 3 — Celery worker (optional; needed for emails + async ML retrain)
cd backend
source .venv/bin/activate
celery -A celery.celery_app worker --loglevel=info

# Tab 4 — Vite dev server (port 5173)
# From repo root:
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production build

```bash
npm run build           # outputs to dist/
npm run preview         # local preview of the production build

# Serve Flask with Gunicorn:
gunicorn "app:create_app()" -w 4 -b 0.0.0.0:5000

# Serve FastAPI with Uvicorn:
uvicorn fastapi_app.main:app -w 2 --host 0.0.0.0 --port 8000
```

---

## API Reference Summary

### Flask — `http://localhost:5000/api`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Health check |
| `POST` | `/auth/register` | — | Register new user |
| `POST` | `/auth/login` | — | Login; returns tokens |
| `POST` | `/auth/refresh` | Refresh token | Issue new access token |
| `POST` | `/auth/logout` | Access token | Blacklist current token |
| `GET` | `/auth/me` | ✅ | Get current user |
| `PUT` | `/auth/me` | ✅ | Update profile |
| `PUT` | `/auth/change-password` | ✅ | Change password |
| `POST` | `/auth/forgot-password` | — | Trigger reset email |
| `GET` | `/books/` | — | Paginated book list (filters: search, genre, author, price, rating, sort) |
| `GET` | `/books/:id` | — | Single book + recent reviews |
| `POST` | `/books/` | Admin | Create book |
| `PUT` | `/books/:id` | Admin | Update book |
| `DELETE` | `/books/:id` | Admin | Soft-delete book |
| `POST` | `/books/upload` | Admin | Upload PDF/EPUB file |
| `GET` | `/books/:id/download` | ✅ + Purchased | Stream book file |
| `GET` | `/cart/` | ✅ | Get cart items |
| `POST` | `/cart/` | ✅ | Add item to cart |
| `PUT` | `/cart/:item_id` | ✅ | Update item quantity |
| `DELETE` | `/cart/:item_id` | ✅ | Remove item |
| `GET` | `/orders/` | ✅ | Get user orders (admin: all) |
| `POST` | `/orders/` | ✅ | Create order + clear cart |
| `GET` | `/orders/:id` | ✅ | Get single order |
| `PUT` | `/orders/:id/status` | Admin | Update order status |
| `GET` | `/reviews/book/:id` | — | Get paginated reviews for a book |
| `POST` | `/reviews/` | ✅ + Purchased | Post a review |
| `GET` | `/wishlist/` | ✅ | Get wishlist |
| `POST` | `/wishlist/` | ✅ | Add to wishlist |
| `DELETE` | `/wishlist/:item_id` | ✅ | Remove from wishlist |
| `GET` | `/admin/stats` | Admin | Dashboard statistics |
| `GET` | `/admin/revenue` | Admin | Monthly revenue data |
| `GET` | `/admin/top-books` | Admin | Top N books by sales |
| `GET` | `/admin/users` | Admin | Paginated user list |
| `PUT` | `/admin/users/:id` | Admin | Toggle active / change role |

### FastAPI — `http://localhost:8000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/chat/` | RAG chatbot (intent → retrieval → LLM → fallback) |
| `GET` | `/ml/recommend/:userId` | Hybrid book recommendations |
| `GET` | `/ml/sentiment/:bookId` | VADER sentiment for book reviews |
| `GET` | `/analytics/reading-stats` | Heatmap, peak hours, genre trends, engagement |
| `GET` | `/analytics/heatmap-image` | Seaborn heatmap as base64 PNG |
| `POST` | `/sessions/` | Create reading session |
| `PUT` | `/sessions/:id/end` | End session + save duration |
| `WS` | `/ws/session` | WebSocket heartbeat for live reading tracking |

---

## Dependencies & Technologies

### Frontend

| Package | Version | Role |
|---|---|---|
| React | 18.3 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 8.0 | Build tool + dev server |
| React Router DOM | 7.14 | Client-side routing |
| Axios | 1.16 | HTTP client with JWT interceptor |
| Tailwind CSS | 3.4 | Utility-first styling |
| Shadcn-ui / Radix UI | various | Accessible component primitives |
| Recharts | 2.15 | Admin revenue + analytics charts |
| react-pdf / pdfjs-dist | 10.2 / 5.4 | In-browser PDF renderer |
| Framer Motion | 12.23 | Animations |
| Fuse.js | 7.1 | Client-side fuzzy search fallback |
| Zod | 3.23 | Schema validation |
| React Hook Form | 7.53 | Form state management |
| sonner | 1.5 | Toast notifications |
| `@supabase/supabase-js` | 2.58 | ⚠️ Installed but unused |
| `next-themes` | 0.3 | ⚠️ Installed but unused (no dark mode toggle in UI) |

### Backend — Flask

| Package | Role |
|---|---|
| Flask | Web framework |
| Flask-JWT-Extended | JWT access + refresh tokens, blacklist |
| Flask-SQLAlchemy | ORM |
| Flask-Bcrypt | Password hashing |
| Flask-CORS | Cross-origin headers |
| Flask-Mail | Transactional email |
| Flask-Migrate / Alembic | DB schema migrations |
| Celery + Redis | Async task queue |

### Backend — FastAPI

| Package | Role |
|---|---|
| FastAPI | Async web framework |
| Uvicorn | ASGI server |
| asyncpg | Async PostgreSQL driver |
| Pydantic v2 | Request/response validation |
| websockets | WebSocket support |

### ML & AI

| Package | Role |
|---|---|
| sentence-transformers | Embedding model for FAISS RAG index |
| faiss-cpu | Vector similarity search |
| Ollama (external) | Local LLM inference (llama3.2) |
| scikit-surprise | SVD collaborative filtering |
| scikit-learn | TF-IDF, genre classifier |
| vaderSentiment | Review sentiment scoring |
| spaCy | NLP entity extraction |
| NLTK | Text preprocessing |
| pandas / numpy | Data manipulation |

---

## Environment Variables

### `backend/.env`

```ini
# Flask
FLASK_ENV=development
SECRET_KEY=change-me-in-production
JWT_SECRET_KEY=change-me-in-production
JWT_ACCESS_TOKEN_EXPIRES=3600        # seconds (1 hour)
JWT_REFRESH_TOKEN_EXPIRES=2592000    # seconds (30 days)

# Database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/online_book_store

# Redis + Celery
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# File uploads
UPLOAD_FOLDER=./uploads
MAX_CONTENT_LENGTH=52428800          # 50 MB

# Mail (for Celery email tasks)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=BookHaven <no-reply@bookhaven.com>

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# ML / Chatbot
ML_MODEL_DIR=./ml/models
EMBED_MODEL=all-MiniLM-L6-v2
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### Frontend `.env` (repo root)

```ini
VITE_FLASK_URL=http://localhost:5000/api
VITE_FASTAPI_URL=http://localhost:8000
```

---

## Quick-Fix Checklist

For anyone picking up this project, resolve these items in order before adding new features:

- [ ] **Remove** `db` import and `db.initializeDatabase()` call from `src/main.tsx`
- [ ] **Replace** `database.ts` usage in `BookReader.tsx` with real API calls
- [ ] **Delete** `backend/app/models/bookmark.py`, `chat_log.py`, `download.py` (duplicates)
- [ ] **Delete** `backend/app/auth/middleware.py` and `backend/app/auth/utils.py` (orphans)
- [ ] **Delete** `backend/unified/` directory (abandoned prototype)
- [ ] **Delete** `backend/ml/ml/` directory (stale model artifacts)
- [ ] **Delete** `backend/seed_unified.py` and `backend/celeryconfig.py`
- [ ] **Fix** password validator in `validation.ts`: change `=== 8` to `>= 8`
- [ ] **Replace** in-memory `token_blacklist` with Redis-backed store
- [ ] **Cache** `SentenceTransformer` model at module level in `rag.py`
- [ ] **Replace** per-request `asyncpg.connect()` in `chat.py` with a connection pool
- [ ] **Remove** unused `@supabase/supabase-js` and `next-themes` from `package.json`

---

*Generated by automated codebase audit · BookHaven v0.0.0 · August 2026*