import {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';

import { useSearchParams } from 'react-router-dom';

import {
  BookOpen,
  X,
} from 'lucide-react';

import Fuse from 'fuse.js';

import {
  getBooks,
  BooksResponse,
} from '../lib/booksApi';

import { useCart } from '../contexts/CartContext';

import {
  addToWishlist,
} from '../lib/wishlistApi';

import { Book } from '../lib/types';

import {
  EnhancedBookCard,
} from '../components/EnhancedBookCard';

import { Button } from '../components/ui/button';

import { Input } from '../components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';

import {
  Badge,
} from '../components/ui/badge';

import {
  Pagination,
} from '../components/Pagination';

import {
  useAuth,
} from '../contexts/AuthContext';

import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────
// Loading Skeleton
// ─────────────────────────────────────────────────────────────

const BookSkeleton = () => (
  <div className="rounded-xl border border-orange-100 bg-white overflow-hidden animate-pulse">
    <div className="aspect-[3/4] bg-orange-100" />

    <div className="p-4 space-y-3">
      <div className="h-3 bg-orange-100 rounded w-1/3" />

      <div className="h-4 bg-orange-100 rounded w-4/5" />

      <div className="h-3 bg-orange-100 rounded w-1/2" />

      <div className="h-5 bg-orange-100 rounded w-1/4" />

      <div className="h-9 bg-orange-200 rounded-lg" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const Books = () => {
  const [searchParams] = useSearchParams();

  const { user } = useAuth();
  const { addToCart } = useCart();

  // ───────────────────────────────────────────────────────────
  // State
  // ───────────────────────────────────────────────────────────

  const [books, setBooks] = useState<Book[]>([]);

  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );

  const [searchInput, setSearchInput] = useState(
    searchParams.get('search') || ''
  );

  const [selectedGenre, setSelectedGenre] =
    useState('all');

  const [selectedAuthor, setSelectedAuthor] =
    useState('all');

  const [selectedRating, setSelectedRating] =
    useState('all');

  const [sortBy, setSortBy] =
    useState('title');

  const [priceRange, setPriceRange] =
    useState({
      min: '',
      max: '',
    });

  const [searchSuggestions, setSearchSuggestions] =
    useState<string[]>([]);

  const [showSuggestions, setShowSuggestions] =
    useState(false);

  const [searchHistory, setSearchHistory] =
    useState<string[]>([]);

  const [activeFilters, setActiveFilters] =
    useState<string[]>([]);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [itemsPerPage, setItemsPerPage] =
    useState(12);

  // ───────────────────────────────────────────────────────────
  // Derived Data
  // ───────────────────────────────────────────────────────────

  const genres = useMemo(() => {
    return [
      ...new Set(
        books
          .map(book => book.genre)
          .filter(Boolean)
      ),
    ];
  }, [books]);

  const authors = useMemo(() => {
    return [
      ...new Set(
        books
          .map(book => book.author)
          .filter(Boolean)
      ),
    ];
  }, [books]);

  // ───────────────────────────────────────────────────────────
  // Fuse Search
  // ───────────────────────────────────────────────────────────

  const fuse = useMemo(() => {
    return new Fuse(books, {
      keys: [
        'title',
        'author',
        'description',
        'genre',
      ],
      threshold: 0.3,
    });
  }, [books]);

  // ───────────────────────────────────────────────────────────
  // Fetch Books
  // ───────────────────────────────────────────────────────────

  const fetchBooks = useCallback(async () => {
    setLoading(true);

    try {
      const params: Record<string, any> = {
        page: currentPage,
        per_page: itemsPerPage,
        sort_by: sortBy,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (selectedGenre !== 'all') {
        params.genre = selectedGenre;
      }

      if (selectedAuthor !== 'all') {
        params.author = selectedAuthor;
      }

      if (selectedRating !== 'all') {
        params.min_rating =
          parseFloat(selectedRating);
      }

      if (priceRange.min) {
        params.min_price =
          parseFloat(priceRange.min);
      }

      if (priceRange.max) {
        params.max_price =
          parseFloat(priceRange.max);
      }

      const res: BooksResponse =
        await getBooks(params);

      setBooks(res.books);

      setTotal(res.total);
    } catch (error) {
      console.error(error);

      toast.error(
        'Failed to load books'
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    sortBy,
    searchQuery,
    selectedGenre,
    selectedAuthor,
    selectedRating,
    priceRange,
  ]);

  // ───────────────────────────────────────────────────────────
  // Effects
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedGenre,
    selectedAuthor,
    selectedRating,
    sortBy,
    priceRange,
  ]);

  useEffect(() => {
    updateActiveFilters();
  }, [
    selectedGenre,
    selectedAuthor,
    selectedRating,
    priceRange,
  ]);

  // ───────────────────────────────────────────────────────────
  // Filters
  // ───────────────────────────────────────────────────────────

  const updateActiveFilters = () => {
    const filters: string[] = [];

    if (selectedGenre !== 'all') {
      filters.push(
        `Genre: ${selectedGenre}`
      );
    }

    if (selectedAuthor !== 'all') {
      filters.push(
        `Author: ${selectedAuthor}`
      );
    }

    if (selectedRating !== 'all') {
      filters.push(
        `Rating: ${selectedRating}+`
      );
    }

    if (priceRange.min) {
      filters.push(
        `Min: $${priceRange.min}`
      );
    }

    if (priceRange.max) {
      filters.push(
        `Max: $${priceRange.max}`
      );
    }

    setActiveFilters(filters);
  };

  // ───────────────────────────────────────────────────────────
  // Search
  // ───────────────────────────────────────────────────────────

  const handleSearchChange = (
    value: string
  ) => {
    setSearchInput(value);

    if (value.trim().length > 1) {
      const suggestions = fuse
        .search(value)
        .slice(0, 5)
        .map(
          result => result.item.title
        );

      setSearchSuggestions(
        suggestions
      );

      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = () => {
    setSearchQuery(searchInput);

    if (searchInput.trim()) {
      const updated = [
        searchInput,
        ...searchHistory.filter(
          q => q !== searchInput
        ),
      ].slice(0, 5);

      setSearchHistory(updated);
    }

    setShowSuggestions(false);
  };

  // ───────────────────────────────────────────────────────────
  // Clear Filters
  // ───────────────────────────────────────────────────────────

  const clearAllFilters = () => {
    setSearchQuery('');

    setSearchInput('');

    setSelectedGenre('all');

    setSelectedAuthor('all');

    setSelectedRating('all');

    setSortBy('title');

    setPriceRange({
      min: '',
      max: '',
    });

    setCurrentPage(1);
  };

  // ───────────────────────────────────────────────────────────
  // Cart
  // ───────────────────────────────────────────────────────────

  const handleAddToCart = async (
    bookId: string
  ) => {
    if (!user) {
      toast.error('Please sign in');
      return;
    }

    try {
      await addToCart(bookId);

      toast.success(
        'Book added to cart!'
      );
    } catch {
      toast.error(
        'Failed to add to cart'
      );
    }
  };

  // ───────────────────────────────────────────────────────────
  // Wishlist
  // ───────────────────────────────────────────────────────────

  const handleAddToWishlist = async (
    bookId: string
  ) => {
    if (!user) {
      toast.error('Please sign in');
      return;
    }

    try {
      await addToWishlist(bookId);

      toast.success(
        'Book added to wishlist!'
      );
    } catch (err: any) {
      if (
        err.response?.status === 409
      ) {
        toast.info(
          'Book already in wishlist'
        );
      } else {
        toast.error(
          'Failed to add to wishlist'
        );
      }
    }
  };

  // ───────────────────────────────────────────────────────────
  // Pagination
  // ───────────────────────────────────────────────────────────

  const totalPages = Math.ceil(
    total / itemsPerPage
  );

  const hasActiveFilters =
    !!searchQuery ||
    activeFilters.length > 0;

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Browse Books
          </h1>

          {!loading && (
            <p className="text-gray-600">
              Showing {total} books
            </p>
          )}

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {activeFilters.map(
                (filter, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="bg-orange-100 text-orange-700"
                  >
                    {filter}
                  </Badge>
                )
              )}
            </div>
          )}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">

          {/* Search input */}
          <div className="relative flex-1">
            <Input
              placeholder="Search books by title, author, genre…"
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
              className="pr-10"
            />
            {searchInput && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => { handleSearchChange(''); setSearchQuery(''); }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-10">
                {searchSuggestions.map((s, i) => (
                  <button
                    key={i}
                    className="block w-full text-left px-3 py-2 hover:bg-orange-50 text-sm"
                    onClick={() => { setSearchQuery(s); setSearchInput(s); setShowSuggestions(false); }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Genre filter */}
          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {genres.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Author filter */}
          <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Author" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Authors</SelectItem>
              {authors.map(a => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="price-low">Price ↑</SelectItem>
              <SelectItem value="price-high">Price ↓</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile: more filters sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="sm:hidden">Filters</Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <p className="text-sm font-medium mb-1">Min Price</p>
                  <Input placeholder="$0" value={priceRange.min} onChange={e => setPriceRange(p => ({ ...p, min: e.target.value }))} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Max Price</p>
                  <Input placeholder="$999" value={priceRange.max} onChange={e => setPriceRange(p => ({ ...p, max: e.target.value }))} />
                </div>
                <Button className="w-full" onClick={clearAllFilters}>Clear All</Button>
              </div>
            </SheetContent>
          </Sheet>

        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map(
              (_, i) => (
                <BookSkeleton key={i} />
              )
            )}
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">

            <div className="w-32 h-32 rounded-full bg-orange-100 flex items-center justify-center mb-6">
              <BookOpen
                className="h-14 w-14 text-orange-300"
                strokeWidth={1.5}
              />
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              No books found
            </h3>

            <p className="text-gray-500 mb-6">
              Try adjusting your filters.
            </p>

            {hasActiveFilters && (
              <Button
                onClick={
                  clearAllFilters
                }
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Books Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {books.map(book => (
                <EnhancedBookCard
                  key={book.id}
                  book={book}
                  onAddToCart={
                    handleAddToCart
                  }
                  onAddToWishlist={
                    handleAddToWishlist
                  }
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={
                  currentPage
                }
                totalPages={
                  totalPages
                }
                totalItems={total}
                itemsPerPage={
                  itemsPerPage
                }
                onPageChange={page => {
                  setCurrentPage(page);

                  window.scrollTo({
                    top: 0,
                    behavior:
                      'smooth',
                  });
                }}
                onItemsPerPageChange={
                  setItemsPerPage
                }
                pageSizeOptions={[
                  12,
                  24,
                  48,
                ]}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};