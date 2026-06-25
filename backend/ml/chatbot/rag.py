"""
RAG (Retrieval-Augmented Generation) pipeline over the book catalog.
Uses FAISS vector store + sentence-transformers — entirely local, no
API key, no network call, runs on your own machine.

Build index:  python -m ml.chatbot.rag
"""
import os
import json
import numpy as np
from pathlib import Path
from typing import List

MODEL_DIR  = Path(os.getenv("ML_MODEL_DIR", "./ml/models"))
INDEX_PATH = str(MODEL_DIR / "catalog.faiss")
META_PATH  = str(MODEL_DIR / "catalog_meta.json")

EMBED_MODEL = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")   # fast + good quality

_index = None
_meta  = None


# ── Embedding helper (local only — sentence-transformers) ───────────────────
def _embed(texts: List[str]) -> np.ndarray:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(EMBED_MODEL)
    return model.encode(texts, show_progress_bar=False, normalize_embeddings=True)


def _book_to_text(book: dict) -> str:
    return (
        f"Title: {book.get('title', '')}\n"
        f"Author: {book.get('author', '')}\n"
        f"Genre: {book.get('genre', '')}\n"
        f"Description: {book.get('description', '')}"
    ).strip()


# ── Build / load index ────────────────────────────────────────────────────────
def build_index(books: List[dict], index_path: str = INDEX_PATH) -> None:
    """Embed all books and save FAISS index + metadata to disk."""
    import faiss

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    texts = [_book_to_text(b) for b in books]
    print(f"[rag] Embedding {len(texts)} books…")
    embeddings = _embed(texts).astype(np.float32)

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)    # Inner Product = cosine on normalised vecs
    index.add(embeddings)
    faiss.write_index(index, index_path)

    meta_path = index_path.replace(".faiss", "_meta.json")
    with open(meta_path, "w") as f:
        json.dump(books, f)

    print(f"[rag] Index saved → {index_path}  ({len(books)} books, dim={dim})")


def _load_index():
    global _index, _meta
    if _index is None:
        import faiss
        if not os.path.exists(INDEX_PATH):
            raise FileNotFoundError(
                f"FAISS index not found at {INDEX_PATH}. Run build_index() first."
            )
        _index = faiss.read_index(INDEX_PATH)
        with open(META_PATH) as f:
            _meta = json.load(f)
    return _index, _meta


# ── Retrieve ──────────────────────────────────────────────────────────────────
def retrieve_books(query: str, top_k: int = 3) -> List[dict]:
    """
    Find the top-k most relevant books for a natural-language query.
    Returns list of book dicts.
    """
    try:
        index, meta = _load_index()
        q_vec = _embed([query]).astype(np.float32)
        distances, indices = index.search(q_vec, top_k)
        results = []
        for idx, dist in zip(indices[0], distances[0]):
            if 0 <= idx < len(meta):
                book = dict(meta[idx])
                book["relevance_score"] = float(dist)
                results.append(book)
        return results
    except FileNotFoundError:
        # RAG not set up yet — return empty
        return []
    except Exception as e:
        print(f"[rag] Retrieval error: {e}")
        return []


if __name__ == "__main__":
    # Build from DB
    from ml.data.db_connect import get_books_df
    books_df = get_books_df()
    books = books_df.fillna("").to_dict(orient="records")
    build_index(books)
    print("\nTest query: 'science fiction space adventure'")
    results = retrieve_books("science fiction space adventure", top_k=3)
    for r in results:
        print(f"  {r['title']} by {r['author']}  (score={r['relevance_score']:.4f})")