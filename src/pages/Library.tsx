import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Download, Clock } from 'lucide-react';

import { Book } from '../lib/types';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Progress } from '../components/ui/progress';
import { PdfReader } from '../components/PdfReader';

// APIs (Code 1 style)
import { getOrders } from '../lib/ordersApi';
import { getBooks, downloadBook, downloadBookUrl } from '../lib/booksApi';
import { getAccessToken } from '../lib/api';

// WebSocket (Code 1 feature kept)
import { ReadingSessionWS } from '../lib/chatApi';

interface LibraryBook {
  book: Book;
  purchasedAt: string;
  progress?: any;
}

// helper from Code 2
const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
};

export const Library = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>([]);
  const [readerBook, setReaderBook] = useState<Book | null>(null);

  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionStartRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const wsRef = useRef<ReadingSessionWS | null>(null);

  // ─────────────────────────────────────────────
  // PDF VIEWER STATE
  // ─────────────────────────────────────────────
  // PdfReader (components/PdfReader.tsx) now owns pageNumber/numPages/scale
  // internally. Library.tsx only needs the latest page/total for saving
  // reading progress to localStorage on close, supplied via onPageChange.
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const pdfBlobUrlRef = useRef<string | null>(null); // mirrors pdfBlobUrl for unmount cleanup
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);

  // ─────────────────────────────────────────────
  // LOAD LIBRARY (API version + Code 2 progress support)
  // ─────────────────────────────────────────────
  const loadLibrary = async () => {
    if (!user) return;

    try {
      const orders = await getOrders();

      // FIXED: getBooks returns BooksResponse, not Book[]
      // FIXED: per_page capped at 100 — backend enforces Query(..., le=100);
      // requesting 200 caused a 422 Unprocessable Entity and broke the page.
      const { books } = await getBooks({
        per_page: 100,
      });

      const userOrders = orders.filter(o => o.userId === user.id);

      const seen = new Set<string>();
      const result: LibraryBook[] = [];

      userOrders.forEach(order => {

        // FIXED: removed completed status filter

        order.items.forEach(item => {
          if (seen.has(item.bookId)) return;
          seen.add(item.bookId);

          const book = books.find(b => b.id === item.bookId);

          if (book) {
            result.push({
              book,
              purchasedAt: order.createdAt,
              progress: getStoredProgress(user.id, book.id),
            });
          }
        });
      });

      // Also surface free books even without a purchase order, since they
      // don't require checkout — matches the backend's is_free bypass on
      // the /download endpoint.
      books
        .filter(b => b.isFree && !seen.has(b.id))
        .forEach(b => {
          seen.add(b.id);
          result.push({
            book: b,
            purchasedAt: b.createdAt,
            progress: getStoredProgress(user.id, b.id),
          });
        });

      setLibraryBooks(result);
    } catch (err) {
      // Log the real error so the actual cause (400/401/422/etc.) is visible
      // in DevTools console instead of only seeing a generic toast.
      console.error('Failed to load library:', err);
      toast.error('Failed to load library');
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadLibrary();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pdfBlobUrlRef.current) URL.revokeObjectURL(pdfBlobUrlRef.current);
    };
  }, [user]);

  // ─────────────────────────────────────────────
  // PROGRESS (from Code 2 localStorage system)
  // ─────────────────────────────────────────────
  const getStoredProgress = (userId: string, bookId: string) => {
    const key = `reading_progress_${userId}_${bookId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  };

  const saveProgress = (bookId: string, seconds: number, currentPage?: number, totalPages?: number) => {
    if (!user) return;

    const key = `reading_progress_${user.id}_${bookId}`;
    const existing = JSON.parse(
      localStorage.getItem(key) ||
        '{"totalSeconds":0,"progressPercentage":0,"currentPage":0,"totalPages":100}'
    );

    const tp = totalPages ?? existing.totalPages ?? 100;
    const cp = currentPage ?? existing.currentPage ?? 0;

    const updated = {
      ...existing,
      totalSeconds: (existing.totalSeconds || 0) + seconds,
      currentPage: cp,
      totalPages: tp,
      progressPercentage: tp > 0 ? Math.min(100, Math.round((cp / tp) * 100)) : (existing.progressPercentage || 0),
    };

    localStorage.setItem(key, JSON.stringify(updated));
  };

  // ─────────────────────────────────────────────
  // DOWNLOAD (API + fallback merged)
  // ─────────────────────────────────────────────
  const handleDownload = async (book: Book) => {
    try {
      await downloadBook(book.id, book.title);
      toast.success(`Downloading "${book.title}"`);
    } catch {
      toast.error('Download failed');
    }
  };

  // ─────────────────────────────────────────────
  // FETCH PDF AS AUTHENTICATED BLOB
  // ─────────────────────────────────────────────
  // The /download endpoint requires a Bearer token and verifies purchase
  // ownership, so a plain <iframe src="..."> can't be used directly — the
  // browser has no way to attach an Authorization header to that request.
  // Instead we fetch the file ourselves (same pattern as downloadBook) and
  // hand react-pdf a local blob: URL.
  const fetchPdfBlob = async (book: Book) => {
    setPdfLoading(true);
    setPdfError(null);
    if (pdfBlobUrlRef.current) {
      URL.revokeObjectURL(pdfBlobUrlRef.current);
      pdfBlobUrlRef.current = null;
    }
    setPdfBlobUrl(null);

    try {
      const token = getAccessToken();
      const res = await fetch(downloadBookUrl(book.id), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('You have not purchased this book');
        }
        if (res.status === 404) {
          throw new Error('No file has been uploaded for this book yet');
        }
        throw new Error(`Failed to load file (status ${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      pdfBlobUrlRef.current = url;
      setPdfBlobUrl(url);
    } catch (err: any) {
      console.error('Failed to fetch book PDF:', err);
      setPdfError(err?.message || 'Failed to load this book\u2019s file');
    } finally {
      setPdfLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // OPEN READER (WebSocket + timer from Code 2)
  // ─────────────────────────────────────────────
  const openReader = (book: Book) => {
    if (!book.fileUrl) {
      toast.error('This book has no file uploaded yet. Please contact support.');
      return;
    }

    setReaderBook(book);
    setSessionSeconds(0);
    setNumPages(0);

    const stored = getStoredProgress(user!.id, book.id);
    setPageNumber(stored?.currentPage > 0 ? stored.currentPage : 1);

    sessionStartRef.current = Date.now();

    wsRef.current = new ReadingSessionWS();
    wsRef.current.connect(user!.id, book.id);

    timerRef.current = setInterval(() => {
      setSessionSeconds(
        Math.floor((Date.now() - sessionStartRef.current) / 1000)
      );
    }, 1000);

    fetchPdfBlob(book);
  };

  // ─────────────────────────────────────────────
  // CLOSE READER (save progress added from Code 2)
  // ─────────────────────────────────────────────
  const closeReader = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    wsRef.current?.disconnect();
    wsRef.current = null;

    if (readerBook) {
      const elapsed = Math.floor(
        (Date.now() - sessionStartRef.current) / 1000
      );

      saveProgress(readerBook.id, elapsed, pageNumber, numPages);

      if (elapsed > 5) {
        toast.success(`Session saved: ${formatTime(elapsed)}`);
      }
    }

    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      pdfBlobUrlRef.current = null;
      setPdfBlobUrl(null);
    }
    setPdfError(null);
    setReaderBook(null);
    setSessionSeconds(0);
    loadLibrary();
  };

  // Called by PdfReader whenever the page changes, so we always have the
  // latest page/total on hand to persist into localStorage on close.
  const handlePageChange = (page: number, total: number) => {
    setPageNumber(page);
    setNumPages(total);
    if (readerBook) saveProgress(readerBook.id, 0, page, total);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">My Library</h1>

        {libraryBooks.length === 0 ? (
          <p className="text-gray-500">No books yet</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {libraryBooks.map(lb => {
              const prog = lb.progress;
              const pct = prog?.progressPercentage ?? 0;
              const totalSecs = prog?.totalSeconds ?? 0;

              return (
                <Card key={lb.book.id}>
                  <CardContent className="p-4">
                    <img
                      src={lb.book.coverImage}
                      className="w-full h-60 object-cover rounded"
                    />

                    <h3 className="mt-2 font-semibold">
                      {lb.book.title}
                    </h3>

                    {/* Progress (Code 2 feature added) */}
                    <div className="my-2">
                      <div className="flex justify-between text-xs">
                        <span>
                          {pct > 0 ? `${pct}% read` : 'Not started'}
                        </span>
                        {totalSecs > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(totalSecs)}
                          </span>
                        )}
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button onClick={() => openReader(lb.book)} disabled={!lb.book.fileUrl}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        {lb.book.fileUrl ? 'Read' : 'No file yet'}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => handleDownload(lb.book)}
                        disabled={!lb.book.fileUrl}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* READER — Edge-style light-themed PDF reader with full toolbar */}
      {readerBook && pdfBlobUrl && !pdfError && (
        <PdfReader
          book={readerBook}
          fileUrl={pdfBlobUrl}
          initialPage={pageNumber}
          onClose={closeReader}
          onPageChange={handlePageChange}
          sessionLabel={formatTime(sessionSeconds)}
        />
      )}

      {/* Loading / error states while fetching the book's file, shown as a
          simple full-screen overlay until PdfReader itself can take over */}
      {readerBook && (pdfLoading || pdfError) && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-4">
          {pdfLoading && (
            <p className="text-gray-500">Loading book…</p>
          )}
          {pdfError && (
            <>
              <p className="text-red-500 text-center max-w-md px-4">{pdfError}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => fetchPdfBlob(readerBook)}>
                  Try again
                </Button>
                <Button variant="ghost" size="sm" onClick={closeReader}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};