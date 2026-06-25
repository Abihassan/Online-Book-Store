import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  CheckCircle,
} from 'lucide-react';

import { getCart } from '../lib/cartApi';
import { getBooks } from '../lib/booksApi';
import { createOrder } from '../lib/ordersApi';

import { Book } from '../lib/types';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';

/* ────────────────────────────────
   TYPES
──────────────────────────────── */
interface CartItemWithBook {
  bookId: string;
  quantity: number;
  book: Book;
}

type Step = 'address' | 'payment' | 'processing' | 'success';

/* ────────────────────────────────
   SIMPLE VALIDATION HELPERS (from Code 2)
──────────────────────────────── */
const validateCardNumber = (num: string) => /^\d{12,19}$/.test(num.replace(/\s/g, ''));
const validateExpiryDate = (val: string) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(val);
const validateCVV = (val: string) => /^\d{3,4}$/.test(val);
const validateRequired = (val: string) => val.trim().length > 0;

/* ────────────────────────────────
   COMPONENT
──────────────────────────────── */
export const Checkout = () => {
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('address');
  const [cartItems, setCartItems] = useState<CartItemWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [addr, setAddr] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    country: 'India',
  });

  const [pay, setPay] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  /* ────────────────────────────────
     LOAD CART (upgraded from Code 2 structure)
  ──────────────────────────────── */
  const loadCart = useCallback(async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      setLoading(true);

      const cart = await getCart();
      if (!cart.length) {
        navigate('/cart');
        return;
      }

      if ((cart[0] as any).book) {
        setCartItems(cart as unknown as CartItemWithBook[]);
        return;
      }

      const books = await getBooks({});
      const merged = cart
        .map((item: any) => {
          const book = books.books.find((b: Book) => b.id === item.bookId);
          return book ? { ...item, book } : null;
        })
        .filter(Boolean);

      setCartItems(merged as CartItemWithBook[]);
    } catch {
      toast.error('Failed to load cart');
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.book.price * item.quantity,
    0
  );

  /* ────────────────────────────────
     ADDRESS CONTINUE (validation added)
  ──────────────────────────────── */
  const handleAddressContinue = (e: React.FormEvent) => {
    e.preventDefault();

    const errs: Record<string, string> = {};

    if (!validateRequired(addr.fullName)) errs.fullName = 'Required';
    if (!validateRequired(addr.email)) errs.email = 'Required';
    if (!validateRequired(addr.address)) errs.address = 'Required';
    if (!validateRequired(addr.city)) errs.city = 'Required';
    if (!validateRequired(addr.zipCode)) errs.zipCode = 'Required';

    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error('Fix address errors');
      return;
    }

    setErrors({});
    setStep('payment');
  };

  /* ────────────────────────────────
     PAYMENT (from Code 2 validation system)
  ──────────────────────────────── */
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: Record<string, string> = {};

    if (!validateCardNumber(pay.cardNumber)) errs.cardNumber = 'Invalid card';
    if (!validateRequired(pay.cardName)) errs.cardName = 'Required';
    if (!validateExpiryDate(pay.expiryDate)) errs.expiryDate = 'Invalid expiry';
    if (!validateCVV(pay.cvv)) errs.cvv = 'Invalid CVV';

    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error('Fix payment errors');
      return;
    }

    setStep('processing');

    try {
      const order = await createOrder({
        items: cartItems.map(i => ({
          bookId: i.bookId,
          quantity: i.quantity,
        })),
        shippingAddress: addr,
        paymentMethod: `Card ****${pay.cardNumber.slice(-4)}`,
      });

      setOrderId(order.id);
      setStep('success');

      toast.success('Order placed successfully 🎉');
      setCartItems([]);

      // The backend already clears the cart server-side on order creation,
      // but nothing told the shared CartContext to refetch — without this,
      // the Navbar badge would keep showing the old item count until the
      // next reload. Same root cause as the add-to-cart bug fixed earlier.
      refreshCart();
    } catch (err: any) {
      setStep('payment');
      toast.error(err?.response?.data?.error || 'Payment failed');
    }
  };

  if (!user) return null;

  if (loading) {
    return <div className="p-6">Loading checkout...</div>;
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-3" />
          <h2 className="text-2xl font-bold">Order Confirmed</h2>
          <p className="text-gray-500">Order ID: {orderId}</p>

          <Button className="mt-5" onClick={() => navigate('/books')}>
            Continue Shopping
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-6">

        {/* SHIPPING */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping (Validated)</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <Input
              placeholder="Full Name"
              onChange={e => setAddr({ ...addr, fullName: e.target.value })}
            />
            {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}

            <Input
              placeholder="Address"
              onChange={e => setAddr({ ...addr, address: e.target.value })}
            />

            <Button className="w-full mt-4" onClick={handleAddressContinue}>
              Continue
            </Button>
          </CardContent>
        </Card>

        {/* SUMMARY */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary & Payment</CardTitle>
          </CardHeader>

          <CardContent>
            {cartItems.map(item => (
              <div key={item.bookId} className="flex justify-between mb-2">
                <span>{item.book.title}</span>
                <span>${item.book.price}</span>
              </div>
            ))}

            <hr className="my-3" />

            <div className="font-bold mb-4">
              Total: ${subtotal.toFixed(2)}
            </div>

            {/* Card details */}
            <div className="space-y-2 mb-4">
              <Input
                placeholder="Card Number"
                value={pay.cardNumber}
                onChange={e => setPay(p => ({ ...p, cardNumber: e.target.value }))}
                maxLength={16}
              />
              {errors.cardNumber && <p className="text-red-500 text-sm">{errors.cardNumber}</p>}

              <Input
                placeholder="Name on Card"
                value={pay.cardName}
                onChange={e => setPay(p => ({ ...p, cardName: e.target.value }))}
              />
              {errors.cardName && <p className="text-red-500 text-sm">{errors.cardName}</p>}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    placeholder="MM/YY"
                    value={pay.expiryDate}
                    onChange={e => setPay(p => ({ ...p, expiryDate: e.target.value }))}
                    maxLength={5}
                  />
                  {errors.expiryDate && <p className="text-red-500 text-sm">{errors.expiryDate}</p>}
                </div>
                <div>
                  <Input
                    placeholder="CVV"
                    value={pay.cvv}
                    onChange={e => setPay(p => ({ ...p, cvv: e.target.value }))}
                    maxLength={4}
                    type="password"
                  />
                  {errors.cvv && <p className="text-red-500 text-sm">{errors.cvv}</p>}
                </div>
              </div>
            </div>

            <Button className="w-full mt-4" onClick={handlePayment}>
              Pay Now
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};