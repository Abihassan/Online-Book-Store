import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  BookOpen,
  TrendingUp,
  Award,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Mail,
  CheckCircle,
} from 'lucide-react';

import { Book } from '../lib/types';

import { getBooks } from '../lib/booksApi';

import { addToWishlist } from '../lib/wishlistApi';

import { BookCard } from '../components/BookCard';

import { Button } from '../components/ui/button';

import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

import { toast } from 'sonner';

export const Index = () => {
  const [featuredBooks, setFeaturedBooks] =
    useState<Book[]>([]);

  const [trendingBooks, setTrendingBooks] =
    useState<Book[]>([]);

  const [newReleases, setNewReleases] =
    useState<Book[]>([]);

  const [newsletterEmail, setNewsletterEmail] =
    useState('');

  const [
    newsletterSubmitted,
    setNewsletterSubmitted,
  ] = useState(false);

  const [
    newsletterLoading,
    setNewsletterLoading,
  ] = useState(false);

  const { user } = useAuth();
  const { addToCart } = useCart();

  // ── Load Homepage Books ───────────────────────────────────────────────────

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const res = await getBooks({
          per_page: 100,
        });

        const allBooks = res.books;

        const bestsellers = allBooks
          .filter(b => b.badge === 'bestseller')
          .slice(0, 4);

        const trending = allBooks
          .filter(b => b.badge === 'trending')
          .slice(0, 4);

        const newReleases = allBooks
          .filter(b => b.badge === 'new')
          .slice(0, 4);

        // Fallback: if badge sections are empty, distribute all books evenly
        const fallback = allBooks.slice(0, 12);
        setFeaturedBooks(bestsellers.length > 0 ? bestsellers : fallback.slice(0, 4));
        setTrendingBooks(trending.length > 0 ? trending : fallback.slice(4, 8));
        setNewReleases(newReleases.length > 0 ? newReleases : fallback.slice(8, 12));
      } catch (err) {
        // Log the real error (status code, message) so future failures
        // show their actual cause in DevTools instead of just this toast.
        console.error('Failed to load homepage books:', err);
        toast.error(
          'Failed to load homepage books'
        );
      }
    };

    loadBooks();
  }, []);

  // ── Add To Cart ───────────────────────────────────────────────────────────

  const handleAddToCart = async (
    bookId: string
  ) => {
    if (!user) {
      toast.error(
        'Please sign in to add items to cart'
      );

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

  // ── Add To Wishlist ───────────────────────────────────────────────────────

  const handleAddToWishlist = async (
    bookId: string
  ) => {
    if (!user) {
      toast.error(
        'Please sign in to add items to wishlist'
      );

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

  // ── Newsletter ────────────────────────────────────────────────────────────

  const handleNewsletter = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !newsletterEmail.trim() ||
      !newsletterEmail.includes('@')
    ) {
      toast.error(
        'Please enter a valid email address'
      );

      return;
    }

    setNewsletterLoading(true);

    await new Promise(resolve =>
      setTimeout(resolve, 900)
    );

    setNewsletterLoading(false);

    setNewsletterSubmitted(true);

    toast.success(
      "You're subscribed! Welcome to BookHaven updates."
    );
  };

  return (
    <div className="min-h-screen page-enter">

      {/* ── Hero Section ── */}
      <section className="relative py-20 md:py-32 px-4 overflow-hidden bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
        <div className="absolute inset-0 hero-gradient opacity-30" />

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">

            <div className="hero-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-4 animate-bounce-subtle border-2 border-orange-200">
              <Award className="h-5 w-5 text-orange-600" />

              <span className="text-sm text-orange-700 font-medium">
                Your Premier Digital Bookstore
              </span>
            </div>

            <h1 className="hero-fade-up-delay-1 text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-gradient">
                Discover Your Next
              </span>

              <br />

              <span className="text-gray-800">
                Great Read
              </span>
            </h1>

            <p className="hero-fade-up-delay-2 text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Explore thousands of books across every genre.
              From bestsellers to hidden gems,
              find stories that inspire, educate, and entertain.
            </p>

            <div className="hero-fade-up-delay-3 flex gap-4 justify-center flex-wrap pt-4">

              <Link to="/books">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg px-8 shadow-lg"
                >
                  Browse Books

                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              {!user && (
                <Link to="/auth">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 text-lg px-8"
                  >
                    Get Started Free
                  </Button>
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="hero-fade-up-delay-3 grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8">

              {[
                ['10K+', 'Books Available'],
                ['50K+', 'Happy Readers'],
                ['4.8★', 'Average Rating'],
              ].map(([val, label], i) => (
                <div
                  key={i}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-orange-600">
                    {val}
                  </div>

                  <div className="text-sm text-gray-600">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="py-16 px-4 border-y-2 border-orange-200 bg-white">

        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">

            {[
              {
                icon: BookOpen,
                title: 'Vast Library',
                desc:
                  'Access thousands of books across all genres, from classics to latest releases',
                color: 'orange',
              },

              {
                icon: Zap,
                title: 'Instant Access',
                desc:
                  'Start reading immediately after purchase with our instant delivery system',
                color: 'amber',
              },

              {
                icon: Shield,
                title: 'Quality Assured',
                desc:
                  'Curated selection of bestsellers, award winners, and critically acclaimed titles',
                color: 'orange',
              },
            ].map(
              ({
                icon: Icon,
                title,
                desc,
                color,
              }) => (
                <div
                  key={title}
                  className="text-center space-y-4 p-6 rounded-xl glass-effect smooth-transition hover:scale-105 border-2 border-orange-200"
                >
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-${color}-100 to-amber-100 border-2 border-${color}-300`}
                  >
                    <Icon
                      className={`h-8 w-8 text-${color}-600`}
                    />
                  </div>

                  <h3 className="font-semibold text-xl text-gray-800">
                    {title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed">
                    {desc}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── Bestsellers ── */}
      {featuredBooks.length > 0 && (
        <section className="py-16 px-4 bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">

          <div className="container mx-auto">

            <div className="flex items-center justify-between mb-8">

              <div className="flex items-center gap-3">
                <Star className="h-6 w-6 text-amber-500 fill-amber-500" />

                <div>
                  <h2 className="text-3xl font-bold text-gray-800">
                    Bestsellers
                  </h2>

                  <p className="text-gray-600 mt-1">
                    Top picks loved by readers
                  </p>
                </div>
              </div>

              <Link to="/books?category=bestsellers">
                <Button
                  variant="outline"
                  className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  View All

                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {featuredBooks.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trending ── */}
      {trendingBooks.length > 0 && (
        <section className="py-16 px-4 bg-white">

          <div className="container mx-auto">

            <div className="flex items-center justify-between mb-8">

              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-orange-600" />

                <div>
                  <h2 className="text-3xl font-bold text-gray-800">
                    Trending Now
                  </h2>

                  <p className="text-gray-600 mt-1">
                    What everyone's reading
                  </p>
                </div>
              </div>

              <Link to="/books?category=trending">
                <Button
                  variant="outline"
                  className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  View All

                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {trendingBooks.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── New Releases ── */}
      {newReleases.length > 0 && (
        <section className="py-16 px-4 bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">

          <div className="container mx-auto">

            <div className="flex items-center justify-between mb-8">

              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-green-600" />

                <div>
                  <h2 className="text-3xl font-bold text-gray-800">
                    New Releases
                  </h2>

                  <p className="text-gray-600 mt-1">
                    Fresh arrivals this month
                  </p>
                </div>
              </div>

              <Link to="/books?category=new">
                <Button
                  variant="outline"
                  className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  View All

                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {newReleases.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter ── */}
      <section className="py-20 px-4 bg-white border-y-2 border-orange-200">

        <div className="container mx-auto max-w-2xl text-center">

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-100 mb-5">
            <Mail className="h-7 w-7 text-orange-500" />
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Stay in the Loop
          </h2>

          <p className="text-gray-500 mb-8 text-lg">
            Get weekly recommendations,
            new releases,
            and exclusive deals delivered to your inbox.
          </p>

          {newsletterSubmitted ? (
            <div className="flex items-center justify-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-6 py-5">

              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />

              <div className="text-left">
                <p className="font-semibold text-green-800">
                  You're subscribed!
                </p>

                <p className="text-sm text-green-600">
                  Watch your inbox for BookHaven updates.
                </p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleNewsletter}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={newsletterEmail}
                onChange={e =>
                  setNewsletterEmail(
                    e.target.value
                  )
                }
                placeholder="you@example.com"
                className="flex-1 border-2 border-orange-200 rounded-xl px-4 py-3 text-sm bg-orange-50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                required
              />

              <button
                type="submit"
                disabled={newsletterLoading}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium px-6 py-3 rounded-xl transition-all disabled:opacity-60 whitespace-nowrap"
              >
                {newsletterLoading
                  ? 'Subscribing…'
                  : 'Subscribe Free'}
              </button>
            </form>
          )}

          <p className="text-xs text-gray-400 mt-4">
            No spam. Unsubscribe anytime.
            We respect your privacy.
          </p>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 px-4 relative overflow-hidden bg-gradient-to-r from-orange-100 to-amber-100 border-t-2 border-orange-200">

        <div className="absolute inset-0 hero-gradient opacity-30" />

        <div className="container mx-auto text-center max-w-3xl relative z-10">

          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Start Your Reading Journey Today
          </h2>

          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            Join thousands of readers who trust BookHaven
            for their digital library.
            Discover new worlds,
            gain knowledge,
            and enjoy unlimited reading.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">

            <Link to="/books">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg px-8 shadow-lg"
              >
                Explore Books

                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            {!user && (
              <Link to="/auth">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 text-lg px-8"
                >
                  Sign Up Free
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};