import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  Menu
} from 'lucide-react';
import { db } from '../lib/database';
import { Book, ReadingProgress, Bookmark as BookmarkType } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { BookmarkPanel } from '../components/BookmarkPanel';
import 'pdfjs-dist/web/pdf_viewer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const BookReader = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pageInput, setPageInput] = useState<string>('1');
  const [showBookmarks, setShowBookmarks] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);

  const loadBookmarks = () => {
    if (!user || !bookId) return;
    const userBookmarks = db.getUserBookBookmarks(user.id, bookId);
    setBookmarks(userBookmarks);
  };

  useEffect(() => {
    if (!user || !bookId) {
      navigate('/auth');
      return;
    }

    // Load book
    const books = db.getBooks();
    const foundBook = books.find(b => b.id === bookId);
    
    if (!foundBook) {
      toast.error('Book not found');
      navigate('/library');
      return;
    }

    // Check if user owns the book
    const orders = db.getOrders();
    const userOrders = orders.filter(order => order.userId === user.id);
    const hasBook = userOrders.some(order => 
      order.items.some(item => item.bookId === bookId)
    );

    if (!hasBook) {
      toast.error('You need to purchase this book first');
      navigate('/books/' + bookId);
      return;
    }

    setBook(foundBook);

    // Load reading progress
    const progress = db.getUserBookProgress(user.id, bookId);
    if (progress) {
      setPageNumber(progress.currentPage);
      setPageInput(progress.currentPage.toString());
    }

    // Load bookmarks
    loadBookmarks();
  }, [user, bookId, navigate]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    
    // Save total pages if not already saved
    if (user && bookId) {
      const progress = db.getUserBookProgress(user.id, bookId);
      if (!progress || progress.totalPages !== numPages) {
        saveProgress(pageNumber, numPages);
      }
    }
  };

  const saveProgress = (currentPage: number, totalPages: number) => {
    if (!user || !bookId) return;

    const progressPercentage = Math.round((currentPage / totalPages) * 100);
    const progress: ReadingProgress = {
      id: `progress-${user.id}-${bookId}`,
      userId: user.id,
      bookId,
      currentPage,
      totalPages,
      lastRead: new Date().toISOString(),
      progressPercentage,
    };

    db.saveReadingProgress(progress);
  };

  const changePage = (offset: number) => {
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
      setPageInput(newPage.toString());
      saveProgress(newPage, numPages);
    }
  };

  const goToPage = () => {
    const page = parseInt(pageInput);
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
      saveProgress(page, numPages);
    } else {
      toast.error(`Please enter a page number between 1 and ${numPages}`);
      setPageInput(pageNumber.toString());
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setScale(prev => {
      if (direction === 'in') return Math.min(prev + 0.2, 3.0);
      return Math.max(prev - 0.2, 0.5);
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleBookmark = () => {
    if (!user || !bookId) return;

    const existingBookmark = bookmarks.find(b => b.page === pageNumber);
    
    if (existingBookmark) {
      db.removeBookmark(existingBookmark.id);
      toast.success('Bookmark removed');
    } else {
      const newBookmark: BookmarkType = {
        id: `bookmark-${Date.now()}`,
        userId: user.id,
        bookId,
        page: pageNumber,
        note: '',
        createdAt: new Date().toISOString(),
      };
      db.addBookmark(newBookmark);
      toast.success('Bookmark added');
    }
    
    loadBookmarks();
  };

  const isBookmarked = bookmarks.some(b => b.page === pageNumber);

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Create a mock PDF URL (in production, this would be the actual PDF file)
  const pdfUrl = `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header Controls */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/library')}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
          <div className="text-sm">
            <div className="font-semibold">{book.title}</div>
            <div className="text-gray-400">{book.author}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBookmarks(!showBookmarks)}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Menu className="h-4 w-4 mr-2" />
            Bookmarks ({bookmarks.length})
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Main Reader Area */}
        <div className="flex-1 flex flex-col items-center">
          {/* Toolbar */}
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 w-full flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
              className="text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && goToPage()}
                className="w-16 text-center bg-gray-700 border-gray-600 text-white"
                min={1}
                max={numPages}
              />
              <span className="text-gray-400">/ {numPages || '?'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPage}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                Go
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => changePage(1)}
              disabled={pageNumber >= numPages}
              className="text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="border-l border-gray-700 h-6 mx-2" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleZoom('out')}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <span className="text-gray-400 text-sm">{Math.round(scale * 100)}%</span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleZoom('in')}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <div className="border-l border-gray-700 h-6 mx-2" />

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleBookmark}
              className={`hover:bg-gray-700 ${
                isBookmarked ? 'text-amber-500' : 'text-gray-300 hover:text-white'
              }`}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-auto p-8 flex justify-center">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="text-gray-400">Loading PDF...</div>
              }
              error={
                <div className="text-red-400">
                  Failed to load PDF. This is a demo with a sample PDF.
                  <br />
                  In production, your purchased book would be displayed here.
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-2xl"
              />
            </Document>
          </div>
        </div>

        {/* Bookmark Sidebar */}
        {showBookmarks && (
          <BookmarkPanel
            bookmarks={bookmarks}
            currentPage={pageNumber}
            onBookmarkClick={(page) => {
              setPageNumber(page);
              setPageInput(page.toString());
              saveProgress(page, numPages);
            }}
            onBookmarkDelete={(bookmarkId) => {
              db.removeBookmark(bookmarkId);
              loadBookmarks();
              toast.success('Bookmark deleted');
            }}
            onClose={() => setShowBookmarks(false)}
          />
        )}
      </div>
    </div>
  );
};