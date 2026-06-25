import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Tag,
  X,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

import { Book } from '../lib/types';

import {
  getCart,
} from '../lib/cartApi';

import { useCart } from '../contexts/CartContext';

import { getBooks } from '../lib/booksApi';

import { LoadingButton } from '../components/ui/loading-button';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

import { useAuth } from '../contexts/AuthContext';

import { toast } from 'sonner';

interface CartItemAPI {
  id: string;
  userId: string;
  bookId: string;
  quantity: number;
  price: number;
  addedAt: string;
}

interface CartItemWithBook extends CartItemAPI {
  book: Book;
}

const VALID_COUPONS: Record<string, number> = {
  BOOK10: 10,
  READER20: 20,
  WELCOME15: 15,
};

export const Cart = () => {
  const { user } = useAuth();
  const { updateCartItem, removeCartItem } = useCart();

  const navigate = useNavigate();

  const [cartItems, setCartItems] =
    useState<CartItemWithBook[]>([]);

  const [loadingItems, setLoadingItems] =
    useState<Record<string, boolean>>({});

  const [couponCode, setCouponCode] =
    useState('');

  const [appliedCoupon, setAppliedCoupon] =
    useState<{
      code: string;
      discount: number;
    } | null>(null);

  const [couponLoading, setCouponLoading] =
    useState(false);

  const [couponError, setCouponError] =
    useState('');

  // ─────────────────────────────────────────────
  // Load cart from backend
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!user) {
      navigate('/auth');

      return;
    }

    loadCart();
  }, [user, navigate]);

  const loadCart = async () => {
    if (!user) return;

    try {
      const cart = await getCart();

      const booksRes = await getBooks({
        page: 1,
        per_page: 100,
      });

      const books = booksRes.books;

      const enriched: CartItemWithBook[] =
        cart
          .map(item => {
            const book = books.find(
              b => b.id === item.bookId
            );

            return book
              ? { ...item, book }
              : null;
          })
          .filter(
            (
              item
            ): item is CartItemWithBook =>
              item !== null
          );

      setCartItems(enriched);
    } catch (error) {
      console.error(error);

      toast.error('Failed to load cart');
    }
  };

  // ─────────────────────────────────────────────
  // Update quantity
  // ─────────────────────────────────────────────

  const updateQuantity = async (
    itemId: string,
    currentQty: number,
    delta: number
  ) => {
    setLoadingItems(prev => ({
      ...prev,
      [itemId]: true,
    }));

    try {
      const newQty = currentQty + delta;

      if (newQty <= 0) {
        await removeCartItem(itemId);

        toast.success(
          'Item removed from cart'
        );
      } else {
        await updateCartItem(
          itemId,
          newQty
        );
      }

      // removeCartItem/updateCartItem above already refreshed the shared
      // CartContext (so the Navbar badge updates instantly); loadCart()
      // here re-fetches this page's own enriched (book-detail-joined) view.
      await loadCart();
    } catch (error) {
      console.error(error);

      toast.error(
        'Failed to update quantity'
      );
    } finally {
      setLoadingItems(prev => ({
        ...prev,
        [itemId]: false,
      }));
    }
  };

  // ─────────────────────────────────────────────
  // Remove item
  // ─────────────────────────────────────────────

  const removeItem = async (
    itemId: string
  ) => {
    setLoadingItems(prev => ({
      ...prev,
      [itemId]: true,
    }));

    try {
      await removeCartItem(itemId);

      await loadCart();

      toast.success(
        'Item removed from cart'
      );
    } catch (error) {
      console.error(error);

      toast.error(
        'Failed to remove item'
      );
    } finally {
      setLoadingItems(prev => ({
        ...prev,
        [itemId]: false,
      }));
    }
  };

  // ─────────────────────────────────────────────
  // Coupon system
  // ─────────────────────────────────────────────

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError(
        'Please enter a coupon code.'
      );

      return;
    }

    setCouponError('');

    setCouponLoading(true);

    await new Promise(resolve =>
      setTimeout(resolve, 600)
    );

    const upper = couponCode
      .trim()
      .toUpperCase();

    if (VALID_COUPONS[upper]) {
      setAppliedCoupon({
        code: upper,
        discount: VALID_COUPONS[upper],
      });

      setCouponCode('');

      toast.success(
        `Coupon "${upper}" applied — ${VALID_COUPONS[upper]}% off!`
      );
    } else {
      setCouponError(
        'Invalid coupon code. Try BOOK10, READER20, or WELCOME15.'
      );
    }

    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);

    setCouponCode('');

    setCouponError('');

    toast.info('Coupon removed.');
  };

  // ─────────────────────────────────────────────
  // Totals
  // ─────────────────────────────────────────────

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum +
      item.book.price * item.quantity,
    0
  );

  const discountAmount =
    appliedCoupon
      ? (subtotal *
          appliedCoupon.discount) /
        100
      : 0;

  const total =
    subtotal - discountAmount;

  if (!user) return null;

  // ─────────────────────────────────────────────
  // Empty state
  // ─────────────────────────────────────────────

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">

        <div className="container mx-auto px-4 py-16">

          <div className="max-w-lg mx-auto text-center">

            {/* Illustration */}
            <div className="relative inline-flex items-center justify-center mb-8">

              <div className="w-40 h-40 rounded-full bg-orange-100 flex items-center justify-center">
                <ShoppingBag
                  className="h-16 w-16 text-orange-300"
                  strokeWidth={1.5}
                />
              </div>

              <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center">
                <BookOpen
                  className="h-6 w-6 text-amber-400"
                  strokeWidth={1.5}
                />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Your cart is empty
            </h2>

            <p className="text-gray-500 text-lg mb-2">
              Looks like you haven't added
              any books yet.
            </p>

            <p className="text-gray-400 text-sm mb-8">
              Browse our collection and find
              your next great read.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">

              <Link to="/books">
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-5 text-base">

                  Browse Books

                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <Link to="/wishlist">
                <Button
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 px-8 py-5 text-base"
                >
                  View Wishlist
                </Button>
              </Link>
            </div>

            <p className="text-xs text-gray-400 mt-10">
              Have a coupon code? You can
              apply it once you add books to
              your cart.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Main Cart UI
  // ─────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">

      <div className="container mx-auto px-4 py-8">

        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Shopping Cart
        </h1>

        <p className="text-gray-500 mb-8">
          {cartItems.length}{' '}
          {cartItems.length === 1
            ? 'item'
            : 'items'}
        </p>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">

            {cartItems.map(item => (
              <Card
                key={item.id}
                className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50"
              >
                <CardContent className="p-6">

                  <div className="flex gap-4">

                    {/* Book Image */}
                    <Link
                      to={`/books/${item.book.id}`}
                    >
                      <img
                        src={
                          item.book.coverImage
                        }
                        alt={
                          item.book.title
                        }
                        className="w-24 h-32 object-cover rounded"
                      />
                    </Link>

                    {/* Content */}
                    <div className="flex-1">

                      <Link
                        to={`/books/${item.book.id}`}
                      >
                        <h3 className="font-semibold text-lg text-gray-800 hover:text-orange-600 transition-colors">
                          {item.book.title}
                        </h3>
                      </Link>

                      <p className="text-gray-600 text-sm mb-2">
                        {item.book.author}
                      </p>

                      <p className="text-xl font-bold text-orange-600 mb-4">
                        $
                        {item.book.price.toFixed(
                          2
                        )}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-4">

                        <div className="flex items-center gap-2 bg-white/70 border border-orange-200 rounded-lg p-1">

                          <LoadingButton
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity,
                                -1
                              )
                            }
                            loading={
                              loadingItems[
                                item.id
                              ]
                            }
                            className="h-8 w-8 text-gray-700 hover:text-orange-600"
                          >
                            <Minus className="h-4 w-4" />
                          </LoadingButton>

                          <span className="w-8 text-center text-gray-800 font-medium">
                            {item.quantity}
                          </span>

                          <LoadingButton
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity,
                                1
                              )
                            }
                            loading={
                              loadingItems[
                                item.id
                              ]
                            }
                            className="h-8 w-8 text-gray-700 hover:text-orange-600"
                            disabled={
                              item.quantity >=
                              (item.book.stock ?? 0)
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </LoadingButton>
                        </div>

                        {/* Remove */}
                        <LoadingButton
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeItem(item.id)
                          }
                          loading={
                            loadingItems[
                              item.id
                            ]
                          }
                          loadingText="Removing..."
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />

                          Remove
                        </LoadingButton>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="text-right">

                      <p className="text-xl font-bold text-gray-800">
                        $
                        {(
                          item.book.price *
                          item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">

            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 sticky top-20">

              <CardContent className="p-6">

                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Order Summary
                </h2>

                {/* Coupon */}
                <div className="mb-5">

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">

                      <div className="flex items-center gap-2">

                        <Tag className="h-4 w-4 text-green-600" />

                        <span className="text-sm font-medium text-green-700">
                          {appliedCoupon.code}
                        </span>

                        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                          -
                          {
                            appliedCoupon.discount
                          }
                          %
                        </span>
                      </div>

                      <button
                        onClick={
                          removeCoupon
                        }
                        className="text-green-500 hover:text-green-700 transition-colors"
                        aria-label="Remove coupon"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div>

                      <label className="text-sm text-gray-600 mb-1.5 block font-medium">

                        <Tag className="h-3.5 w-3.5 inline mr-1" />

                        Have a coupon?
                      </label>

                      <div className="flex gap-2">

                        <input
                          type="text"
                          value={
                            couponCode
                          }
                          onChange={e => {
                            setCouponCode(
                              e.target.value.toUpperCase()
                            );

                            setCouponError(
                              ''
                            );
                          }}
                          onKeyDown={e =>
                            e.key ===
                              'Enter' &&
                            applyCoupon()
                          }
                          placeholder="Enter code"
                          className="flex-1 border border-orange-200 rounded-lg px-3 py-2 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent placeholder:text-gray-400 uppercase"
                        />

                        <LoadingButton
                          onClick={
                            applyCoupon
                          }
                          loading={
                            couponLoading
                          }
                          loadingText=""
                          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm rounded-lg"
                        >
                          Apply
                        </LoadingButton>
                      </div>

                      {couponError && (
                        <p className="text-xs text-red-500 mt-1.5">
                          {couponError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">

                  <div className="flex justify-between text-gray-700">
                    <span>
                      Subtotal
                    </span>

                    <span>
                      $
                      {subtotal.toFixed(
                        2
                      )}
                    </span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">

                      <span>
                        Discount (
                        {
                          appliedCoupon.discount
                        }
                        %)
                      </span>

                      <span>
                        -
                        $
                        {discountAmount.toFixed(
                          2
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-700">

                    <span>
                      Shipping
                    </span>

                    <span className="text-green-600">
                      FREE
                    </span>
                  </div>

                  <div className="border-t border-orange-200 pt-3">

                    <div className="flex justify-between text-xl font-bold">

                      <span className="text-gray-800">
                        Total
                      </span>

                      <span className="text-orange-600">
                        $
                        {total.toFixed(
                          2
                        )}
                      </span>
                    </div>

                    {appliedCoupon && (
                      <p className="text-xs text-green-600 text-right mt-1">

                        You save $
                        {discountAmount.toFixed(
                          2
                        )}
                        !
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <Link to="/checkout">
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg py-6">

                    Proceed to Checkout
                  </Button>
                </Link>

                <Link to="/books">
                  <Button
                    variant="outline"
                    className="w-full mt-3 border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    Continue Shopping
                  </Button>
                </Link>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};