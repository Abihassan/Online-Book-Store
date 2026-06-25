import { useState } from 'react';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingButton } from './ui/loading-button';
import { Book } from '../lib/types';

interface EnhancedBookCardProps {
  book: Book;
  material?: string;
  isLuxe?: boolean;
  onClick?: (bookId: string) => void;
  onAddToCart?: (bookId: string) => void;
  onAddToWishlist?: (bookId: string) => void;
}

export const EnhancedBookCard = ({
  book,
  material,
  isLuxe,
  onClick,
  onAddToCart,
  onAddToWishlist
}: EnhancedBookCardProps) => {
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);

  const discount =
    book.price < 20 ? Math.floor(((20 - book.price) / 20) * 100) : 0;

  const originalPrice =
    discount > 0 ? book.price / (1 - discount / 100) : undefined;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAddToCart) return;

    setAddingToCart(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      onAddToCart(book.id);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAddToWishlist) return;

    setAddingToWishlist(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      onAddToWishlist(book.id);
    } finally {
      setAddingToWishlist(false);
    }
  };

  return (
    <div
      className="group bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 rounded-md shadow-sm border border-amber-300 overflow-hidden flex flex-col cursor-pointer"
      onClick={() => onClick?.(book.id)}
    >
      <div className="relative">
        {/* Luxe Badge */}
        {isLuxe && (
          <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] px-2 py-[2px] rounded z-10">
            LUXE
          </div>
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-amber-400 text-black text-[10px] px-2 py-[3px] rounded z-10">
            {discount}% OFF
          </div>
        )}

        {/* Genre Badge */}
        {!discount && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[8px] px-1 py-[2px] rounded z-10">
            {book.genre}
          </div>
        )}

        {/* Book Cover */}
        <Link to={`/books/${book.id}`} onClick={e => e.stopPropagation()}>
          <div className="w-full aspect-square overflow-hidden bg-orange-100">
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
          </div>
        </Link>

        {/* Wishlist Button */}
        {onAddToWishlist && (
          <LoadingButton
            onClick={handleAddToWishlist}
            loading={addingToWishlist}
            size="sm"
            className="absolute top-10 right-4 bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className="w-4 h-4" />
          </LoadingButton>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        {/* Material */}
        {material && (
          <p className="text-[11px] text-amber-700 mb-1">{material}</p>
        )}

        {/* Author */}
        <p className="text-[12px] text-amber-700 truncate">{book.author}</p>

        {/* Title */}
        <Link to={`/books/${book.id}`} onClick={e => e.stopPropagation()}>
          <h3 className="font-semibold text-amber-900 line-clamp-2 hover:text-orange-600">
            {book.title}
          </h3>
        </Link>

        {/* Rating */}
        {book.rating !== undefined && (
          <div className="flex items-center space-x-1 my-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(book.rating)
                    ? 'text-amber-400 fill-current'
                    : 'text-amber-200'
                }`}
              />
            ))}
            {book.reviews !== undefined && (
              <span className="text-[11px] text-amber-700">
                ({book.reviews})
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-lg font-bold text-orange-600">
            ${book.price.toLocaleString()}
          </span>
          {originalPrice && (
            <span className="text-sm text-amber-600 line-through">
              ${originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        {onAddToCart && (
          <LoadingButton
            onClick={handleAddToCart}
            loading={addingToCart}
            loadingText="Adding..."
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-2 rounded-md text-sm font-medium flex items-center justify-center space-x-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add To Cart</span>
          </LoadingButton>
        )}
      </div>
    </div>
  );
};

// --- Books Grid ---
interface BooksGridProps {
  books: Book[];
  onAddToCart?: (bookId: string) => void;
  onAddToWishlist?: (bookId: string) => void;
}

export const BooksGrid = ({
  books,
  onAddToCart,
  onAddToWishlist
}: BooksGridProps) => {
  return (
    <div className="max-w-[1200px] mx-auto px-4 mt-8">
      <h1 className="text-3xl font-bold mb-4">Browse Books</h1>
      <p className="text-sm text-gray-600 mb-6">
        Showing {books.length} books
      </p>

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {books.map(book => (
          <EnhancedBookCard
            key={book.id}
            book={book}
            onAddToCart={onAddToCart}
            onAddToWishlist={onAddToWishlist}
          />
        ))}
      </div>
    </div>
  );
};
