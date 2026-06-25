# 📚 BookHaven — Full-Stack Digital Bookstore

A full-stack online bookstore with React frontend, Python backend (Flask + FastAPI),
PostgreSQL database, Celery background jobs, and an AI-powered chatbot with RAG.

---

## 🗂️ Project Structure

```
bookhaven/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Flask API + FastAPI + Celery
│   ├── app/           # Flask blueprints, models, migrations
│   ├── fastapi_app/   # FastAPI async service
│   ├── tasks/         # Celery tasks (email, reports, ML)
│   ├── ml/            # ML pipeline (recommender, NLP, chatbot)
│   └── seed.py        # DB seed script
└── docker-compose.yml # Postgres + Redis + all services
```

---

## ✅ What Is DONE

### Frontend (React + TypeScript)
- [x] Homepage with animated hero + newsletter signup
- [x] Book catalog with fuzzy search, filters, pagination, skeleton loading
- [x] Book detail with image gallery, reviews, write-a-review, related books
- [x] Shopping cart with coupon codes (BOOK10 / READER20 / WELCOME15)
- [x] Wishlist with empty state, stock badges, move-to-cart
- [x] **Checkout** — 2-step (address → payment) with full validation, order confirmation screen
- [x] Digital library with in-browser PDF reader + reading timer + progress tracking
- [x] User profile with edit form + change password modals
- [x] Admin dashboard — charts (Recharts), CRUD, pagination, order status update
- [x] Auth — login, register, show/hide password, forgot password flow
- [x] Chatbot — floating widget, FAQ quick replies, genre recommendations, typing indicator
- [x] Navbar — active route highlight, mobile hamburger, cart flyout
- [x] 404 NotFound page
- [x] Page fade-in CSS transitions
- [x] BookCard hover zoom

### Backend (Flask)
- [x] App factory with CORS, blueprints
- [x] All SQLAlchemy models (User, Book, Order, OrderItem, Review, ReadingSession, Download, Bookmark, CartItem, WishlistItem, ChatLog)
- [x] Auth endpoints (register, login, refresh, logout, me, change-password, forgot-password)
- [x] Book CRUD + file upload + file download streaming
- [x] Orders, reviews, cart, wishlist endpoints
- [x] Admin endpoints (users, stats, revenue chart, top books)
- [x] Alembic migrations (001–006)
- [x] Database seed script

### Backend (FastAPI)
- [x] App scaffold with all routers
- [x] WebSocket reading session endpoint
- [x] Session start/end endpoints
- [x] ML recommendation endpoint
- [x] Sentiment endpoint
- [x] Analytics/heatmap endpoint
- [x] Chatbot POST /chat endpoint

### Celery
- [x] Celery app + Redis broker config
- [x] Order confirmation email task
- [x] Password reset email task
- [x] PDF report generation task
- [x] ML retrain + re-embed tasks
- [x] Beat scheduler (weekly retrain, daily re-embed)

### Database (PostgreSQL)
- [x] All 10 tables designed and migrated
- [x] docker-compose postgres service

### ML / AI
- [x] Data collection pipeline
- [x] Interaction matrix builder
- [x] Content-based recommender (TF-IDF + cosine similarity)
- [x] Collaborative filtering (surprise SVD)
- [x] Hybrid recommender with cold-start fallback
- [x] Training pipeline (saves to disk with joblib)
- [x] Analytics pipeline (heatmap, genre trends, peak hours, engagement)
- [x] VADER sentiment scoring + batch scoring
- [x] Extractive book summariser
- [x] Genre classifier (sklearn LogisticRegression)
- [x] HuggingFace zero-shot classifier (optional)
- [x] LLM integration (OpenAI / HuggingFace)
- [x] FAISS RAG pipeline over book catalog
- [x] Intent detection (rule-based + sklearn upgrade path)
- [x] Prompt builder
- [x] Conversation history (DB + in-memory fallback)
- [x] Rule-based FAQ fallback

## ⏳ What Still Needs To Be Done

### Frontend
- [ ] Connect frontend API calls to real backend (replace localStorage with axios calls)
  - Replace `db.getBooks()` → `GET /api/books`
  - Replace `db.getCart()` → `GET /api/cart`
  - Replace `db.saveOrders()` → `POST /api/orders`
  - Replace auth → `POST /api/auth/login` / `register`
- [ ] Add protected route guard (check JWT expiry in App.tsx)
- [ ] Connect Chatbot.tsx → `POST http://localhost:8000/chat`
- [ ] Connect Library.tsx reader → WebSocket `ws://localhost:8000/ws/session`
- [ ] Admin ML panel — fetch charts from FastAPI analytics endpoint
- [ ] Mobile responsiveness final pass (320px)

### Backend
- [ ] SMTP email credentials for order/reset emails
- [ ] File storage config (local or S3) for PDF/EPUB uploads
- [ ] Stripe payment integration (replace simulated checkout)
- [ ] Rate limiting on auth endpoints

### ML
- [ ] Run `python -m ml.nlp.setup` once to download NLTK + spaCy models
- [ ] Run `python -m ml.recommender.train` to train initial model
- [ ] Run `python -m ml.chatbot.rag` to build FAISS index
- [ ] Set OPENAI_API_KEY in .env for full chatbot AI

---

## 🚀 Setup & Run — Complete Guide

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| Python | 3.11+ | https://python.org |
| PostgreSQL | 15+ | https://postgresql.org or Docker |
| Redis | 7+ | https://redis.io or Docker |
| Docker (optional) | Latest | https://docker.com |

---

## Part 1 — Frontend Setup

```bash
# 1. Go to frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Install recharts (required for Admin charts)
npm install recharts

# 4. Start development server
npm run dev
# → Opens at http://localhost:5173
```

**Frontend runs immediately with localStorage** — no backend needed yet.
Demo login: `admin@bookhaven.com` / `admin123`

---

## Part 2 — PostgreSQL Setup

### Option A — Docker (recommended, easiest)

```bash
# From the backend/ folder
docker-compose up postgres -d

# Wait ~10 seconds for postgres to be ready, then verify:
docker-compose logs postgres | tail -5
# Should show: database system is ready to accept connections
```

### Option B — Local PostgreSQL

```bash
# 1. Start PostgreSQL service
# macOS:
brew services start postgresql@15
# Ubuntu/Debian:
sudo systemctl start postgresql
# Windows: start via Services or pgAdmin

# 2. Create database and user
psql -U postgres -f backend/setup.sql

# OR run manually:
psql -U postgres
postgres=# CREATE DATABASE bookhaven_db;
postgres=# CREATE USER bookhaven_user WITH ENCRYPTED PASSWORD 'bookhaven_pass';
postgres=# GRANT ALL PRIVILEGES ON DATABASE bookhaven_db TO bookhaven_user;
postgres=# \c bookhaven_db
bookhaven_db=# GRANT ALL ON SCHEMA public TO bookhaven_user;
postgres=# \q
```

### Connect with pgAdmin 4 (visual management)

1. Open pgAdmin 4
2. Right-click Servers → Register → Server
3. **General tab** — Name: `BookHaven Local`
4. **Connection tab**:
   - Host: `localhost`
   - Port: `5432`
   - Database: `bookhaven_db`
   - Username: `bookhaven_user`
   - Password: `bookhaven_pass`
5. Click Save

---

## Part 3 — Backend (Flask) Setup

```bash
# 1. Go to backend folder
cd backend

# 2. Create virtual environment
python -m venv venv

# Activate it:
# macOS / Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate
.\venv\Scripts\Activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy env file
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET_KEY, etc.

# 5. Run Alembic migrations (creates all tables)
alembic upgrade head

# 6. Seed the database (admin user + 10 sample books)
python seed.py

# 7. Start Flask API
flask run --port 5000
# → API runs at http://localhost:5000/api
```

**Verify Flask is running:**
```bash
curl http://localhost:5000/api/health
# → {"status":"ok","service":"BookHaven Flask API"}
```

---

## Part 4 — FastAPI Setup

```bash
# In the backend/ folder (same venv)

# 1. Install FastAPI dependencies
pip install -r requirements_fastapi.txt

# 2. Start FastAPI
uvicorn fastapi_app.main:app --host 0.0.0.0 --port 8000 --reload
# → API docs at http://localhost:8000/docs
```

---

## Part 5 — Redis Setup

### Option A — Docker
```bash
docker-compose up redis -d
```

### Option B — Local

```bash
# macOS:
brew install redis && brew services start redis

# Ubuntu/Debian:
sudo apt install redis-server && sudo systemctl start redis

# Windows: Download from https://github.com/tporadowski/redis/releases
# Run: redis-server.exe

# Verify Redis is running:
redis-cli ping
# → PONG
```

---

## Part 6 — Celery Worker Setup

```bash
# In backend/ folder (venv active)

# Terminal 1 — Celery worker
celery -A celery_app.celery worker --loglevel=info

# Terminal 2 — Celery beat (scheduled tasks)
celery -A celery_app.celery beat --loglevel=info

# Terminal 3 — Flower dashboard (optional, monitor tasks)
celery -A celery_app.celery flower --port=5555
# → http://localhost:5555
```

---

## Part 7 — ML Setup (First Time Only)

```bash
# In backend/ folder (venv active)

# 1. Install ML dependencies
pip install -r ml/requirements.txt

# 2. Download NLTK corpora + spaCy model (run once)
python -m ml.nlp.setup

# 3. Train the recommender model
python -m ml.recommender.train

# 4. Build the FAISS RAG index for the chatbot
python -m ml.chatbot.rag

# 5. (Optional) Train genre classifier
python -m ml.nlp.classify
```

---

## Part 8 — Run Everything with Docker (Full Stack)

```bash
# From project root
docker-compose up --build

# Services started:
# → postgres   on port 5432
# → redis      on port 6379
# → flask      on port 5000
# → fastapi    on port 8000
# → celery_worker
# → celery_beat
```

Then run the frontend separately:
```bash
cd frontend && npm run dev
```

---

## 🌐 All Running URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | React app |
| Flask API | http://localhost:5000/api | Main REST API |
| FastAPI | http://localhost:8000 | Async + ML + WS |
| FastAPI Docs | http://localhost:8000/docs | Swagger UI |
| Flower | http://localhost:5555 | Celery monitor |
| pgAdmin 4 | http://localhost:5050 | DB management |

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bookhaven.com | admin123 |
| Customer | reader@bookhaven.com | reader123 |

**Test payment card:** `4242 4242 4242 4242` · Any future MM/YY · Any CVV

---

## 🧪 Quick Smoke Test

```bash
# Test Flask auth
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bookhaven.com","password":"admin123"}'

# Test books endpoint
curl http://localhost:5000/api/books/

# Test chatbot
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"recommend a book","userId":null}'
```

---

## 📦 Environment Variables (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | ✅ | PostgreSQL connection string |
| JWT_SECRET_KEY | ✅ | Secret for signing JWT tokens |
| REDIS_URL | ✅ | Redis connection for Celery |
| OPENAI_API_KEY | Optional | Enables AI chatbot (GPT-4o) |
| MAIL_USERNAME | Optional | Gmail address for emails |
| MAIL_PASSWORD | Optional | Gmail App Password |
| HF_API_TOKEN | Optional | HuggingFace API fallback |

---

## 🚨 Common Issues

| Problem | Fix |
|---------|-----|
| `alembic upgrade head` fails | Check DATABASE_URL in .env is correct |
| Flask port 5000 in use (macOS) | `flask run --port 5001` (macOS uses 5000 for AirPlay) |
| `ModuleNotFoundError` in Flask | Make sure venv is activated: `source venv/bin/activate` |
| Redis connection refused | Start Redis: `brew services start redis` or `docker-compose up redis` |
| CORS error in browser | Check FRONTEND_URL in .env matches your React dev server port |
| spaCy model not found | Run `python -m ml.nlp.setup` |
| Chatbot gives generic responses | Set OPENAI_API_KEY in .env |