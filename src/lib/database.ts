import { User, Book, CartItem, WishlistItem, Order, Review, ReadingProgress, Bookmark, SearchHistory } from './types';

const STORAGE_KEYS = {
  USERS: 'bookhaven_users',
  BOOKS: 'bookhaven_books',
  CART: 'bookhaven_cart',
  WISHLIST: 'bookhaven_wishlist',
  ORDERS: 'bookhaven_orders',
  REVIEWS: 'bookhaven_reviews',
  READING_PROGRESS: 'bookhaven_reading_progress',
  BOOKMARKS: 'bookhaven_bookmarks',
  SEARCH_HISTORY: 'bookhaven_search_history',
};

const SAMPLE_BOOKS: Book[] = [
  {
    id: '1',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    description: 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.',
    price: 14.99,
    originalPrice: 19.99,
    coverUrl: 'https://images.pexels.com/photos/762687/pexels-photo-762687.jpeg?auto=compress&cs=tinysrgb&w=400',
    coverImage: 'https://images.pexels.com/photos/762687/pexels-photo-762687.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'Fiction',
    genre: 'Fiction',
    rating: 4.5,
    reviewCount: 1250,
    reviews: 1250,
    badge: 'bestseller',
    publishedDate: '2020-08-13',
    isbn: '978-0525559474',
    pages: 304,
    language: 'English',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    description: 'A lone astronaut must save the earth from disaster in this incredible new science-based thriller from the author of The Martian.',
    price: 16.99,
    originalPrice: 21.99,
    coverUrl: 'https://images.pexels.com/photos/2128249/pexels-photo-2128249.jpeg?auto=compress&cs=tinysrgb&w=400',
    coverImage: 'https://images.pexels.com/photos/2128249/pexels-photo-2128249.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'Science Fiction',
    genre: 'Science Fiction',
    rating: 4.8,
    reviewCount: 2340,
    reviews: 2340,
    badge: 'trending',
    publishedDate: '2021-05-04',
    isbn: '978-0593135204',
    pages: 496,
    language: 'English',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'The Seven Husbands of Evelyn Hugo',
    author: 'Taylor Jenkins Reid',
    description: 'Aging and reclusive Hollywood movie icon Evelyn Hugo is finally ready to tell the truth about her glamorous and scandalous life.',
    price: 13.99,
    coverUrl: 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400',
    coverImage: 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'Romance',
    genre: 'Romance',
    rating: 4.7,
    reviewCount: 1890,
    reviews: 1890,
    badge: 'bestseller',
    publishedDate: '2017-06-13',
    isbn: '978-1501161933',
    pages: 400,
    language: 'English',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Atomic Habits',
    author: 'James Clear',
    description: 'An easy and proven way to build good habits and break bad ones.',
    price: 15.99,
    originalPrice: 19.99,
    coverUrl: '/images/AtomicHabits.jpg',
    coverImage: '/images/AtomicHabits.jpg',
    category: 'Self-Help',
    genre: 'Self-Help',
    rating: 4.9,
    reviewCount: 3200,
    reviews: 3200,
    badge: 'bestseller',
    publishedDate: '2018-10-16',
    isbn: '978-0735211292',
    pages: 320,
    language: 'English',
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    description: "Alicia Berenson's life is seemingly perfect. A famous painter married to an in-demand fashion photographer, she lives in a grand house.",
    price: 14.99,
    coverUrl: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=400',
    coverImage: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'Mystery',
    genre: 'Mystery',
    rating: 4.6,
    reviewCount: 1567,
    reviews: 1567,
    badge: 'trending',
    publishedDate: '2019-02-05',
    isbn: '978-1250301697',
    pages: 336,
    language: 'English',
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Educated',
    author: 'Tara Westover',
    description: 'A memoir of a young woman who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge University.',
    price: 15.99,
    coverUrl: 'https://images.pexels.com/photos/1231622/pexels-photo-1231622.jpeg?auto=compress&cs=tinysrgb&w=400',
    coverImage: 'https://images.pexels.com/photos/1231622/pexels-photo-1231622.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'Biography',
    genre: 'Biography',
    rating: 4.7,
    reviewCount: 2100,
    reviews: 2100,
    badge: 'new',
    publishedDate: '2018-02-20',
    isbn: '978-0399590504',
    pages: 352,
    language: 'English',
    createdAt: new Date().toISOString(),
  },
  {
    id: '7',
    title: 'Dune',
    author: 'Frank Herbert',
    description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world.",
    price: 17.99,
    originalPrice: 22.99,
    coverUrl: 'https://images.pexels.com/photos/1556654/pexels-photo-1556654.jpeg?auto=compress&cs=tinysrgb&w=400',
    coverImage: 'https://images.pexels.com/photos/1556654/pexels-photo-1556654.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'Science Fiction',
    genre: 'Science Fiction',
    rating: 4.8,
    reviewCount: 2890,
    reviews: 2890,
    badge: 'bestseller',
    publishedDate: '1965-08-01',
    isbn: '978-0441172719',
    pages: 688,
    language: 'English',
    createdAt: new Date().toISOString(),
  },
  {
    id: '8',
    title: 'Where the Crawdads Sing',
    author: 'Delia Owens',
    description: 'For years, rumors of the "Marsh Girl" haunted Barkley Cove, a quiet fishing village. Kya Clark is barefoot and wild.',
    price: 14.99,
    coverUrl: 'https://images.pexels.com/photos/757889/pexels-photo-757889.jpeg?auto=compress&cs=tinysrgb&w=400',
    coverImage: 'https://images.pexels.com/photos/757889/pexels-photo-757889.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'Fiction',
    genre: 'Fiction',
    rating: 4.5,
    reviewCount: 1780,
    reviews: 1780,
    badge: 'trending',
    publishedDate: '2018-08-14',
    isbn: '978-0735219090',
    pages: 384,
    language: 'English',
    createdAt: new Date().toISOString(),
  },
  {
    id: '9',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    description: "Doing well with money isn't necessarily about what you know. It's about how you behave.",
    price: 15.99,
    coverUrl: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=400',
    coverImage: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'Finance',
    genre: 'Finance',
    rating: 4.8,
    reviewCount: 2456,
    reviews: 2456,
    badge: 'new',
    publishedDate: '2020-09-08',
    isbn: '978-0857197689',
    pages: 256,
    language: 'English',
    createdAt: new Date().toISOString(),
  },
  {
    id: '10',
    title: 'The Invisible Life of Addie LaRue',
    author: 'V.E. Schwab',
    description: 'A Life No One Will Remember. A Story You Will Never Forget. France, 1714: in a moment of desperation, a young woman makes a Faustian bargain.',
    price: 16.99,
    coverUrl: 'https://images.pexels.com/photos/3721941/pexels-photo-3721941.jpeg?auto=compress&cs=tinysrgb&w=400',
    coverImage: 'https://images.pexels.com/photos/3721941/pexels-photo-3721941.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'Fantasy',
    genre: 'Fantasy',
    rating: 4.6,
    reviewCount: 1456,
    reviews: 1456,
    badge: 'new',
    publishedDate: '2020-10-06',
    isbn: '978-0765387561',
    pages: 448,
    language: 'English',
    createdAt: new Date().toISOString(),
  },
];

class Database {
  initializeDatabase() {
    const existingBooks = localStorage.getItem(STORAGE_KEYS.BOOKS);

    if (!existingBooks || JSON.parse(existingBooks).length === 0) {
      localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(SAMPLE_BOOKS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      const adminUser: User = {
        id: 'admin-1',
        email: 'admin@bookhaven.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([adminUser]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CART)) {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WISHLIST)) {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.READING_PROGRESS)) {
      localStorage.setItem(STORAGE_KEYS.READING_PROGRESS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BOOKMARKS)) {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY)) {
      localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify([]));
    }
  }

  getUsers(): User[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  }

  saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  getBooks(): Book[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKS) || '[]');
  }

  saveBooks(books: Book[]) {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  }

  getCart(): CartItem[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || '[]');
  }

  saveCart(cart: CartItem[]) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }

  getWishlist(): WishlistItem[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.WISHLIST) || '[]');
  }

  saveWishlist(wishlist: WishlistItem[]) {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
  }

  getOrders(): Order[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
  }

  saveOrders(orders: Order[]) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }

  getReviews(): Review[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEWS) || '[]');
  }

  saveReviews(reviews: Review[]) {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  }

  // Reading Progress Methods
  getReadingProgress(): ReadingProgress[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.READING_PROGRESS) || '[]');
  }

  saveReadingProgress(progress: ReadingProgress) {
    const allProgress = this.getReadingProgress();
    const existingIndex = allProgress.findIndex(
      p => p.userId === progress.userId && p.bookId === progress.bookId
    );

    if (existingIndex >= 0) {
      allProgress[existingIndex] = progress;
    } else {
      allProgress.push(progress);
    }

    localStorage.setItem(STORAGE_KEYS.READING_PROGRESS, JSON.stringify(allProgress));
  }

  getUserBookProgress(userId: string, bookId: string): ReadingProgress | null {
    const allProgress = this.getReadingProgress();
    return allProgress.find(p => p.userId === userId && p.bookId === bookId) || null;
  }

  // Bookmark Methods
  getBookmarks(): Bookmark[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS) || '[]');
  }

  addBookmark(bookmark: Bookmark) {
    const bookmarks = this.getBookmarks();
    bookmarks.push(bookmark);
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  }

  removeBookmark(bookmarkId: string) {
    const bookmarks = this.getBookmarks();
    const filtered = bookmarks.filter(b => b.id !== bookmarkId);
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(filtered));
  }

  getUserBookBookmarks(userId: string, bookId: string): Bookmark[] {
    const bookmarks = this.getBookmarks();
    return bookmarks.filter(b => b.userId === userId && b.bookId === bookId);
  }

  // Search History Methods
  getSearchHistory(): SearchHistory[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY) || '[]');
  }

  addSearchHistory(userId: string, query: string) {
    const history = this.getSearchHistory();
    const newEntry: SearchHistory = {
      id: `search-${Date.now()}`,
      userId,
      query,
      timestamp: new Date().toISOString(),
    };
    
    // Keep only last 20 searches per user
    const userHistory = history.filter(h => h.userId === userId);
    const otherHistory = history.filter(h => h.userId !== userId);
    
    userHistory.unshift(newEntry);
    const limitedUserHistory = userHistory.slice(0, 20);
    
    localStorage.setItem(
      STORAGE_KEYS.SEARCH_HISTORY,
      JSON.stringify([...limitedUserHistory, ...otherHistory])
    );
  }

  getUserSearchHistory(userId: string, limit: number = 10): SearchHistory[] {
    const history = this.getSearchHistory();
    return history
      .filter(h => h.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}

export const db = new Database();