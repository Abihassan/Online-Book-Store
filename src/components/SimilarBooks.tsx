import { Book } from '../lib/types';
import { EnhancedBookCard } from './EnhancedBookCard';

interface SimilarBooksProps {
  books: Book[];
  onAddToCart: (bookId: string) => void;
  onAddToWishlist: (bookId: string) => void;
}

export const SimilarBooks = ({ books, onAddToCart, onAddToWishlist }: SimilarBooksProps) => {
  if (books.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold text-slate-100 mb-6">Similar Books</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {books.slice(0, 5).map((book) => (
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