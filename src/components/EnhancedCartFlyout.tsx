import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { Book } from '../lib/types';

interface CartItem {
  id: string;
  bookId: string;
  quantity: number;
}

interface EnhancedCartFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  books: Book[];
  recommendedBooks: Book[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onAddRecommended: (bookId: string) => void;
  onCheckout: () => void;
}

export const EnhancedCartFlyout = ({
  isOpen,
  onClose,
  items,
  books,
  recommendedBooks,
  onUpdateQuantity,
  onRemoveItem,
  onAddRecommended,
  onCheckout
}: EnhancedCartFlyoutProps) => {
  const getBookById = (bookId: string) => books.find(b => b.id === bookId);
  
  const subtotal = items.reduce((sum, item) => {
    const book = getBookById(item.bookId);
    return sum + (book ? book.price * item.quantity : 0);
  }, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-orange-200/30 z-40" onClick={onClose} />
      
      {/* Cart Flyout - Reduced width */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-80 bg-white z-50 shadow-2xl flex flex-col border-l-2 border-orange-300">
        {/* Header */}
        <div className="p-3 border-b-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800">Cart ({items.length})</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          {subtotal > 0 && (
            <div className="mt-2 bg-amber-100 text-amber-800 text-sm px-2 py-1.5 rounded border border-amber-300">
              Total: ${subtotal.toFixed(2)}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-orange-50/30 to-yellow-50/30">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-5xl mb-3">📚</div>
              <p className="text-base font-medium">Your cart is empty</p>
              <p className="text-sm">Add some books to get started</p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {items.map((item) => {
                const book = getBookById(item.bookId);
                if (!book) return null;

                return (
                  <div key={item.id} className="flex space-x-2 bg-white p-2 rounded-lg border border-orange-200 shadow-sm">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-12 h-16 object-cover rounded border border-orange-100"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-xs text-gray-800 truncate">{book.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="font-semibold text-sm text-orange-600">${book.price.toFixed(2)}</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="p-0.5 hover:bg-orange-100 rounded text-gray-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-medium w-6 text-center text-gray-700">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-0.5 hover:bg-orange-100 rounded text-gray-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="p-0.5 hover:bg-red-100 text-red-500 rounded ml-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Recommended Books */}
              {recommendedBooks.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-sm text-gray-800 mb-2">You might also like</h3>
                  <div className="space-y-2">
                    {recommendedBooks.slice(0, 2).map((book) => (
                      <div key={book.id} className="flex space-x-2 p-2 border border-orange-200 rounded-lg bg-white">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded border border-orange-100"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-gray-800 truncate">{book.title}</h4>
                          <p className="text-xs text-gray-500">{book.author}</p>
                          <span className="text-xs font-semibold text-orange-600">${book.price.toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => onAddRecommended(book.id)}
                          className="text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-2 py-1 rounded font-medium h-fit"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-3 border-t-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-800">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-1.5 border-t border-orange-200">
                <span className="text-gray-800">Total</span>
                <span className="text-orange-600">${subtotal.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={onCheckout}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-2.5 rounded-lg font-semibold transition-all shadow-md"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};