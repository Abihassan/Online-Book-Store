import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User, BookOpen, LogOut, Search, Menu, X} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { Book } from '../lib/types';
import { EnhancedCartFlyout } from './EnhancedCartFlyout';

import { getBooks } from '../lib/booksApi';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from './ui/dropdown-menu';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { cartItems, cartCount, addToCart, updateCartItem, removeCartItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [books, setBooks] = useState<Book[]>([]);

  // close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // load books for the "recommended" section of the cart flyout
  // (cart itself now comes from CartContext, shared across the whole app)
  useEffect(() => {
    const loadBooks = async () => {
      const { books } = await getBooks({
        per_page: 20,
      });
      setBooks(books);
    };

    loadBooks();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // CART ACTIONS — now thin wrappers around the shared context, which
  // already refreshes cartItems after every mutation. Every page that
  // adds/updates/removes via useCart() will see the change here too.
  const handleUpdateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      await updateCartItem(id, quantity);
    } catch {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await removeCartItem(id);
      toast.success('Item removed from cart');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleAddRecommended = async (bookId: string) => {
    if (!user) return;
    try {
      await addToCart(bookId);
      toast.success('Book added to cart!');
    } catch {
      toast.error('Failed to add book');
    }
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const recommendedBooks = books
    .filter(book => !cartItems.some(item => item.bookId === book.id))
    .slice(0, 3);

  // ACTIVE UI HELPERS (from Code 2)
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navLinkClass = (path: string) =>
    `relative text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
      isActive(path)
        ? 'text-orange-600 bg-orange-50'
        : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
    }`;

  const mobileNavLinkClass = (path: string) =>
    `w-full justify-start ${
      isActive(path)
        ? 'bg-orange-50 text-orange-600 font-medium'
        : 'text-gray-700'
    }`;

  return (
    <>
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white border-b-2 border-orange-300 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">

            {/* LOGO */}
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold">BookHaven</span>
            </Link>

            {/* SEARCH (UI improved from Code 2) */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search books, authors..."
                  className="w-full bg-orange-50 border-orange-200 pr-10"
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-500" />
              </div>
            </form>

            {/* DESKTOP ACTIONS */}
            <div className="hidden md:flex items-center gap-1">

              <Link to="/books" className={navLinkClass('/books')}>
                Browse Books
              </Link>

              {user ? (
                <>
                  {/* Wishlist UI (Code 2 style) */}
                  <Link to="/wishlist">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`${
                        isActive('/wishlist')
                          ? 'text-orange-600 bg-orange-50'
                          : 'text-gray-700'
                      }`}
                    >
                      <Heart className="h-5 w-5" />
                    </Button>
                  </Link>

                  {/* Cart */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCartOpen(true)}
                    className="relative"
                  >
                    <ShoppingCart />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Button>

                  {/* USER MENU */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <User />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        Profile
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate('/library')}>
                        My Library
                      </DropdownMenuItem>

                      {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          Admin Dashboard
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Link to="/auth">
                  <Button>Sign In</Button>
                </Link>
              )}
            </div>

            {/* MOBILE BUTTON */}
            <Button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>

          {/* MOBILE MENU (enhanced UI from Code 2) */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t">

              <form onSubmit={handleSearch} className="mb-2">
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search books..."
                />
              </form>

              <Link to="/books">
                <Button variant="ghost" className={mobileNavLinkClass('/books')}>
                  Browse Books
                </Button>
              </Link>

              {user && (
                <>
                  <Link to="/wishlist">
                    <Button variant="ghost" className={mobileNavLinkClass('/wishlist')}>
                      <Heart className="mr-2 h-5 w-5" />
                      Wishlist
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsCartOpen(true);
                    }}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Cart ({cartCount})
                  </Button>

                  <Link to="/library">
                    <Button variant="ghost" className={mobileNavLinkClass('/library')}>
                      My Library
                    </Button>
                  </Link>

                  <Link to="/profile">
                    <Button variant="ghost" className={mobileNavLinkClass('/profile')}>
                      Profile
                    </Button>
                  </Link>

                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="ghost" className={mobileNavLinkClass('/admin')}>
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}

                  <Button onClick={handleLogout} className="w-full text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* CART */}
      {user && (
        <EnhancedCartFlyout
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          books={books}
          recommendedBooks={recommendedBooks}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onAddRecommended={handleAddRecommended}
          onCheckout={handleCheckout}
        />
      )}
    </>
  );
};