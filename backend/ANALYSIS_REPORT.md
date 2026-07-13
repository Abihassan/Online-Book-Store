# BookHaven — Full Project Analysis Report (Truth Mode)

---

## ⚠️ CRITICAL UPDATE — Real Root Cause Identified

After the first round of fixes, the user ran the server and supplied actual terminal logs. Those logs changed the diagnosis completely and exposed the **true root cause**, which is more fundamental than the bugs originally fixed (those bugs are still real and still worth keeping fixed, but they were not the primary blocker).

### Evidence from the terminal log

```
(venv) PS ...\backend> uvicorn fastapi_app.main:app --host 0.0.0.0 --port 8000
...
INFO: "GET /api/books/?per_page=20 HTTP/1.1" 404 Not Found
INFO: "POST /api/auth/login HTTP/1.1" 404 Not Found
INFO: "POST /api/auth/register HTTP/1.1" 404 Not Found
```

**Every endpoint the frontend needs returns 404 — without exception.** That is the signature of "the wrong app is running," not "a route has a typo."

### Root cause

This repository contains **two separate FastAPI app packages** in `backend/`:

| Package | Entry point | What it contains |
|---|---|---|
| `backend/fastapi_app/` | `fastapi_app.main:app` | **Only** reading-sessions, websockets, ML recommendations, analytics, and chatbot routers. No `/api` prefix. **No auth router. No books router.** |
| `backend/unified/` | `unified.main:app` | The **complete** application: auth, books, cart, wishlist, orders, reviews, admin — all correctly mounted under `/api/...` — plus the same sessions/ws/ml/analytics/chat routers. |

The user started the server with:
```
uvicorn fastapi_app.main:app --host 0.0.0.0 --port 8000
```

`fastapi_app/main.py` literally only does this:
```python
app.include_router(sessions_router,  prefix="/sessions",  tags=["Reading Sessions"])
app.include_router(ws_router,        prefix="/ws",        tags=["WebSocket"])
app.include_router(ml_router,        prefix="/ml",        tags=["ML"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
app.include_router(chat_router,      prefix="/chat",      tags=["Chatbot"])
```

There is no `/api/books`, no `/api/auth/login`, no `/api/auth/register` registered anywhere in this app — so FastAPI correctly returns `404 Not Found` for all of them. This is not a CORS issue, not a token issue, not a frontend bug — **the frontend was talking to a backend process that simply does not have the routes it's asking for.**

This explains all four symptoms simultaneously:
- "Failed to load home page" → `GET /api/books/` → 404
- "Login failed" → `POST /api/auth/login` → 404
- "Registration failed" → `POST /api/auth/register` → 404
- "Failed to load books" → `GET /api/books/?...` → 404

The fixes from the first round (the duplicate-login-call fix, the sort value fix, etc.) are real and still correct to keep — but they were masked by this much bigger problem and could never have taken effect while the wrong server was running.

### The fix

**Run the unified server, not `fastapi_app`:**

```bash
cd "backend"
uvicorn unified.main:app --reload --port 8000
```

`unified/main.py`'s own docstring confirms this is the intended command:
```python
"""
BookHaven — Unified FastAPI Server (port 8000)
All Flask routes + FastAPI async features merged into one server.

Run:
    uvicorn unified.main:app --reload --port 8000
"""
```

After switching to this entry point, you should see route registrations like `/api/auth/login`, `/api/auth/register`, `/api/books/`, etc. actually exist, and the 404s will disappear.

### Why `fastapi_app/` exists at all

Based on the code, `fastapi_app/` appears to be an earlier, narrower service (real-time sessions, ML, analytics, chat) that was later merged into `unified/` along with the full Flask-equivalent feature set (auth, books, cart, etc.). The old `fastapi_app/` package was left in the repo instead of being deleted, which makes it dangerously easy to start the wrong one — exactly what happened here. **Recommendation:** delete or rename `backend/fastapi_app/` (e.g. to `backend/_deprecated_fastapi_app/`) once you confirm `unified/` covers everything you need, to prevent this from happening again.

### Updated verification steps

1. Stop the currently running server (`Ctrl+C`).
2. From `backend/`, run: `uvicorn unified.main:app --reload --port 8000` — **not** `fastapi_app.main:app`.
3. Confirm the startup log prints `BookHaven unified server starting on http://localhost:8000` (not the `fastapi_app` startup message).
4. Visit `http://localhost:8000/docs` and confirm you see `/api/auth/login`, `/api/auth/register`, `/api/books/` etc. in the Swagger UI.
5. If the books table is empty, run the seeder once: `python seed_unified.py` (from `backend/`, with the venv active and `DATABASE_URL` set in `.env`).
6. Reload the frontend — home page, login, registration, and book browse should now all work, assuming PostgreSQL is running and `DATABASE_URL` is correctly set in `backend/.env`.
7. Visit the Library page while logged in. With the `Library.tsx` fix (per_page lowered from 200 to 100), `GET /api/books/?per_page=100` should return `200 OK` instead of `422 Unprocessable Entity`.

---

## Original Analysis (Still Valid — Secondary Issues)

The sections below reflect the original code-level analysis performed before the terminal logs were available. These bugs are real and the fixes should still be applied, but they were not the primary cause of the reported failures — running the wrong backend entry point was.

---


## 1. Project Architecture Overview

| Layer | Technology | Port | Entry Point |
|---|---|---|---|
| Frontend | React + Vite + TypeScript | 5173 | `src/main.tsx` |
| Backend (unified) | FastAPI + asyncpg | 8000 | `backend/unified/main.py` |
| Backend (legacy Flask) | Flask (not used at runtime) | 5000 | `backend/wsgi.py` |
| Database | PostgreSQL | 5432 | `backend/unified/database.py` |

The project migrated from Flask to a unified FastAPI server. The Vite dev proxy correctly forwards all `/api/*` traffic to `localhost:8000`. The frontend `api.ts` `baseURL` is set via `VITE_FLASK_URL=http://localhost:8000/api`, which is correct.

---

## 2. Frontend ↔ Backend Communication Map

| Feature | Frontend File | API Function | Endpoint | Method | Backend Router |
|---|---|---|---|---|---|
| Load books (home, browse) | `pages/Index.tsx`, `pages/Books.tsx` | `getBooks()` | `GET /api/books/` | GET | `unified/routers/books.py` |
| Single book detail | `pages/BookDetail.tsx` | `getBook(id)` | `GET /api/books/:id` | GET | `unified/routers/books.py` |
| Login | `pages/Auth.tsx` | `loginUser()` | `POST /api/auth/login` | POST | `unified/routers/auth.py` |
| Register | `pages/Auth.tsx` | `registerUser()` | `POST /api/auth/register` | POST | `unified/routers/auth.py` |
| Logout | `contexts/AuthContext.tsx` | `logoutUser()` | `POST /api/auth/logout` | POST | `unified/routers/auth.py` |
| Current user | `contexts/AuthContext.tsx` | `fetchMe()` | `GET /api/auth/me` | GET | `unified/routers/auth.py` |
| Token refresh | `lib/api.ts` (interceptor) | inline axios | `POST /api/auth/refresh` | POST | `unified/routers/auth.py` |
| Forgot password | `pages/Auth.tsx` | `forgotPassword()` | `POST /api/auth/forgot-password` | POST | `unified/routers/auth.py` |
| Cart get | `lib/cartApi.ts` | `getCart()` | `GET /api/cart/` | GET | `unified/routers/cart.py` |
| Cart add | `lib/cartApi.ts` | `addToCart()` | `POST /api/cart/` | POST | `unified/routers/cart.py` |
| Cart update | `lib/cartApi.ts` | `updateCartItem()` | `PUT /api/cart/:id` | PUT | `unified/routers/cart.py` |
| Cart remove | `lib/cartApi.ts` | `removeCartItem()` | `DELETE /api/cart/:id` | DELETE | `unified/routers/cart.py` |
| Wishlist get | `lib/wishlistApi.ts` | `getWishlist()` | `GET /api/wishlist/` | GET | `unified/routers/wishlist.py` |
| Wishlist add | `lib/wishlistApi.ts` | `addToWishlist()` | `POST /api/wishlist/` | POST | `unified/routers/wishlist.py` |
| Wishlist remove | `lib/wishlistApi.ts` | `removeFromWishlist()` | `DELETE /api/wishlist/:id` | DELETE | `unified/routers/wishlist.py` |
| Reviews | `lib/reviewsApi.ts` | various | `/api/reviews/*` | GET/POST | `unified/routers/reviews.py` |
| Orders | `lib/ordersApi.ts` | various | `/api/orders/*` | GET/POST | `unified/routers/orders.py` |
| Admin | `lib/adminApi.ts` | various | `/api/admin/*` | GET/POST/DELETE | `unified/routers/admin.py` |

---

## 3. Identified Bugs — Root Causes

---

### BUG 1 — CRITICAL: Double API Call on Login and Register

**Files affected:**
- `src/pages/Auth.tsx` (lines 192–222 for login, 259–286 for register)
- `src/contexts/AuthContext.tsx` (lines 37–40)

**What happens:**
In `Auth.tsx`, `handleLogin` does two things in sequence:
1. Calls `loginUser(email, password)` from `src/lib/auth.ts` — this makes `POST /api/auth/login`, stores tokens, and returns the user.
2. Then immediately calls `login(email, password)` from `AuthContext` — which **calls `loginUser()` again**, making a **second `POST /api/auth/login`** request.

The same pattern exists in `handleRegister`.

```
Auth.tsx handleLogin():
  Step 1: await loginUser(email, password)   ← makes POST /api/auth/login ✓
  Step 2: login(email, password)              ← AuthContext.login() calls loginUser() AGAIN ✗
                                                 = second POST /api/auth/login
```

`AuthContext.login()` at line 38:
```ts
const login = async (email: string, password: string): Promise<AuthUser> => {
  const u = await loginUser(email, password);  // ← second API call!
  setUserState(u);
  return u;
};
```

**Why it causes "Failed to load home page" / "Login does not work":**
The second `loginUser()` call also calls `setTokens()`, overwriting the tokens from the first call with new (duplicate) tokens — this is fine in a local dev scenario but the real issue is that the `AuthContext` never receives the user object from the *first* successful call in `Auth.tsx`. The `user` state in `AuthContext` is only set by the `login()` call, which runs its own async `loginUser()`. If the second request races or fails (e.g. any network hiccup), `user` stays `null`, the Navbar doesn't show the logged-in state, and components that gate on `user` fail silently. On top of that the unnecessary double-call wastes a round trip and doubles the chance of failure.

**Fix:** Remove the direct `loginUser()` / `registerUser()` calls from `Auth.tsx`. Delegate entirely to `AuthContext.login()` and `AuthContext.register()` — they already call the API and set state.

---

### BUG 2 — CRITICAL: Sort-By Value Mismatch Between Frontend and Backend

**Files affected:**
- `src/pages/Books.tsx` (lines 572–573)
- `src/lib/booksApi.ts` (line 14)
- `backend/unified/routers/books.py` (lines 83–89)

**What happens:**
`Books.tsx` UI sends sort values `price_asc` and `price_desc` (with underscores), but the backend `sort_map` only recognises `price-low` and `price-high` (with hyphens). When the user selects "Price ↑" or "Price ↓", the backend's `sort_map.get(sort_by, Book.title.asc())` silently falls back to title sort — the user gets wrong results with no error.

```python
# backend/unified/routers/books.py — what exists:
sort_map = {
    "title":      Book.title.asc(),
    "price-low":  Book.price.asc(),   ← expects "price-low"
    "price-high": Book.price.desc(),  ← expects "price-high"
    "rating":     Book.rating.desc(),
    "newest":     Book.created_at.desc(),
}
```

```tsx
// Books.tsx — what the frontend sends:
<SelectItem value="price_asc">Price ↑</SelectItem>   ← sends "price_asc"
<SelectItem value="price_desc">Price ↓</SelectItem>  ← sends "price_desc"
```

The `BooksParams` type in `booksApi.ts` also declares `'price-low' | 'price-high'` but `Books.tsx` ignores that type (it just uses a `string` state variable).

**Fix:** Align the frontend values to match the backend keys (change `price_asc` → `price-low`, `price_desc` → `price-high`). Alternatively update the backend — but changing the frontend is safer and less disruptive.

---

### BUG 3 — CRITICAL: `VITE_FASTAPI_URL` Missing Trailing Newline in `.env`

**File affected:** `.env` (root)

**What happens:**
The `.env` file ends without a trailing newline:
```
VITE_FLASK_URL=http://localhost:8000/api\r\nVITE_FASTAPI_URL=http://localhost:8000
```
(no `\n` at end). Some env parsers on Windows/certain Vite versions fail to read the last line of a file with no trailing newline, meaning `VITE_FASTAPI_URL` may come through as `undefined`. In that case, `api.ts` falls back to the hardcoded `http://localhost:8000`, which happens to be correct — so this is low-severity in the current setup. However it is a latent bug that would break if the default changed.

**Fix:** Add a trailing newline to `.env`.

---

### BUG 4 — MEDIUM: Auth.tsx Uses `login()` From AuthContext Instead of `setUser()` After First API Call

This is the companion to Bug 1. Because `Auth.tsx` calls both `loginUser()` (direct API call) and then `login()` (AuthContext, which calls the API again), the `user` object set in `AuthContext` comes from the *second* API call's response, not the first. This means any state set between the two calls (e.g. tokens stored by the first call) may be immediately overwritten by the second call's `setTokens()` with a new token pair.

**Fix:** See Bug 1 fix — eliminate the direct `loginUser()` / `registerUser()` calls in `Auth.tsx` and route everything through `AuthContext.login()` / `AuthContext.register()`.

---

### BUG 5 — LOW: `booksApi.ts` `downloadBookUrl()` Hardcodes Port 5000

**File affected:** `src/lib/booksApi.ts` (line ~50)

```ts
return `${import.meta.env.VITE_FLASK_URL || 'http://localhost:5000/api'}/books/${bookId}/download`;
```

The fallback is port `5000` (old Flask), not `8000` (unified FastAPI). If `VITE_FLASK_URL` is not set, downloads would silently fail. Since `VITE_FLASK_URL` is set in `.env` to port `8000`, this only fires in environments where `.env` is not loaded.

**Fix:** Update the fallback to `http://localhost:8000/api`.

---

### BUG 6 — CRITICAL: `per_page=200` Exceeds Backend's Hard Cap of 100 (Library Page)

**Files affected:**
- `src/pages/Library.tsx` (line ~64: `getBooks({ per_page: 200 })`)
- `backend/unified/routers/books.py` (line ~58: `per_page: int = Query(12, ge=1, le=100)`)

**What happens:**
The Library page calls `getBooks({ per_page: 200 })` to fetch "all" books in one request so it can cross-reference them against the user's orders. The backend's `GET /api/books/` endpoint validates `per_page` with FastAPI's `Query(12, ge=1, le=100)` — meaning any value above 100 fails Pydantic/FastAPI request validation **before the handler even runs**, returning:

```
GET /api/books/?per_page=200 HTTP/1.1" 422 Unprocessable Entity
```

`getBooks()` in `booksApi.ts` doesn't catch this — the error propagates up to `Library.tsx`'s `loadLibrary()`, which catches it generically and shows the toast `"Failed to load library"`.

**Why it only affects Library (not Home/Books):**
`Index.tsx` and `Books.tsx` request `per_page: 20` and paginated amounts ≤ 100 respectively, both safely under the cap. Only `Library.tsx` requests 200, which is why this page alone fails with the new symptom.

**Fix — two valid options:**

**Option A (recommended, frontend-only, no backend/schema change):** Lower the requested `per_page` in `Library.tsx` to 100 (the backend max), and if a user could plausibly own more than 100 distinct books, paginate the request in a loop. For typical store sizes, 100 is enough.

```ts
// src/pages/Library.tsx
const { books } = await getBooks({
  per_page: 100, // was 200 — backend caps at le=100
});
```

**Option B (backend change):** Raise the backend's cap to accommodate large libraries:

```python
# backend/unified/routers/books.py
per_page: int = Query(12, ge=1, le=200),  # was le=100
```

Option B is more future-proof if your catalog can exceed 100 books and a user could own more than 100 of them; Option A requires no backend redeploy. The fixed files in this delivery apply **Option A** since it's safer and doesn't change a public API contract that other clients might depend on.

---

## 4. What Works Correctly

- CORS configuration in `unified/main.py` allows `http://localhost:5173` — correct.
- Vite proxy in `vite.config.ts` forwards all `/api/*` to `localhost:8000` — correct.
- JWT implementation in `auth_utils.py` (create, verify, blacklist) — correct.
- `database.py` correctly converts `postgresql://` to `postgresql+asyncpg://` — correct.
- Token refresh interceptor in `api.ts` — correct logic.
- All backend route registrations in `unified/main.py` (once it is the server actually being run) match the frontend API calls.
- `Book.to_dict()` returns `badge`, `fileUrl`, and `isFree` fields, all now consumed correctly by the frontend.

---

## 5. All Fixed Files

See the accompanying fixed files in this folder. Summary of changes:

| File | Change |
|---|---|
| `src/pages/Auth.tsx` | Remove direct `loginUser()` / `registerUser()` calls; use `AuthContext.login()` / `AuthContext.register()` only |
| `src/pages/Books.tsx` | Change `price_asc` → `price-low`, `price_desc` → `price-high` |
| `src/lib/booksApi.ts` | Fix fallback URL from `5000` to `8000` |
| `.env` | Add trailing newline |
| `src/pages/Index.tsx` | Add `console.error` logging to the homepage load failure handler |
| `src/pages/Library.tsx` | Fix `per_page` 200→100; **replace placeholder PDF reader with a real `react-pdf` viewer** wired to the actual uploaded file per book (new feature) |
| `src/lib/types.ts` | Add `fileUrl` and `isFree` fields to the `Book` interface (new feature) |
| `src/pages/Admin.tsx` | Add a real PDF/EPUB upload control per book in the admin panel (new feature) |
| `src/contexts/CartContext.tsx` (new) | Shared cart state across the whole app — fixes the "cart doesn't update until reload" bug |
| `src/components/Navbar.tsx` | Migrated to shared `CartContext` |
| `src/pages/Cart.tsx`, `Checkout.tsx` | Migrated cart mutations to shared context; Checkout refreshes cart after order success |

---

## 6. Verification Checklist After Applying Fixes

- [ ] **Home page loads** — `getBooks()` calls `GET /api/books/` → returns book list → sections render
- [ ] **Login works** — `AuthContext.login()` calls `POST /api/auth/login` once → tokens stored → user set → redirect to `/`
- [ ] **Register works** — `AuthContext.register()` calls `POST /api/auth/register` once → tokens stored → user set → redirect to `/`
- [ ] **Books browse loads** — `getBooks()` with filters → `GET /api/books/?page=1&per_page=12...` → list renders
- [ ] **Price sort works** — `price-low` / `price-high` values match backend `sort_map` keys
- [ ] **Admin can upload a PDF** — `/admin` → Books tab → "Upload File" → `POST /api/books/upload` → book row shows "📄 File attached"
- [ ] **Library "Read" opens the real PDF** — for a purchased (or free) book with a file attached, clicking "Read" fetches `GET /api/books/{id}/download` and renders actual pages, not the old placeholder

---

## 7. NEW FEATURE — Real PDF Files in the Library Reader

This section documents a feature addition (not a bug fix): wiring real, uploadable PDF files into the Library's "Read" experience, replacing the placeholder demo PDF that was previously hardcoded.

### What was already in place

The backend already had everything needed, unused:
- `POST /api/books/upload` (admin only) — accepts a PDF/EPUB file, saves it to `backend/uploads/`, and sets `Book.file_url`.
- `GET /api/books/{book_id}/download` — serves the real file back, enforcing purchase ownership (or `is_free`) and requiring a valid Bearer token.
- `react-pdf` and `pdfjs-dist` were already listed in `package.json` as dependencies, but nothing in the active app actually used them — `Library.tsx`'s reader was a plain `<iframe>` pointed at a permanent placeholder PDF, and a separate, disconnected `BookReader.tsx` page (reachable at `/reader/:bookId` but never linked to from the UI) used `react-pdf` correctly but against the old localStorage-based mock database and the same mock PDF URL.

### What changed

**1. `src/lib/types.ts`** — added `fileUrl?: string` and `isFree?: boolean` to the `Book` interface, since the backend's `Book.to_dict()` already sends these fields but the frontend type didn't declare them.

**2. `src/pages/Admin.tsx`** — added a real "Upload File" / "Replace File" button next to each book in the admin Books tab. Clicking it opens a native file picker restricted to `.pdf`/`.epub`, calls the existing `uploadBookFile(bookId, file)` API client function (which was already written but never called from any UI), and shows a "📄 File attached" indicator once a book has a file. Client-side validation rejects non-PDF/EPUB extensions and files over 25MB before the network call.

**3. `src/pages/Library.tsx`** — replaced the iframe + hardcoded `DEMO_PDF` with a real `react-pdf` viewer:
- On clicking "Read," the book's real file is fetched from `GET /api/books/{id}/download` as an authenticated `Blob` (using the same Bearer-token pattern as the existing `downloadBook()` function), then converted to a local `blob:` URL and handed to `react-pdf`'s `<Document>`/`<Page>` components.
- A plain `<iframe src="...">` cannot be used here because the download endpoint requires an `Authorization` header — browsers don't let you attach custom headers to an iframe's navigation request, so the fetch-as-blob approach is necessary, not just stylistic.
- Books with no uploaded file show a disabled "No file yet" button instead of opening a broken reader.
- Free books (`isFree: true`) now also appear in the Library even without a purchase order, matching the backend's existing bypass of the purchase check for free books.
- Added page navigation (prev/next), zoom controls, a loading state, and a retryable error state (distinguishing "not purchased," "no file uploaded," and generic failures using the HTTP status code).
- Reading progress (current page / total pages) is now saved to `localStorage` per book/user, matching the existing progress-tracking pattern already used elsewhere in this component.
- Object URLs are properly revoked (no memory leaks) on reader close, on retry, and on component unmount — the unmount cleanup uses a `ref` rather than the React state value directly, since the cleanup closure would otherwise only ever see the blob URL from the initial render.

### How to actually add a PDF to a book (step by step)

1. Make sure you're logged in as a user whose `role` is `admin` in the database (the `seed_unified.py` script creates one such user — check that file for the seeded admin email/password, or promote an existing user manually via direct DB update if needed).
2. Go to `/admin` → the **Books** tab.
3. Find the book you want to attach a file to. Click **Upload File**.
4. Select a `.pdf` (or `.epub`) file from your computer. The button will show "Uploading…" and then the row will show "📄 File attached" once done.
5. Behind the scenes: the file is saved to `backend/uploads/{book_id}_{original_filename}.pdf` on the server's disk, and the book's `file_url` column is set to `/api/books/{book_id}/download`.
6. As a regular (non-admin) user who has purchased that book (or if the book is marked `is_free`), go to `/library`. The book's "Read" button will now be enabled. Clicking it fetches the real file and renders it with page navigation, zoom, and progress tracking.

### Setup / environment notes

- **`UPLOAD_FOLDER`**: the backend reads this from the environment (`backend/.env`), defaulting to `./uploads` relative to wherever `uvicorn` is launched from. Make sure this directory is writable, and make sure you consistently launch the server from `backend/` so the relative path resolves the same way every time — otherwise uploaded files from one run may not be found on a later run if the working directory changes.
- **File size**: the client blocks files over 25MB before upload; there is currently no matching server-side size limit in `upload_book_file()`. If you need to support larger files, add an explicit check there too (reading `await file.read()` fully into memory for very large files is also worth revisiting — for production use, streaming the upload to disk in chunks would be more robust than the current full-read-then-write implementation).
- **Worker CDN dependency**: the reader loads the PDF.js worker script from `unpkg.com` at runtime (see Remaining Risks below). This requires outbound internet access from the browser; it is not an offline-capable setup as currently written.
- **The old `BookReader.tsx` / `/reader/:bookId` route**: left untouched and still present in the codebase, still using the old mock `db` module and a mock PDF. It is not linked to from the Library page anymore (Library now uses its own inline reader) and can be safely deleted in a future cleanup, similar to the `fastapi_app` vs `unified` backend duplication found earlier in this project — having two parallel, partially-implemented versions of the same feature is exactly the kind of thing that causes confusion down the line.

---

## 8. BUG FIX — Cart Doesn't Update Until Page Reload

**Symptom:** clicking "Add to Cart" from Home, Browse, Book Detail, or Wishlist pages added the item successfully on the backend, but the cart icon/badge in the navbar didn't update until a full page reload.

**Root cause:** there was no shared cart state anywhere in the app. `Navbar.tsx` tracked `cartItems` in its own private `useState`, refreshed only when *it* called `addToCart()` from its own cart flyout. Every other page (`Index.tsx`, `Books.tsx`, `BookDetail.tsx`, `Wishlist.tsx`) called the same `addToCart()` API function, but had no mechanism to tell the Navbar's independent state to refresh — they're separate component instances with no shared source of truth. The same gap existed after checkout: the backend correctly clears the cart server-side on order completion, but nothing told the Navbar to refetch, so the badge would also stay stale after a completed purchase.

**Fix:** added a `CartContext` (mirroring the existing `AuthContext` pattern already used for auth state) as a single shared source of truth for cart contents, mounted in `App.tsx` inside `AuthProvider`. Every page that adds, updates, or removes a cart item now goes through `useCart()`, whose mutator functions automatically refetch and broadcast the new cart to every component reading from the context — including the Navbar badge, instantly, with no reload needed. `Checkout.tsx` now also calls `refreshCart()` after a successful order, closing the same gap on the purchase-completion path.

**Files changed:**
| File | Change |
|---|---|
| `src/contexts/CartContext.tsx` (new) | Shared cart state + add/update/remove wrappers that auto-refresh |
| `src/App.tsx` | Mounted `CartProvider` inside `AuthProvider` |
| `src/components/Navbar.tsx` | Reads cart from `useCart()` instead of private state; badge uses summed quantity (`cartCount`) instead of line-item count |
| `src/pages/Index.tsx`, `Books.tsx`, `BookDetail.tsx`, `Wishlist.tsx` | `addToCart` calls now go through the shared context |
| `src/pages/Cart.tsx` | Update/remove actions now go through the shared context too, so changes made on the Cart page also instantly reflect in the Navbar |
| `src/pages/Checkout.tsx` | Calls `refreshCart()` after successful order placement |

**Bonus fix caught along the way:** `BookDetail.tsx`'s "Similar Books" and "Recently Viewed" sections called `addToCart(bookId)` without `await`, meaning any failure was silently swallowed and the success toast could show even if the call hadn't actually finished (or had failed). Fixed to properly chain `.then()`/`.catch()` with appropriate success/error toasts.

---

## 9. SECURITY AUDIT (Truth Mode)

This audit was performed by directly reading the actual source code, configuration files, and dependency manifests — not by assumption. Each finding below states exactly what was checked, what was found, and how confident I am in the finding given what I have access to (a static code snapshot, not your live deployment or git history).

### 🔴 HIGH SEVERITY

**1. ✅ FIXED — Hardcoded fallback secret keys**
`backend/unified/auth_utils.py` previously had `SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")`. If `JWT_SECRET_KEY` was ever unset in any environment, the app would silently fall back to a hardcoded, publicly-visible-in-source value, letting anyone with this code forge valid JWTs for any user.
**Fix applied:** the fallback has been removed. `auth_utils.py` now raises `RuntimeError` at import time if `JWT_SECRET_KEY` isn't set, with a message telling you exactly how to generate one. Since `backend/.env` already sets a real value, this change doesn't affect your current setup — it only removes the dangerous fallback for any future environment that forgets to set it. The same pattern in the older, unused `backend/app/config.py` was left as-is since that file isn't part of the running `unified` server.

**2. Secrets committed to the project folder (`backend/.env`)**
`backend/.env` contains a real-looking JWT secret, a real PostgreSQL password (`abi123`), and placeholders for SMTP/OpenAI/HuggingFace credentials. I confirmed the root `.gitignore`'s `.env` rule **does** correctly match `backend/.env` too (verified empirically with `git check-ignore`), so *if* this project has been version-controlled with this `.gitignore` in place since the first commit, these secrets were never pushed to a remote.
**However — I cannot verify your actual git history from a zip file.** If `backend/.env` was ever committed *before* the `.gitignore` rule was added, it remains in history permanently (an ignored file is excluded going forward, not retroactively scrubbed). **Action required on your end:** run `git log --all --full-history -- backend/.env` in your real repo. If it returns any commits, those secrets are compromised and must be rotated (new JWT secret, new DB password) regardless of whether the repo is public or private. **This is the one item in this entire audit I genuinely cannot fix for you** — it requires information only available on your machine.

**3. ✅ FIXED — No rate limiting on any endpoint**
Previously confirmed via codebase search — no `slowapi`, no custom rate-limit middleware, nothing. `POST /api/auth/login` could be brute-forced with unlimited attempts, and `POST /chat/` had no auth requirement *and* no rate limit.
**Fix applied:** added `slowapi`, wired into `unified/main.py` (`app.state.limiter`, exception handler, middleware — see `unified/limiter.py` for the shared instance). `POST /api/auth/login` is now limited to 10 attempts/minute per IP, `POST /api/auth/register` to 5/hour per IP, and `POST /chat/` to 20/minute per IP. `/chat/` remains open to anonymous visitors by design (a storefront assistant should help shoppers before they register), but is no longer unlimited.

### 🟡 MEDIUM SEVERITY

**4. JWT and refresh tokens stored in `localStorage`**
`src/lib/api.ts` and `src/lib/auth.ts` store both the access token and the 30-day refresh token in `localStorage`. This is a common, simple SPA pattern, but it means any successful XSS vulnerability (anywhere on the site, including in a future third-party npm package) can read both tokens via JavaScript and achieve full account takeover, not just a short-lived session hijack. I checked the codebase for actual XSS vectors (`dangerouslySetInnerHTML`, unescaped rendering) and found only one usage, which is safe (static chart-library CSS generation, no user input involved) — so there is **no currently-exploitable XSS path that I found**, which lowers real-world risk today. But this remains a structural weakness: the more defensible production pattern is an httpOnly cookie for the refresh token (inaccessible to JS) with the access token held in memory only.
**Fix (optional, more involved):** move refresh-token storage to an httpOnly, Secure, SameSite=Strict cookie set by the backend; keep only the short-lived access token in memory (not localStorage) on the frontend.

**5. `python-jose==3.3.0` has two known CVEs**
Confirmed via current security advisories: CVE-2024-33663 (algorithm-confusion / signature bypass when the decode algorithm isn't explicitly pinned) and CVE-2024-33664 / CVE-2024-29370 (a JWE decompression-bomb denial-of-service). **Good news, also confirmed by reading the code:** every `jwt.decode()` call in `auth_utils.py` already explicitly passes `algorithms=[ALGORITHM]`, which is exactly the recommended mitigation for CVE-2024-33663 — this code is not using the vulnerable calling pattern. No patched version of `python-jose` exists yet as of the advisories I found.
**Fix:** no immediate code change needed (the safe calling pattern is already in place), but track upstream for a patched release, and avoid ever calling `jwt.decode()` without an explicit `algorithms=` argument anywhere else in the codebase.

**6. ✅ FIXED — Exception details leaked to API responses**
`backend/unified/routers/analytics.py` had two handlers (not four as I initially estimated before re-checking precisely): `except Exception as e: raise HTTPException(500, str(e))`. This returned raw internal exception text (which can include SQL fragments, file paths, or library internals) directly in the HTTP response body.
**Fix applied:** both handlers now log the full exception server-side via `logger.exception(...)` and return a generic `"Internal server error"` message to the client.

**7. "Forgot password" doesn't actually work**
`backend/unified/routers/auth.py`'s `/forgot-password` endpoint generates a cryptographically strong token correctly, but only `print()`s it to the server console — it's never stored, never emailed, and there's no `/reset-password` endpoint to consume it. This is a functional gap, not a vulnerability (it fails safe — nothing usable leaks), but it means the feature is currently a non-functional stub from the user's perspective. Worth knowing before a real user hits "forgot password" expecting it to work.

### 🟢 LOW SEVERITY / GOOD PRACTICES CONFIRMED

**8. Authorization & IDOR — well implemented.** I checked every cart, wishlist, and order mutation endpoint specifically for Insecure Direct Object Reference (whether User A could touch User B's data by guessing an ID). `cart.py` and `wishlist.py` correctly scope every `UPDATE`/`DELETE` query with `WHERE id = :id AND user_id = :current_user.id` in the same query — ownership is enforced at the database level, not as an afterthought. `orders.py` explicitly checks `order.user_id != current_user.id and current_user.role != "admin"` before returning order details. All admin-only routes (`admin.py`, plus book create/update/delete/upload in `books.py`) consistently require the `get_admin_user` dependency. This is genuinely solid, correctly-designed access control.

**9. File upload — no path traversal found.** `POST /api/books/upload` uses `werkzeug.utils.secure_filename()` to sanitize the filename before writing to disk (strips `../` sequences and unsafe characters), restricts extensions to an allowlist (`pdf, epub, jpg, jpeg, png, webp`), and is gated behind `get_admin_user`. The download endpoint validates `book_id` against the database before ever touching the filesystem. No injection vector found here.

**10. SQL injection — not found.** All raw `text()` SQL queries (in `analytics.py`) are fully static with zero string interpolation or user-controllable input; every other query in the codebase uses SQLAlchemy's parameterized query builder. I did not find any place where user input is concatenated into a SQL string.

**11. CORS — fine for local development, needs hardening before production.** `unified/main.py` currently allows `localhost:5173` and `localhost:3000` explicitly (no wildcard `*`), which is correct for dev. Before deploying, this allowlist needs to be replaced with your actual production frontend domain(s) — I can't do this for you since I don't know your eventual production domain, but flagging it so it's not forgotten.

### Action Items, In Priority Order

1. ⚠️ **Still needs you** — Rotate the JWT secret and DB password if `backend/.env` was ever committed to git history (verify with the command above — this is the only item that requires information I don't have access to).
2. ✅ **Done** — Removed hardcoded fallback secrets in `auth_utils.py`; fails startup instead. (The legacy, unused `app/config.py` was left as-is since it isn't part of the running server.)
3. ✅ **Done** — Added rate limiting to `/api/auth/login` (10/min), `/api/auth/register` (5/hour), and `/chat/` (20/min).
4. ✅ **Done** — `analytics.py`'s error handlers no longer leak raw exception text.
5. ⚠️ **Still open, your call** — (Optional, larger effort) Migrate refresh-token storage from `localStorage` to an httpOnly cookie. Not done since it's a meaningfully larger architectural change and no exploitable XSS was found that would make this urgent today.
6. ⚠️ **Still open, your call** — Either implement the missing `/reset-password` endpoint + email delivery, or clearly mark "forgot password" as not-yet-available in the UI. Not done since it's a product decision (build the feature vs. hide it) rather than a pure bug fix.
7. ⚠️ **Still needs you** — Set a real, finalized CORS allowlist before any production deployment. Not done since I don't know your production domain.
8. ⚠️ **Still needs you** — Run `npm audit` and `pip-audit` locally for a complete, currently-accurate dependency vulnerability scan.

Items 1, 7, and 8 genuinely require information or decisions only available on your end. Items 5 and 6 are open product/architecture decisions — let me know if you'd like either built out.

---

## 10. Other Remaining Risks (Non-Security)

| Risk | Severity | Notes |
|---|---|---|
| PostgreSQL not running locally | HIGH | All pages fail if DB is down; no health-check UI |
| Token blacklist is in-memory | MEDIUM | Restarts invalidate all blacklisted tokens |
| Email/password reset is no-op | LOW | `forgot-password` only prints to console in dev |
| `asyncio` DB session not thread-safe | LOW | Already handled by `async_sessionmaker` correctly |
| Flask backend (`wsgi.py`) still exists | LOW | If accidentally started on port 5000, there will be two conflicting backends |
| `unpkg.com` CDN dependency for PDF worker | LOW | `Library.tsx`/`PdfReader.tsx` load the PDF.js worker from `//unpkg.com/pdfjs-dist@{version}/...`. If the user is offline or unpkg is blocked by a firewall, the reader will fail to initialize. |

---

## 11. PASSWORD INPUT — Built, Then Reverted Based on Real Usage Feedback

**What happened, in order, honestly:**

1. Originally built an 8-box segmented password input (OTP-code style) for login, register, and the profile change-password form, using the project's existing (previously unused) `input-otp` library.
2. Before building it, I flagged that this layout would prevent normal password-manager autofill, and that typing would advance one box at a time rather than flowing like a normal text field — you confirmed wanting to proceed anyway at the time.
3. After actually using it, you reported the real cost more concretely than I'd anticipated: it required clicking before typing each individual letter, making it frustrating rather than just "missing autofill." That's a stronger problem than the trade-off I'd flagged, and you asked for it removed.
4. **Reverted.** The password fields are now back to a normal, single, continuously-typeable `<input type="password">` with a show/hide eye-icon toggle — exactly the standard behavior you'd expect, and full browser/OS password-manager autofill now works again since there's a single real input element.

**Why this is worth stating plainly:** the original "OTP-box" build wasn't a bug I introduced and then fixed — it was a deliberate design choice you approved in advance, which then turned out to be a worse experience in practice than either of us expected from the trade-offs alone. The fix here is a straightforward revert, not a patch.

**Validation reverted too:** the "exactly 8 characters" rule (which only existed to match the fixed 8-box grid) is back to "at least 8 characters, no upper limit" on both the frontend (`validation.ts`) and backend (`register`/`change-password` endpoints) — there's no UI constraint left that requires matching it exactly.

**Files changed (this round):**
| File | Change |
|---|---|
| `src/components/ui/segmented-password-input.tsx` | Rewritten — now a normal `<input type="password">` with a show/hide toggle, not an OTP-box grid. Kept the same component name/props so `Auth.tsx`/`Profile.tsx` needed zero changes |
| `src/lib/validation.ts` | `validatePassword` reverted to "at least 8 characters" |
| `backend/unified/routers/auth.py` | `register` and `change-password` reverted to "at least 8 characters" |
| `src/components/ui/input-otp.tsx` | Left in place, unused — it's stock shadcn boilerplate, harmless to leave, not worth deleting just to remove a few KB of dead code |

---

## 12. NEW FEATURE — Edge-Style Light-Themed PDF Reader

Rebuilt the Library page's PDF reader from a dark-themed, minimal toolbar (page nav + zoom only) into a light-themed reader matching the layout and feature set of Microsoft Edge's built-in PDF viewer, per your reference screenshot.

**New component:** `src/components/PdfReader.tsx` — kept separate from `Library.tsx` to avoid that file growing unmanageably large; `Library.tsx` now just renders `<PdfReader>` and handles data-loading/progress-saving as before.

**Toolbar features, all functional (not just icons):**
| Feature | How it works |
|---|---|
| Thumbnail sidebar | Renders a low-resolution `<Page>` for every page in a scrollable side panel; click any thumbnail to jump to that page |
| Draw / Erase / Highlight | A transparent `<canvas>` overlaid on the current page, with mouse-drag drawing. **Not persisted** — marks clear on page change or reader close, per the scope we agreed on (no database storage for this) |
| Read aloud | Uses the browser's native `SpeechSynthesis` Web API — no external service, no API key, works offline, reads the current page's extracted text |
| Translate | Calls the free MyMemory translation API directly from the browser (no API key needed) to translate the current page's text into a selected language |
| Search | Highlights matching text directly in the page's text layer via `react-pdf`'s `customTextRenderer` |
| Zoom, Rotate, Two-page view, Fullscreen, Print, Download, Settings | All implemented natively — rotate and two-page view use `react-pdf`'s built-in `rotate`/multi-`<Page>` support; print opens the PDF in a new tab and triggers the browser's native print dialog (more reliable cross-browser than trying to print a `<canvas>` directly) |

**Color theme:** the toolbar is light/white (`bg-white`, `text-gray-700`), not the dark slate-blue from before. One subtlety worth knowing: the shared `Button` component's `ghost` variant hovers to a dark slate background by default (used elsewhere in the app's dark-themed contexts) — the toolbar container has a CSS override (`[&_button:hover]:!bg-orange-50`) so every icon button in this specifically light-themed toolbar hovers to a light orange instead, matching the site's accent color rather than inheriting an inconsistent dark hover state.

**Known limitations (per agreed scope):**
- Draw/erase/highlight marks are in-memory only — they do not survive a page change, browser refresh, or reuse of `ollama pull`-style "come back later" sessions. Building persistence would mean a new database table + endpoints to save/load annotations per user per book per page, which we explicitly deferred.
- The PDF.js worker script loads from the `unpkg.com` CDN at runtime (see Remaining Risks) — requires the browser to have internet access even though the book file itself is served entirely from your own backend.

---

## 13. NEW FEATURE — Local LLM + RAG Chatbot

Replaced the chatbot's hosted-API generation backend (OpenAI GPT-4o / HuggingFace Inference API) with a **local** LLM served by [Ollama](https://ollama.com), running entirely on your own machine.

### What was already there (genuinely good news)

Before touching anything, I read through the existing `backend/ml/chatbot/` package and found the RAG (retrieval-augmented generation) pipeline was **already fully local**: `rag.py` embeds the book catalog with `sentence-transformers` (runs on your machine, no API key, no internet needed after the model downloads once) and stores the vectors in a FAISS index **on disk** — also fully local. OpenAI embeddings were only ever used as an optional upgrade if a key happened to be present; the default path was already local. So "build local RAG" turned out to mean "verify and wire up what's already there," not "build from zero" — and the intent-detection (`intent.py`) and prompt-construction (`prompt.py`) layers were already solid too.

The **only** piece that wasn't local was `llm.py`'s text-generation step, which called OpenAI or HuggingFace's hosted APIs.

### What changed

**1. `backend/ml/chatbot/llm.py`** — rewritten so Ollama (`http://localhost:11434` by default, model `llama3.2` by default — both configurable via `OLLAMA_HOST`/`OLLAMA_MODEL` env vars) is the **only** backend. `llama3.2` (3B parameters) was chosen as the default because it's repeatedly recommended across current sources as the best fit for typical consumer hardware (8GB RAM, no dedicated GPU required) while still giving coherent, useful replies.

**Update — OpenAI and HuggingFace fully removed, not just optional.** An earlier version of this rewrite kept OpenAI/HuggingFace as optional fallbacks, used only if Ollama was unreachable. Per explicit instruction, that's gone now — there is no code path to either anywhere in the project:
- `backend/ml/chatbot/llm.py` — no OpenAI or HuggingFace imports/calls at all; if Ollama is unreachable, the function raises and `chat.py` falls back to the rule-based responses in `fallback.py`, never to a hosted API.
- `backend/ml/chatbot/rag.py` — removed the optional OpenAI-embeddings code path (`_embed_openai`). It was only ever used if `OPENAI_API_KEY` was set; the default (and now only) embedding method is `sentence-transformers`, which was already fully local.
- `backend/ml/nlp/hf_classify.py` — **deleted.** This was a separate, unrelated feature (auto-detecting a book's genre from its title/description) that ran the open-source `transformers` library locally — no API key, no network call, no connection to the chatbot at all. It's named "hf_" only because the underlying model comes from HuggingFace's model hub, not because it called HuggingFace's paid API. You asked for it removed anyway since it carries the name. **Action needed on your end:** since this delivery only includes changed files, not a full project mirror, you'll need to manually delete `backend/ml/nlp/hf_classify.py` from your actual project folder — nothing else imports it, so deleting it won't break anything else.
- `backend/requirements.txt` — removed `openai`, `langchain`, and `langchain-openai` (the latter two were already unused dead dependencies, not referenced anywhere in the codebase even before this change).
- `backend/.env` — replaced the `OPENAI_API_KEY`/`HF_API_TOKEN`/`HF_MODEL_ID` placeholder entries with `OLLAMA_HOST`/`OLLAMA_MODEL`.

**2. One-time setup required on your machine** (this is the one piece I genuinely can't do for you — it needs to run on your computer, not in this conversation):
   ```bash
   # 1. Install Ollama: https://ollama.com/download
   # 2. Pull a model (downloads once, then works offline):
   ollama pull llama3.2
   # 3. Ollama usually starts automatically; if not:
   ollama serve
   ```
   Once that's done, the chatbot will use it automatically — no other configuration needed, since `llm.py` checks whether Ollama is reachable before every request and falls through gracefully (with a clear console message) if it isn't.

**3. RAG index now auto-refreshes.** I found that the FAISS index was previously only rebuilt by a manually-triggered Celery background task (`tasks/ml_train.py`) — meaning a newly added or edited book would be invisible to the chatbot's recommendations until someone ran that task by hand. Rather than require you to also stand up Redis + a Celery worker (real infrastructure, more than what you've been running), I added a synchronous, zero-extra-dependency re-index call directly inside `books.py`'s create/update/delete endpoints (`_refresh_rag_index`). This means the chatbot's book knowledge stays current automatically the moment an admin adds/edits/removes a book, with no extra services required. The original Celery task is untouched and still works if you do set up scheduled background re-indexing later — this is additive, not a replacement.

**4. Security: `/chat/` is now rate-limited** (20 requests/minute per IP — see security audit, finding #3). It remains open to anonymous (non-logged-in) visitors by design, since helping a shopper find a book before they've created an account is a reasonable thing for a storefront assistant to do — but it's no longer completely unlimited, which matters now that each message triggers local model inference (CPU/GPU work) rather than a metered third-party API calls.

**5. Frontend: longer timeout + honest loading state.** The chat request previously shared a global 15-second timeout with every other API call — appropriate for a hosted API, but a local model on CPU-only hardware can legitimately take longer, especially on the first message after the model loads into memory. Added a dedicated client (`chatApi.ts`) with a 90-second timeout, used only for chat, so other fast endpoints still fail fast if something's actually wrong with them. Also replaced the static "Typing..." indicator with one that shows elapsed time and explains what's happening past 5 and 20 seconds, so a longer wait doesn't read as the app being broken.

**Files changed:**
| File | Change |
|---|---|
| `backend/ml/chatbot/llm.py` | Ollama is the ONLY backend — no OpenAI/HuggingFace code paths remain |
| `backend/ml/chatbot/rag.py` | Removed the optional OpenAI-embeddings path; sentence-transformers (local) is now the only embedding method |
| `backend/ml/chatbot/prompt.py` | Fixed a stale docstring comment that referenced "OpenAI chat completions" |
| `backend/ml/nlp/hf_classify.py` | Deleted (unrelated genre-classification feature, removed per request since it had "hf_" in the name) |
| `backend/requirements.txt` | Removed `openai`, `langchain`, `langchain-openai` |
| `backend/.env` | Replaced OpenAI/HuggingFace placeholder vars with `OLLAMA_HOST`/`OLLAMA_MODEL` |
| `backend/unified/limiter.py` (new) | Shared `slowapi` rate-limiter instance |
| `backend/unified/main.py` | Registered the limiter + exception handler + middleware |
| `backend/unified/routers/auth.py` | Rate limits on login/register (see security audit) |
| `backend/unified/routers/chat.py` | Rate limit on `/chat/`; updated docstring explaining the local-LLM architecture |
| `backend/unified/routers/books.py` | Auto-refreshes the RAG index after any book create/update/delete |
| `backend/requirements.txt` | Added `requests` (explicit) and `slowapi` |
| `src/lib/api.ts` | `createClient` now accepts an optional per-client timeout instead of a hardcoded global 15s |
| `src/lib/chatApi.ts` | Dedicated 90s-timeout client for the chat endpoint only |
| `src/components/Chatbot.tsx` | Elapsed-time-aware typing indicator instead of a static "Typing..." message |

### Setup checklist

- [ ] Install Ollama from https://ollama.com/download
- [ ] Run `ollama pull llama3.2` (one-time, ~2GB download)
- [ ] Confirm Ollama is running: `curl http://localhost:11434/api/tags` should return JSON, not a connection error
- [ ] Start the backend as usual (`uvicorn unified.main:app --reload --port 8000`) — no extra flags needed
- [ ] Send a chat message — first reply may take longer (model loading into memory); subsequent replies should be faster
- [ ] If you ever want to swap models, set `OLLAMA_MODEL=<model-name>` in `backend/.env` after pulling that model with `ollama pull <model-name>`

### Honest limitations

- **Reply speed and quality depend entirely on your hardware.** A 3B model on a CPU-only laptop will be noticeably slower and somewhat less sophisticated than what GPT-4o was producing. This is the fundamental trade-off of local-first: zero cost and full privacy, in exchange for being bounded by your own machine's compute.
- **The RAG retrieval quality was not changed** — it was already good before this change; this work was specifically about the generation step.
- I have not built a model-switching UI — changing models currently requires editing `.env` and restarting the backend. If you want a settings page to do this without touching `.env`, that's a small additional piece I can build on request.