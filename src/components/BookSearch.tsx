// src/components/BookSearch.tsx
// LibGen book search + one-click download into the user's library

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  searchLibGen,
  fetchLibGenBook,
  pollUntilDone,
  type LibGenBook,
  type TaskStatus,
} from '@/lib/libgenApi';

// ── tiny helpers ──────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function fmtSize(raw: string): string {
  // LibGen gives "3 Mb", "512 Kb", etc. — just pass through
  return raw || '—';
}

// ── per-result download state ─────────────────────────────────────────────────

type DownloadState =
  | { phase: 'idle' }
  | { phase: 'fetching' }                               // waiting for task_id
  | { phase: 'progress'; message: string; percent: number }
  | { phase: 'done';    bookId: number }
  | { phase: 'error';   message: string };

// ── Toast (lightweight inline — no external dep required) ─────────────────────

interface ToastProps { message: string; type: 'success' | 'error'; onClose: () => void }
function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3 shadow-lg text-white text-sm font-medium transition-all
        ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}
    >
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}

// ── ResultCard ────────────────────────────────────────────────────────────────

interface ResultCardProps {
  book: LibGenBook;
  dlState: DownloadState;
  onGet: (book: LibGenBook) => void;
  onGoToLibrary: () => void;
}

function ResultCard({ book, dlState, onGet, onGoToLibrary }: ResultCardProps) {
  const extColor: Record<string, string> = {
    pdf:  'bg-red-100 text-red-700',
    epub: 'bg-blue-100 text-blue-700',
    djvu: 'bg-amber-100 text-amber-700',
    fb2:  'bg-purple-100 text-purple-700',
  };
  const extCls = extColor[book.extension?.toLowerCase()] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* cover */}
      <div className="flex-shrink-0 w-16 h-20 bg-gray-100 rounded overflow-hidden">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">📖</div>
        )}
      </div>

      {/* meta */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate" title={book.title}>{book.title}</p>
        <p className="text-sm text-gray-500 truncate">{book.author || 'Unknown author'}</p>
        <div className="mt-1 flex flex-wrap gap-1 text-xs">
          {book.year     && <span className="bg-gray-100 text-gray-600 rounded px-2 py-0.5">{book.year}</span>}
          {book.pages    && <span className="bg-gray-100 text-gray-600 rounded px-2 py-0.5">{book.pages} pp</span>}
          {book.language && <span className="bg-gray-100 text-gray-600 rounded px-2 py-0.5">{book.language}</span>}
          <span className="bg-gray-100 text-gray-600 rounded px-2 py-0.5">{fmtSize(book.size)}</span>
          {book.extension && (
            <span className={`rounded px-2 py-0.5 uppercase font-bold ${extCls}`}>{book.extension}</span>
          )}
        </div>
      </div>

      {/* action */}
      <div className="flex-shrink-0 flex flex-col items-end justify-center gap-2 min-w-[120px]">
        {dlState.phase === 'idle' && (
          <button
            onClick={() => onGet(book)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Get Book
          </button>
        )}

        {dlState.phase === 'fetching' && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Spinner /> Starting…
          </span>
        )}

        {dlState.phase === 'progress' && (
          <div className="w-full text-right">
            <span className="text-xs text-indigo-600 flex items-center justify-end gap-1 mb-1">
              <Spinner /> {dlState.message}
            </span>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${dlState.percent}%` }}
              />
            </div>
          </div>
        )}

        {dlState.phase === 'done' && (
          <button
            onClick={onGoToLibrary}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Go to Library →
          </button>
        )}

        {dlState.phase === 'error' && (
          <div className="text-right">
            <p className="text-xs text-red-600 mb-1">{dlState.message}</p>
            <button
              onClick={() => onGet(book)}
              className="text-xs text-indigo-600 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface BookSearchProps {
  /** If true renders as full page; if false renders as embedded panel */
  fullPage?: boolean;
}

export default function BookSearch({ fullPage = true }: BookSearchProps) {
  const navigate = useNavigate();

  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<LibGenBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // per-MD5 download state map
  const [dlStates, setDlStates] = useState<Record<string, DownloadState>>({});

  // toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query.trim(), 600);

  // ── auto-focus on mount ────────────────────────────────────────────────────
  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── search whenever debounced query changes ───────────────────────────────
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 3) {
      setResults([]);
      setSearched(false);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await searchLibGen(debouncedQuery, 20);
        if (!cancelled) {
          setResults(res.results);
          setSearched(true);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // ── setDlState helper ─────────────────────────────────────────────────────
  const setDl = useCallback((md5: string, state: DownloadState) => {
    setDlStates(prev => ({ ...prev, [md5]: state }));
  }, []);

  // ── handle "Get Book" ─────────────────────────────────────────────────────
  const handleGet = useCallback(async (book: LibGenBook) => {
    const key = book.md5;
    setDl(key, { phase: 'fetching' });

    try {
      const taskId = await fetchLibGenBook(book);

      setDl(key, { phase: 'progress', message: 'Starting download…', percent: 0 });

      const final: TaskStatus = await pollUntilDone(
        taskId,
        (status) => {
          if (status.state === 'PROGRESS') {
            setDl(key, {
              phase:   'progress',
              message: status.message,
              percent: status.percent ?? 0,
            });
          }
        },
      );

      setDl(key, { phase: 'done', bookId: final.book_id! });
      setToast({ message: `"${book.title}" added to your library!`, type: 'success' });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed.';
      setDl(key, { phase: 'error', message: msg });
      setToast({ message: msg, type: 'error' });
    }
  }, [setDl]);

  // ── render ────────────────────────────────────────────────────────────────
  const wrapCls = fullPage
    ? 'mx-auto max-w-3xl px-4 py-10'
    : 'w-full';

  return (
    <div className={wrapCls}>
      {/* heading */}
      {fullPage && (
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Find a Book</h1>
          <p className="mt-1 text-gray-500 text-sm">
            Search millions of books and add them instantly to your library.
          </p>
        </div>
      )}

      {/* search bar */}
      <div className="relative mb-6">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg select-none">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a book title, author or ISBN…"
          className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-3 text-sm shadow-sm
            placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500">
            <Spinner />
          </span>
        )}
      </div>

      {/* error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* hint before first search */}
      {!searched && !loading && !error && (
        <div className="text-center py-16 text-gray-400 select-none">
          <div className="text-5xl mb-3">📚</div>
          <p className="text-sm">Start typing to search the catalog.</p>
        </div>
      )}

      {/* no results */}
      {searched && results.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-400 select-none">
          <div className="text-4xl mb-3">🔎</div>
          <p className="text-sm">No results found for <em>"{debouncedQuery}"</em>.</p>
          <p className="text-xs mt-1">Try a different title or author name.</p>
        </div>
      )}

      {/* results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 text-right">{results.length} result{results.length !== 1 && 's'}</p>
          {results.map((book) => (
            <ResultCard
              key={book.md5}
              book={book}
              dlState={dlStates[book.md5] ?? { phase: 'idle' }}
              onGet={handleGet}
              onGoToLibrary={() => navigate('/library')}
            />
          ))}
        </div>
      )}

      {/* toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
