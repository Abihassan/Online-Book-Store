import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  Trash2,
  BookOpen,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

import {
  getWishlist,
  removeFromWishlist as apiRemoveFromWishlist,
  WishlistBook,
} from '../lib/wishlistApi';

import { useCart } from '../contexts/CartContext';

import { LoadingButton } from '../components/ui/loading-button';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

import { Book } from '../lib/types';

interface WishlistItemWithBook extends WishlistBook {
  book: Book;
}

export const Wishlist = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [wishlistItems, setWishlistItems] = useState<
    WishlistItemWithBook[]
  >([]);

  const [loadingItems, setLoadingItems] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadWishlist();
  }, [user, navigate]);

  // ── LOAD WISHLIST (API ONLY) ────────────────────────────────────────────────
  const loadWishlist = async () => {
    if (!user) return;

    try {
      const res = await getWishlist();

      // API returns flat WishlistBook (Book fields + wishlistItemId).
      // JSX accesses item.book.xxx, so we inject a nested book reference.
      setWishlistItems(res.map(item => ({ ...item, book: item })) as any);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load wishlist');
    }
  };

  // ── REMOVE FROM WISHLIST ────────────────────────────────────────────────────
  const removeFromWishlist = async (
    itemId: string
  ) => {
    setLoadingItems(prev => ({
      ...prev,
      [`remove-${itemId}`]: true,
    }));

    try {
      await apiRemoveFromWishlist(itemId);

      toast.success('Removed from wishlist');

      loadWishlist();
    } catch (error) {
      console.error(error);

      toast.error(
        'Failed to remove from wishlist'
      );
    } finally {
      setLoadingItems(prev => ({
        ...prev,
        [`remove-${itemId}`]: false,
      }));
    }
  };

  // ── MOVE TO CART ────────────────────────────────────────────────────────────
  const moveToCart = async (
    item: WishlistItemWithBook
  ) => {
    if (!user) return;

    setLoadingItems(prev => ({
      ...prev,
      [`cart-${item.wishlistItemId}`]: true,
    }));

    try {
      await addToCart(item.book.id);

      // FIXED: use wishlistItemId instead of item.id
      await apiRemoveFromWishlist(item.wishlistItemId);

      toast.success('Moved to cart!');

      loadWishlist();
    } catch (error) {
      console.error(error);

      toast.error('Failed to move to cart');
    } finally {
      setLoadingItems(prev => ({
        ...prev,
        [`cart-${item.wishlistItemId}`]: false,
      }));
    }
  };

  if (!user) return null;

  // ── EMPTY STATE ─────────────────────────────────────────────────────────────
  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto text-center">

            {/* Illustrated empty state */}
            <div className="relative inline-flex items-center justify-center mb-8">

              {/* Outer glow ring */}
              <div className="w-44 h-44 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
                <div className="w-36 h-36 rounded-full bg-white/60 flex items-center justify-center">
                  <Heart
                    className="h-16 w-16 text-pink-300"
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              {/* Floating book badge */}
              <div className="absolute -top-1 -right-1 w-12 h-12 rounded-full bg-amber-100 border-2 border-white shadow-sm flex items-center justify-center">
                <BookOpen
                  className="h-6 w-6 text-amber-400"
                  strokeWidth={1.5}
                />
              </div>

              {/* Floating sparkle badge */}
              <div className="absolute -bottom-1 -left-1 w-10 h-10 rounded-full bg-orange-100 border-2 border-white shadow-sm flex items-center justify-center">
                <Sparkles
                  className="h-5 w-5 text-orange-400"
                  strokeWidth={1.5}
                />
              </div>

            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Your wishlist is empty
            </h2>

            <p className="text-gray-500 text-lg mb-2">
              You haven't saved any books yet.
            </p>

            <p className="text-gray-400 text-sm mb-8">
              Tap the{' '}
              <Heart className="inline h-4 w-4 text-pink-400 fill-pink-300 mx-0.5" />
              {' '}icon on any book to save it here for later.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">

              <Link to="/books">
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-5 text-base">
                  Browse Books
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <Link to="/cart">
                <Button
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 px-8 py-5 text-base"
                >
                  View Cart
                </Button>
              </Link>

            </div>

            {/* Tip */}
            <div className="mt-10 bg-orange-50 border border-orange-100 rounded-xl px-5 py-4 text-left">
              <p className="text-sm font-medium text-gray-700 mb-1">
                💡 How wishlists work
              </p>

              <p className="text-xs text-gray-500">
                Save books you like, then move them to cart
                when you're ready to buy. Your wishlist
                stays saved across sessions.
              </p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── MAIN UI ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            My Wishlist
          </h1>

          <p className="text-gray-600">
            {wishlistItems.length}{' '}
            {wishlistItems.length === 1
              ? 'book'
              : 'books'}{' '}
            saved
          </p>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

          {wishlistItems.map(item => (
            <Card
              key={item.wishlistItemId}
              className="group overflow-hidden border border-orange-200 bg-white/90 hover:shadow-lg hover:shadow-orange-100 transition-all duration-300 rounded-lg"
            >

              <Link to={`/books/${item.book.id}`}>
                <div className="relative overflow-hidden aspect-[2/3]">

                  <img
                    src={item.book.coverImage}
                    alt={item.book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Out of stock overlay */}
                  {item.book.stock === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                        Out of Stock
                      </span>
                    </div>
                  )}

                  {/* Quick remove button */}
                  <button
                    onClick={e => {
                      e.preventDefault();

                      // FIXED: use wishlistItemId
                      removeFromWishlist(item.wishlistItemId);
                    }}
                    className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-red-500/80 rounded-full shadow transition-colors"
                    aria-label="Remove from wishlist"
                  >
                    <Heart className="h-5 w-5 fill-red-400 text-red-500" />
                  </button>

                </div>
              </Link>

              <CardContent className="p-4">

                <Link to={`/books/${item.book.id}`}>
                  <h3 className="font-semibold text-lg text-gray-800 line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {item.book.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-1">
                    {item.book.author}
                  </p>
                </Link>

                {/* Stock badge */}
                <div className="mb-2">

                  {(item.book.stock ?? 0) === 0 ? (
                    <span className="text-xs text-red-500 font-medium">
                      Out of stock
                    </span>
                  ) : (item.book.stock ?? 0) <= 5 ? (
                    <span className="text-xs text-amber-600 font-medium">
                      Only {item.book.stock} left
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">
                      In stock
                    </span>
                  )}

                </div>

                {/* Price */}
                <p className="text-xl font-bold text-orange-600 mb-3">
                  ${item.book.price.toFixed(2)}
                </p>

                {/* Actions */}
                <div className="flex gap-2">

                  <LoadingButton
                    onClick={() => moveToCart(item)}
                    loading={
                      loadingItems[`cart-${item.wishlistItemId}`]
                    }
                    loadingText="Adding..."
                    disabled={item.book.stock === 0}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-50"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />

                    {item.book.stock === 0
                      ? 'Out of Stock'
                      : 'Add to Cart'}
                  </LoadingButton>

                  <LoadingButton
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      // FIXED: use wishlistItemId
                      removeFromWishlist(item.wishlistItemId)
                    }
                    loading={
                      loadingItems[`remove-${item.wishlistItemId}`]
                    }
                    className="border-orange-300 hover:bg-red-50 hover:border-red-300 text-orange-700 hover:text-red-600"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </LoadingButton>

                </div>

              </CardContent>
            </Card>
          ))}

        </div>
      </div>
    </div>
  );
};