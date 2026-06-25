import { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Search,
  Printer,
  Download,
  Maximize,
  Minimize,
  Settings,
  PanelLeft,
  Pencil,
  Eraser,
  Highlighter,
  Volume2,
  VolumeX,
  Languages,
  RotateCw,
  Columns2,
  Square,
} from 'lucide-react';
import { Book } from '../lib/types';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';

/**
 * PdfReader
 * ─────────
 * Light-themed, Edge-PDF-toolbar-style reader. Built on react-pdf
 * (already a project dependency) for rendering, plus a few features
 * layered on top that react-pdf doesn't provide natively:
 *
 *  - Draw / Erase: a transparent <canvas> overlaid on the current page.
 *    Marks are NOT persisted (in-memory only, per the agreed scope) —
 *    they clear when you change page or close the reader.
 *  - Highlight: same canvas overlay, semi-transparent yellow strokes,
 *    same non-persistence caveat.
 *  - Read aloud: uses the browser's native SpeechSynthesis API (no
 *    external service, no API key, works offline) to read the current
 *    page's extracted text.
 *  - Translate: calls the free MyMemory translation API directly from
 *    the browser (no API key required) to translate the current page's
 *    extracted text into the selected language.
 *  - Search: uses react-pdf's customTextRenderer to highlight matches
 *    on the currently rendered page's text layer.
 *  - Thumbnail sidebar: renders a small <Page> for every page at low
 *    scale — react-pdf supports rendering the same PDF document many
 *    times via separate <Document> instances sharing the same file URL.
 */

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Tool = 'none' | 'draw' | 'erase' | 'highlight';
type ViewMode = 'single' | 'two-page';

interface PdfReaderProps {
  book: Book;
  fileUrl: string; // blob: URL, already authenticated/fetched by the caller
  initialPage?: number;
  onClose: () => void;
  onPageChange?: (page: number, totalPages: number) => void;
  sessionLabel?: string; // e.g. formatted elapsed reading time, shown top-right
}

export const PdfReader = ({
  book,
  fileUrl,
  initialPage = 1,
  onClose,
  onPageChange,
  sessionLabel,
}: PdfReaderProps) => {
  // ── Core PDF state ──────────────────────────────────────────
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [scale, setScale] = useState(1.1);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Sidebar ──────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Search ───────────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  // ── Tools: draw / erase / highlight ─────────────────────────
  const [activeTool, setActiveTool] = useState<Tool>('none');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // ── Read aloud ───────────────────────────────────────────────
  const [isReading, setIsReading] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ── Translate ────────────────────────────────────────────────
  const [translateOpen, setTranslateOpen] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [translating, setTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState('es');

  // ── Fullscreen ───────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Page text cache (for read-aloud / translate / search) ───
  const pageTextRef = useRef<string>('');

  useEffect(() => {
    onPageChange?.(pageNumber, numPages);
  }, [pageNumber, numPages]);

  // Clear in-memory draw/highlight marks whenever the page changes —
  // matches the agreed scope (no persistence across pages or reloads).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    // Stop any in-progress read-aloud when changing pages, since the
    // utterance was built from the previous page's text.
    window.speechSynthesis?.cancel();
    setIsReading(false);
    setTranslatedText('');
  }, [pageNumber]);

  // ── Page navigation ──────────────────────────────────────────
  const changePage = (offset: number) => {
    setPageNumber((prev) => {
      const step = viewMode === 'two-page' ? 2 : 1;
      const next = prev + offset * step;
      if (next < 1) return 1;
      if (numPages && next > numPages) return numPages;
      return next;
    });
  };

  // ── Zoom ─────────────────────────────────────────────────────
  const zoomIn = () => setScale((s) => Math.min(3, s + 0.15));
  const zoomOut = () => setScale((s) => Math.max(0.4, s - 0.15));

  // ── Rotate ───────────────────────────────────────────────────
  const rotate = () => setRotation((r) => (r + 90) % 360);

  // ── Fullscreen ───────────────────────────────────────────────
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── Print ────────────────────────────────────────────────────
  const handlePrint = () => {
    // Opens the underlying PDF blob directly in a new tab and triggers the
    // browser's native print dialog — simplest reliable cross-browser path,
    // since react-pdf renders to <canvas>, which doesn't paginate cleanly
    // through window.print() on its own.
    const win = window.open(fileUrl, '_blank');
    win?.addEventListener('load', () => win.print());
  };

  // ── Download ─────────────────────────────────────────────────
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = `${book.title}.pdf`;
    a.click();
  };

  // ── Draw / Erase / Highlight canvas handlers ────────────────
  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'none') return;
    isDrawingRef.current = true;
    lastPointRef.current = getCanvasPoint(e);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeTool === 'none') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const point = getCanvasPoint(e);
    const last = lastPointRef.current;
    if (!last) return;

    if (activeTool === 'erase') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 24;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (activeTool === 'highlight') {
        ctx.strokeStyle = 'rgba(255, 222, 89, 0.45)';
        ctx.lineWidth = 16;
      } else {
        // draw
        ctx.strokeStyle = 'rgba(234, 88, 12, 0.9)'; // matches site's orange accent
        ctx.lineWidth = 2.5;
      }
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.restore();
    }

    lastPointRef.current = point;
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Keep the overlay canvas sized to match the rendered PDF page exactly
  const handlePageRenderSuccess = useCallback(() => {
    const canvas = canvasRef.current;
    const pageEl = containerRef.current?.querySelector(
      '.react-pdf__Page__canvas'
    ) as HTMLCanvasElement | null;
    if (canvas && pageEl) {
      canvas.width = pageEl.width;
      canvas.height = pageEl.height;
      canvas.style.width = pageEl.style.width || `${pageEl.width}px`;
      canvas.style.height = pageEl.style.height || `${pageEl.height}px`;
    }
  }, []);

  // ── Read aloud (native browser SpeechSynthesis — no API/cost) ──
  const toggleReadAloud = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }
    const text = pageTextRef.current.trim();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsReading(true);
  };

  // ── Translate (free MyMemory API, no key required) ─────────
  const translateCurrentPage = async () => {
    const text = pageTextRef.current.trim().slice(0, 480); // MyMemory's free-tier per-request limit
    if (!text) return;

    setTranslating(true);
    setTranslatedText('');
    try {
      const params = new URLSearchParams({
        q: text,
        langpair: `en|${targetLang}`,
      });
      const res = await fetch(
        `https://api.mymemory.translated.net/get?${params}`
      );
      const data = await res.json();
      setTranslatedText(
        data?.responseData?.translatedText || 'Translation unavailable'
      );
    } catch (err) {
      console.error('Translation failed:', err);
      setTranslatedText('Translation failed — please try again.');
    } finally {
      setTranslating(false);
    }
  };

  // ── Extract text from the current page for search/read-aloud/translate ──
  const onPageLoadSuccess = async (page: any) => {
    try {
      const textContent = await page.getTextContent();
      pageTextRef.current = textContent.items
        .map((item: any) => item.str)
        .join(' ');
    } catch {
      pageTextRef.current = '';
    }
  };

  // Highlights search matches in the page's text layer
  const customTextRenderer = useCallback(
    (textItem: { str: string }) => {
      if (!searchText.trim()) return textItem.str;
      const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      return textItem.str.replace(
        regex,
        '<mark style="background:#ffe066;color:inherit;">$1</mark>'
      );
    },
    [searchText]
  );

  const pageWidth = Math.min(820, (typeof window !== 'undefined' ? window.innerWidth : 900) - (sidebarOpen ? 280 : 60));

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-white z-50 flex flex-col"
    >
      {/* ════════════════ TOOLBAR (Edge-style, light theme) ════════════════ */}
      {/* [&_button]:hover:... overrides the shared Button component's default
          "ghost" variant, which hovers to a dark slate background — wrong for
          a light-themed toolbar. This keeps every icon button's hover state
          consistent without needing to edit each Button instance individually. */}
      <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-200 text-gray-700 shadow-sm overflow-x-auto [&_button:hover]:!bg-orange-50 [&_button:hover]:!text-orange-600">
        {/* Sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-orange-50 hover:text-orange-600"
          onClick={() => setSidebarOpen((s) => !s)}
          title="Page thumbnails"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Draw / Erase / Highlight */}
        <Button
          variant={activeTool === 'draw' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setActiveTool((t) => (t === 'draw' ? 'none' : 'draw'))}
          title="Draw"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'erase' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setActiveTool((t) => (t === 'erase' ? 'none' : 'erase'))}
          title="Erase"
        >
          <Eraser className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'highlight' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() =>
            setActiveTool((t) => (t === 'highlight' ? 'none' : 'highlight'))
          }
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </Button>
        {activeTool !== 'none' && (
          <Button variant="ghost" size="sm" onClick={clearCanvas} className="text-xs">
            Clear marks
          </Button>
        )}

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Read aloud */}
        <Button
          variant={isReading ? 'secondary' : 'ghost'}
          size="icon"
          onClick={toggleReadAloud}
          title="Read aloud"
        >
          {isReading ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>

        {/* Translate */}
        <DropdownMenu open={translateOpen} onOpenChange={setTranslateOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Translate">
              <Languages className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 p-3">
            <DropdownMenuLabel className="px-0">Translate this page</DropdownMenuLabel>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full border rounded-md text-sm p-1.5 mb-2"
            >
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ar">Arabic</option>
            </select>
            <Button
              size="sm"
              className="w-full mb-2"
              onClick={translateCurrentPage}
              disabled={translating}
            >
              {translating ? 'Translating…' : 'Translate page'}
            </Button>
            {translatedText && (
              <p className="text-xs text-gray-600 max-h-40 overflow-y-auto border-t pt-2">
                {translatedText}
              </p>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        {/* Zoom */}
        <Button variant="ghost" size="icon" onClick={zoomOut} title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs w-10 text-center tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="ghost" size="icon" onClick={zoomIn} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>

        {/* Page indicator + nav */}
        <div className="flex items-center gap-1 mx-2">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-orange-50 hover:text-orange-600"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2 py-1 border rounded-md bg-gray-50 tabular-nums">
            {pageNumber}
          </span>
          <span className="text-sm text-gray-500">of {numPages || '–'}</span>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-orange-50 hover:text-orange-600"
            onClick={() => changePage(1)}
            disabled={numPages > 0 && pageNumber >= numPages}
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Rotate */}
        <Button variant="ghost" size="icon" onClick={rotate} title="Rotate">
          <RotateCw className="h-4 w-4" />
        </Button>

        {/* Two-page / single-page toggle */}
        <Button
          variant={viewMode === 'two-page' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() =>
            setViewMode((v) => (v === 'two-page' ? 'single' : 'two-page'))
          }
          title="Two-page view"
        >
          {viewMode === 'two-page' ? (
            <Columns2 className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </Button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Search */}
        <Button
          variant={searchOpen ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setSearchOpen((s) => !s)}
          title="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Print */}
        <Button variant="ghost" size="icon" onClick={handlePrint} title="Print">
          <Printer className="h-4 w-4" />
        </Button>

        {/* Download */}
        <Button variant="ghost" size="icon" onClick={handleDownload} title="Download">
          <Download className="h-4 w-4" />
        </Button>

        {/* Fullscreen */}
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-orange-50 hover:text-orange-600"
          onClick={toggleFullscreen}
          title="Fullscreen"
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </Button>

        {/* Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Reader settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setScale(1)}>
              Reset zoom to 100%
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRotation(0)}>
              Reset rotation
            </DropdownMenuItem>
            <DropdownMenuItem onClick={clearCanvas}>
              Clear all marks on this page
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {sessionLabel && (
          <span className="text-xs text-gray-400 mr-2 tabular-nums">
            {sessionLabel}
          </span>
        )}

        <Button variant="ghost" size="icon" onClick={onClose} title="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search bar (slides down when active) */}
      {searchOpen && (
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search in this page…"
            className="flex-1 max-w-sm text-sm border rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-orange-300"
          />
          <span className="text-xs text-gray-400">
            Searches the currently visible page
          </span>
        </div>
      )}

      {/* ════════════════ BODY: sidebar + page ════════════════ */}
      <div className="flex-1 flex overflow-hidden bg-gray-50">
        {/* Thumbnail sidebar */}
        {sidebarOpen && (
          <div className="w-64 border-r border-gray-200 bg-white overflow-y-auto p-3 space-y-3">
            {numPages === 0 && (
              <p className="text-xs text-gray-400">Loading thumbnails…</p>
            )}
            {Array.from({ length: numPages }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPageNumber(pageNum)}
                  className={`w-full border rounded-md p-1 transition-all ${
                    pageNum === pageNumber
                      ? 'border-orange-400 ring-1 ring-orange-300'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Document file={fileUrl} loading={null}>
                    <Page
                      pageNumber={pageNum}
                      width={220}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                  <span className="block text-center text-xs text-gray-400 mt-1">
                    {pageNum}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main page view */}
        <div className="flex-1 overflow-auto flex justify-center p-6">
          {loadError && (
            <div className="text-red-500 self-center text-center max-w-md">
              {loadError}
            </div>
          )}

          {!loadError && (
            <Document
              file={fileUrl}
              onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              onLoadError={(err) => {
                console.error('react-pdf load error:', err);
                setLoadError('This file could not be opened as a PDF.');
              }}
              loading={<div className="text-gray-400 self-center">Loading book…</div>}
            >
              <div className="relative inline-block">
                <Page
                  key={`p${pageNumber}-r${rotation}-s${searchText}`}
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  width={viewMode === 'two-page' ? pageWidth / 2 - 8 : pageWidth}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  customTextRenderer={customTextRenderer}
                  onLoadSuccess={onPageLoadSuccess}
                  onRenderSuccess={handlePageRenderSuccess}
                  className="shadow-xl bg-white"
                />
                {/* Draw/erase/highlight overlay — sized to match the page canvas */}
                <canvas
                  ref={canvasRef}
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onMouseLeave={handlePointerUp}
                  className="absolute top-0 left-0"
                  style={{
                    cursor: activeTool !== 'none' ? 'crosshair' : 'default',
                    pointerEvents: activeTool !== 'none' ? 'auto' : 'none',
                  }}
                />
              </div>

              {viewMode === 'two-page' && numPages > pageNumber && (
                <Page
                  pageNumber={pageNumber + 1}
                  scale={scale}
                  rotate={rotation}
                  width={pageWidth / 2 - 8}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-xl bg-white ml-2 inline-block"
                />
              )}
            </Document>
          )}
        </div>
      </div>
    </div>
  );
};