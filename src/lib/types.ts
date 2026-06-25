export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'customer' | 'admin';
  is_active: boolean;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  coverImage: string;
  price: number;
  originalPrice?: number;
  category: string;
  genre: string;
  rating: number;
  reviewCount: number;
  reviews: number;
  badge?: 'new' | 'sale' | 'bestseller' | 'trending';
  publishedDate: string;
  isbn: string;
  pages: number;
  language: string;
  stock?: number;
  createdAt: string;
  fileUrl?: string;
  isFree?: boolean;
}

export interface CartItem {
  id: string;
  userId: string;
  bookId: string;
  quantity: number;
  price: number;
  addedAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  bookId: string;
  addedAt: string;
}

export interface Purchase {
  id: string;
  userId: string;
  bookId: string;
  purchaseDate: string;
  price: number;
}

export interface OrderItem {
  bookId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
}

export interface Review {
  id: string;
  userId: string;
  bookId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReadingProgress {
  id: string;
  userId: string;
  bookId: string;
  currentPage: number;
  totalPages: number;
  lastRead: string;
  progressPercentage: number;
}

export interface Bookmark {
  id: string;
  userId: string;
  bookId: string;
  page: number;
  note: string;
  createdAt: string;
}

export interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  timestamp: string;
}