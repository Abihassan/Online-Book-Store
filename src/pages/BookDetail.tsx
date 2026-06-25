import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart, ArrowLeft, Send } from 'lucide-react';

import { Book, Review } from '../lib/types';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

import { BookImageGallery } from '../components/BookImageGallery';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { SimilarBooks } from '../components/SimilarBooks';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { LoadingButton } from '../components/ui/loading-button';

import { getBook, getBooks } from '../lib/booksApi';
import { getBookReviews, postReview } from '../lib/reviewsApi';
import { useCart } from '../contexts/CartContext';
import { addToWishlist } from '../lib/wishlistApi';

export const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarBooks, setSimilarBooks] = useState<Book[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Book[]>([]);

  // Review state
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewErrors, setReviewErrors] = useState<Record<string, string>>({});

  // Load book + reviews
  useEffect(() => {
    const load = async () => {
      if (!id) return;

      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        // Book
        const bookData = await getBook(id);
        setBook(bookData);

        // Reviews
        const reviewsData = await getBookReviews(id);
        setReviews(reviewsData.reviews || []);

        // Similar books
        const allBooks = await getBooks({
          genre: bookData.genre,
          per_page: 20,
        });

        if (allBooks?.books?.length) {
          // Similar books
          setSimilarBooks(
            allBooks.books.filter((b: Book) => b.id !== id).slice(0, 6)
          );

          // Recently viewed localStorage
          const viewed = JSON.parse(
            localStorage.getItem('recentlyViewed') || '[]'
          );

          const updated = [
            id,
            ...viewed.filter((x: string) => x !== id),
          ].slice(0, 5);

          localStorage.setItem(
            'recentlyViewed',
            JSON.stringify(updated)
          );

          // Recently viewed books
          const viewedBooks = allBooks.books.filter((b: Book) =>
            updated.includes(b.id)
          );

          setRecentlyViewed(viewedBooks);
        }
      } catch (err) {
        toast.error('Failed to load book');
      }
    };

    load();
  }, [id]);

  // Add to cart
  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please sign in');
      navigate('/auth');
      return;
    }

    if (!book) return;

    try {
      await addToCart(book.id);
      toast.success('Added to cart');
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  // Add to wishlist
  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error('Please sign in');
      navigate('/auth');
      return;
    }

    if (!book) return;

    try {
      await addToWishlist(book.id);
      toast.success('Added to wishlist');
    } catch {
      toast.error('Failed to add to wishlist');
    }
  };

  // Submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    setReviewErrors({});

    if (!user) {
      toast.error('Login required');
      navigate('/auth');
      return;
    }

    const errs: Record<string, string> = {};

    if (reviewRating === 0) {
      errs.rating = 'Please select a star rating';
    }

    if (!reviewComment.trim()) {
      errs.comment = 'Please write a review';
    } else if (reviewComment.trim().length < 10) {
      errs.comment = 'Review must be at least 10 characters';
    }

    if (Object.keys(errs).length > 0) {
      setReviewErrors(errs);
      return;
    }

    setReviewLoading(true);

    try {
      const newReview = await postReview(
        id!,
        reviewRating,
        reviewComment.trim()
      );

      setReviews((prev) => [newReview, ...prev]);

      setReviewRating(0);
      setHoverRating(0);
      setReviewComment('');

      toast.success('Review submitted successfully');
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 403) {
        toast.error('Purchase required to review');
      } else if (status === 409) {
        toast.error('You already reviewed this book');
      } else {
        toast.error('Failed to submit review');
      }
    } finally {
      setReviewLoading(false);
    }
  };

  // Loading state
  if (!book) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-gray-600">Loading book...</p>
      </div>
    );
  }

  // Average rating
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) /
          reviews.length
        ).toFixed(1)
      : null;

  // Check if user already reviewed
  const userAlreadyReviewed =
    user && reviews.some((r) => r.userId === user.id);

  return (
    <div className="page-container">
      <div className="container mx-auto px-4 py-8">

        {/* Back */}
        <Button onClick={() => navigate(-1)} variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Header */}
        <div className="grid md:grid-cols-2 gap-10 mt-6">

          <BookImageGallery
            images={[book.coverImage]}
            bookTitle={book.title}
          />

          <div>
            <Badge>{book.genre}</Badge>

            <h1 className="text-4xl font-bold mt-2">
              {book.title}
            </h1>

            <p className="text-gray-600 mt-2">
              by {book.author}
            </p>

            <p className="text-3xl text-orange-600 mt-4">
              ${book.price.toFixed(2)}
            </p>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>

              <Button
                variant="outline"
                onClick={handleAddToWishlist}
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2">
            Description
          </h2>

          <p className="text-gray-700 leading-7">
            {book.description}
          </p>
        </div>

        {/* Reviews */}
        <div className="mt-10">
          <CollapsibleSection
            title={`Reviews (${reviews.length})`}
            defaultOpen
          >

            {/* Average Rating */}
            {reviews.length > 0 && (
              <div className="mb-6 flex items-center gap-4">
                <p className="text-3xl font-bold">
                  {avgRating}
                </p>

                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(Number(avgRating))
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="border rounded-lg p-4"
                >
                  {/* FIXED: use fallback if userName doesn't exist */}
                  <p className="font-semibold">
                    {(r as any).userName ||
                      (r as any).username ||
                      'Anonymous User'}
                  </p>

                  <div className="flex gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < r.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="mt-2 text-gray-700">
                    {r.comment}
                  </p>
                </div>
              ))}

              {reviews.length === 0 && (
                <p className="text-gray-500">
                  No reviews yet.
                </p>
              )}
            </div>
          </CollapsibleSection>
        </div>

        {/* Review Form */}
        {!userAlreadyReviewed ? (
          <form
            onSubmit={handleSubmitReview}
            className="mt-8 space-y-4 border rounded-lg p-5"
          >
            <h3 className="text-lg font-semibold">
              Write a Review
            </h3>

            {/* Rating */}
            <div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <Star
                      className={`h-7 w-7 transition ${
                        star <= (hoverRating || reviewRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {reviewErrors.rating && (
                <p className="text-red-500 text-sm mt-1">
                  {reviewErrors.rating}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <textarea
                value={reviewComment}
                onChange={(e) =>
                  setReviewComment(e.target.value)
                }
                className="w-full border rounded-md p-3 min-h-[120px]"
                placeholder="Write your review (minimum 10 characters)"
              />

              {reviewErrors.comment && (
                <p className="text-red-500 text-sm mt-1">
                  {reviewErrors.comment}
                </p>
              )}
            </div>

            {/* Submit */}
            <LoadingButton loading={reviewLoading}>
              <Send className="mr-2 h-4 w-4" />
              Submit Review
            </LoadingButton>
          </form>
        ) : (
          <div className="mt-6 border rounded-lg p-4 bg-green-50">
            <p className="text-green-700 font-medium">
              You already reviewed this book.
            </p>
          </div>
        )}

        {/* Similar Books */}
        <div className="mt-12">
          <SimilarBooks
            books={similarBooks}
            onAddToCart={(bookId: string) => {
              addToCart(bookId)
                .then(() => toast.success('Added to cart'))
                .catch(() => toast.error('Failed to add to cart'));
            }}
            onAddToWishlist={(bookId: string) => {
              addToWishlist(bookId);
              toast.success('Added to wishlist');
            }}
          />
        </div>

        {/* Recently Viewed */}
        <div className="mt-12">
          <RecentlyViewed
            books={recentlyViewed}
            onAddToCart={(bookId: string) => {
              addToCart(bookId)
                .then(() => toast.success('Added to cart'))
                .catch(() => toast.error('Failed to add to cart'));
            }}
            onAddToWishlist={(bookId: string) => {
              addToWishlist(bookId);
              toast.success('Added to wishlist');
            }}
          />
        </div>
      </div>
    </div>
  );
};