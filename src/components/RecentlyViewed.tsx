import { Book } from '../lib/types';
import { EnhancedBookCard } from './EnhancedBookCard';

interface RecentlyViewedProps {
  books: Book[];
  onAddToCart: (bookId: string) => void;
  onAddToWishlist: (bookId: string) => void;
}

export const RecentlyViewed = ({ books, onAddToCart, onAddToWishlist }: RecentlyViewedProps) => {
  if (books.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold text-slate-100 mb-6">Recently Viewed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {books.map((book) => (
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