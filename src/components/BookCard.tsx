import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Eye } from 'lucide-react';
import { LoadingButton } from './ui/loading-button';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter } from './ui/card';
import { Book } from '../lib/types';

interface BookCardProps {
  book: Book;
  onAddToCart: (bookId: string) => void;
  onAddToWishlist: (bookId: string) => void;
}

export const BookCard = ({ book, onAddToCart, onAddToWishlist }: BookCardProps) => {
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);

  const discount = book.originalPrice
    ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
    : 0;

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      onAddToCart(book.id);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAddingToWishlist(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      onAddToWishlist(book.id);
    } finally {
      setAddingToWishlist(false);
    }
  };

  return (
    <Card className="group product-card-hover overflow-hidden border-orange-700 bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
      <Link to={`/books/${book.id}`}>
        {/* ── Cover with hover zoom ── */}
        <div className="relative aspect-[3/4] overflow-hidden bg-orange-100">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="object-cover w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-110"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {book.badge === 'new' && <Badge className="bg-green-500 hover:bg-green-600">New</Badge>}
            {book.badge === 'sale' && discount > 0 && <Badge className="bg-red-500 hover:bg-red-600">-{discount}%</Badge>}
            {book.badge === 'bestseller' && <Badge className="bg-amber-500 hover:bg-amber-600">Bestseller</Badge>}
            {book.badge === 'trending' && <Badge className="bg-orange-500 hover:bg-orange-600">Trending</Badge>}
          </div>

          {/* Hover overlay actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4 gap-2">
            <LoadingButton
              size="sm"
              variant="secondary"
              onClick={handleAddToWishlist}
              loading={addingToWishlist}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Heart className="h-4 w-4 mr-1" />
              Wishlist
            </LoadingButton>
            <Button size="sm" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" asChild>
              <Link to={`/books/${book.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Link>
            </Button>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/books/${book.id}`}>
          <div className="space-y-2">
            <p className="text-xs text-gray-600 uppercase tracking-wider">{book.category}</p>
            <h3 className="font-semibold text-sm line-clamp-2 text-gray-800 group-hover:text-orange-600 smooth-transition">
              {book.title}
            </h3>
            <p className="text-sm text-gray-600">{book.author}</p>
            <div className="flex items-center gap-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < Math.floor(book.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
                ))}
              </div>
              <span className="text-xs text-gray-600">{book.rating.toFixed(1)} ({book.reviewCount})</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-orange-600">${book.price.toFixed(2)}</span>
              {book.originalPrice && (
                <span className="text-sm text-gray-500 line-through">${book.originalPrice.toFixed(2)}</span>
              )}
            </div>
          </div>
        </Link>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <LoadingButton
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
          onClick={handleAddToCart}
          loading={addingToCart}
          loadingText="Adding..."
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </LoadingButton>
      </CardFooter>
    </Card>
  );
};