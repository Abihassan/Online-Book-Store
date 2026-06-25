import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeCartItem as apiRemoveCartItem,
  CartItemAPI,
} from '../lib/cartApi';

interface CartContextValue {
  cartItems: CartItemAPI[];
  cartCount: number; // total quantity across all items, used for the navbar badge
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (bookId: string, quantity?: number) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemAPI[]>([]);
  const [loading, setLoading] = useState(false);

  // ─────────────────────────────────────────────
  // Single source of truth: refreshCart() re-fetches from the backend
  // and every mutation below calls it afterward, so ANY component that
  // reads cartItems from this context (Navbar, Cart page, etc.) updates
  // immediately — no more "reload the page to see it" bug.
  // ─────────────────────────────────────────────
  const refreshCart = async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    setLoading(true);
    try {
      const cart = await getCart();
      setCartItems(cart);
    } catch (err) {
      console.error('Failed to refresh cart:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reload whenever the logged-in user changes (login/logout/switch user)
  useEffect(() => {
    refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addToCart = async (bookId: string, quantity = 1) => {
    await apiAddToCart(bookId, quantity);
    await refreshCart();
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    await apiUpdateCartItem(itemId, quantity);
    await refreshCart();
  };

  const removeCartItem = async (itemId: string) => {
    await apiRemoveCartItem(itemId);
    await refreshCart();
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        loading,
        refreshCart,
        addToCart,
        updateCartItem,
        removeCartItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};