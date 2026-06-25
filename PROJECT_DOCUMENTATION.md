# BookHaven - Complete Project Documentation

## Project Overview

BookHaven is a full-featured e-commerce digital bookstore application that allows users to browse, search, purchase, and manage their digital book collection. The platform includes a complete user authentication system, shopping cart functionality, order management, and an admin dashboard for managing inventory.

### Key Statistics
- **10 Sample Books** with full details (title, author, description, price, ratings, reviews)
- **Multiple User Roles** (User, Admin)
- **Full E-commerce Flow** (Browse → Search → Cart → Checkout → Library)
- **Responsive Design** optimized for mobile, tablet, and desktop
- **Modern UI** with Tailwind CSS and Shadcn-ui components

---

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn-ui (50+ pre-built components)
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Notifications**: Sonner Toast Library
- **Build Tool**: Vite
- **Package Manager**: npm

### Current Data Storage
- **LocalStorage**: Browser-based data persistence (for demo purposes)

---

## Project Structure

```
src/
├── pages/                    # Page components (10 total)
│   ├── Index.tsx            # Homepage with hero section
│   ├── Auth.tsx             # Login/Register page
│   ├── Books.tsx            # Book catalog with filters
│   ├── BookDetail.tsx       # Individual book details
│   ├── Cart.tsx             # Shopping cart
│   ├── Checkout.tsx         # Payment processing
│   ├── Library.tsx          # User's digital library
│   ├── Wishlist.tsx         # Saved books
│   ├── Profile.tsx          # User account & orders
│   └── Admin.tsx            # Admin dashboard
├── components/              # Reusable components
│   ├── Navbar.tsx           # Navigation bar
│   ├── BookCard.tsx         # Book display card
│   └── ui/                  # 50+ Shadcn-ui components
├── contexts/               # React contexts
│   └── AuthContext.tsx      # Global auth state
├── lib/                    # Utilities & helpers
│   ├── types.ts            # TypeScript interfaces
│   ├── database.ts         # Data management
│   ├── auth.ts             # Authentication logic
│   └── utils.ts            # Helper functions
├── App.tsx                 # Main app component with routing
├── main.tsx               # App entry point
└── index.css              # Global styles
```

---

## Data Models

### User
```typescript
interface User {
  id: string;              // Unique identifier
  email: string;           // Email address (unique)
  password: string;        // User password (hashed in production)
  name: string;            // Full name
  role: 'user' | 'admin';  // User role
  createdAt: string;       // Account creation timestamp
}
```

### Book
```typescript
interface Book {
  id: string;              // Unique book ID
  title: string;           // Book title
  author: string;          // Author name
  description: string;     // Book description
  price: number;           // Price in USD
  coverImage: string;      // Book cover image URL
  genre: string;           // Genre category
  rating: number;          // Average rating (0-5)
  reviews: number;         // Number of reviews
  stock: number;           // Available quantity
  createdAt: string;       // Created timestamp
}
```

### CartItem
```typescript
interface CartItem {
  id: string;              // Unique cart item ID
  userId: string;          // User who owns cart
  bookId: string;          // Reference to book
  quantity: number;        // Number of copies
  addedAt: string;         // Added timestamp
}
```

### WishlistItem
```typescript
interface WishlistItem {
  id: string;              // Unique wishlist item ID
  userId: string;          // User who owns wishlist
  bookId: string;          // Reference to book
  addedAt: string;         // Added timestamp
}
```

### Order
```typescript
interface Order {
  id: string;              // Unique order ID
  userId: string;          // User who placed order
  items: OrderItem[];      // Items in order
  total: number;           // Order total
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;       // Order timestamp
}
```

### Review
```typescript
interface Review {
  id: string;              // Unique review ID
  userId: string;          // User who wrote review
  bookId: string;          // Book being reviewed
  rating: number;          // Rating (1-5)
  comment: string;         // Review text
  createdAt: string;       // Created timestamp
}
```

---

## Features

### 1. User Authentication
- **Sign Up**: Create new account with email, password, and name
- **Sign In**: Login with email and password
- **Session Management**: Auth state persists across browser sessions
- **Role-Based Access**: Different permissions for users and admins

### 2. Book Catalog
- **Browse Books**: View all 10 sample books with details
- **Search**: Real-time search by title or author
- **Filter by Genre**: Filter books by category
- **Sort Options**: Sort by title, price (low-high), rating
- **Price Range Filter**: Set min/max price for filtering

### 3. Book Details Page
- **Full Information**: Title, author, description, price, genre
- **Ratings & Reviews**: Display customer ratings and reviews
- **Add to Cart**: Purchase the book
- **Add to Wishlist**: Save for later
- **Stock Status**: Show availability

### 4. Shopping Cart
- **Add Items**: Add books with quantity selection
- **Manage Quantity**: Increase/decrease quantities
- **Remove Items**: Delete items from cart
- **Real-time Total**: Automatic price calculation
- **Proceed to Checkout**: Move to payment

### 5. Checkout Process
- **Payment Form**: Card details, billing address
- **Order Summary**: Items, quantities, and total
- **Order Processing**: Simulated payment processing (2-second delay)
- **Order Confirmation**: Success message with redirect

### 6. User Library
- **Purchased Books**: Display all books user has purchased
- **Book Cards**: Quick access to book details
- **Read & Download**: Options to read or download books
- **Purchase History**: Track all purchases

### 7. Wishlist
- **Save for Later**: Add books without purchasing
- **Quick Add to Cart**: Move wishlist items to cart
- **Remove Items**: Delete from wishlist
- **Availability Status**: Show stock status

### 8. User Profile
- **Account Info**: Name, email, role
- **Statistics**: Total books purchased, orders, money spent
- **Order History**: Full details of past orders with items

### 9. Admin Dashboard
- **Book Management**: Add, edit, delete books
- **Inventory Control**: Manage stock levels
- **User Management**: View all registered users
- **Order Tracking**: Monitor all orders
- **Sales Analytics**: Revenue, order count, total users

### 10. Responsive Navigation
- **Desktop Menu**: Full navigation with dropdowns
- **Mobile Menu**: Hamburger menu with all options
- **Search Bar**: Global search functionality
- **User Dropdown**: Account options and quick links

---

## User Flows

### Customer Journey
1. **Browse** → Homepage with featured books
2. **Search/Filter** → Find books using search and filters
3. **View Details** → Check book information and reviews
4. **Add to Cart/Wishlist** → Save items for purchase
5. **Checkout** → Complete payment process
6. **Library** → Access purchased digital books
7. **Profile** → Track orders and account info

### Admin Journey
1. **Login** → Use admin credentials
2. **Dashboard** → Access admin panel
3. **Manage Books** → CRUD operations on inventory
4. **Monitor Orders** → View and track customer orders
5. **User Management** → View all registered users
6. **Analytics** → See sales statistics

---

## Current Implementation Status

### ✅ Completed
- Frontend UI/UX design
- All 10 pages and components
- User authentication system
- Shopping cart functionality
- Checkout process
- Admin dashboard
- Responsive design
- Search and filtering
- LocalStorage data persistence
- Toast notifications

### ⚠️ In Progress (Frontend)
- Data validation and error handling
- Loading states on buttons
- Pagination for large datasets

---

---

# BACKEND IMPLEMENTATION GUIDE

## Overview

The backend needs to handle:
1. User authentication and authorization
2. Book inventory management
3. Order processing
4. Payment integration
5. User data management
6. Review and rating system
7. Admin operations

---

## Backend Technology Recommendations

### Framework Options
- **Node.js + Express.js** (Lightweight, JavaScript)
- **Node.js + Fastify** (Faster alternative)
- **Python + Django/FastAPI** (Robust, scalable)
- **Supabase** (Backend-as-a-Service, fastest setup)

### Recommended: **Supabase Backend**
(Since it's already available in your environment)

---

## Database Schema

### Tables to Create

#### 1. users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### 2. books
```sql
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  cover_image TEXT,
  genre TEXT,
  rating DECIMAL(3, 2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### 3. cart_items
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  added_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, book_id)
);
```

#### 4. wishlist_items
```sql
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, book_id)
);
```

#### 5. orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### 6. order_items
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id),
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);
```

#### 7. reviews
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, book_id)
);
```

---

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
```json
Request:
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Response:
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "token": "jwt-token"
}
```

#### POST /api/auth/login
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "token": "jwt-token"
}
```

#### POST /api/auth/logout
```json
Request: {}
Response: { "message": "Logged out successfully" }
```

---

### Book Endpoints

#### GET /api/books
```json
Query params:
  - page=1
  - limit=10
  - search=title
  - genre=Fiction
  - sort=price&order=asc

Response:
{
  "books": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### GET /api/books/:id
```json
Response:
{
  "id": "book-uuid",
  "title": "Book Title",
  "author": "Author Name",
  "price": 15.99,
  ...
}
```

#### POST /api/books (Admin only)
```json
Request:
{
  "title": "New Book",
  "author": "Author",
  "description": "...",
  "price": 19.99,
  "genre": "Fiction",
  "stock": 100,
  "cover_image": "url"
}

Response: { created book object }
```

#### PUT /api/books/:id (Admin only)
```json
Request: { fields to update }
Response: { updated book object }
```

#### DELETE /api/books/:id (Admin only)
```json
Response: { "message": "Book deleted" }
```

---

### Cart Endpoints

#### GET /api/cart
```json
Response:
{
  "items": [
    {
      "id": "cart-item-uuid",
      "book": { book object },
      "quantity": 2
    }
  ],
  "total": 39.98
}
```

#### POST /api/cart
```json
Request:
{
  "book_id": "book-uuid",
  "quantity": 1
}

Response: { added item }
```

#### PUT /api/cart/:id
```json
Request: { "quantity": 3 }
Response: { updated cart item }
```

#### DELETE /api/cart/:id
```json
Response: { "message": "Item removed" }
```

#### DELETE /api/cart
```json
Response: { "message": "Cart cleared" }
```

---

### Wishlist Endpoints

#### GET /api/wishlist
```json
Response:
{
  "items": [
    { "id": "...", "book": {...} }
  ]
}
```

#### POST /api/wishlist
```json
Request: { "book_id": "book-uuid" }
Response: { added item }
```

#### DELETE /api/wishlist/:id
```json
Response: { "message": "Removed from wishlist" }
```

---

### Order Endpoints

#### GET /api/orders
```json
Response:
{
  "orders": [
    {
      "id": "order-uuid",
      "items": [...],
      "total": 100.00,
      "status": "completed",
      "created_at": "2024-10-31T10:00:00Z"
    }
  ]
}
```

#### POST /api/orders
```json
Request:
{
  "items": [
    { "book_id": "uuid", "quantity": 2 }
  ],
  "payment_method": "credit_card",
  "payment_token": "stripe-token"
}

Response:
{
  "id": "order-uuid",
  "status": "completed",
  "total": 100.00
}
```

#### GET /api/orders/:id
```json
Response: { order details }
```

---

### Review Endpoints

#### GET /api/books/:id/reviews
```json
Response:
{
  "reviews": [
    {
      "id": "review-uuid",
      "rating": 5,
      "comment": "Great book!",
      "user": { "name": "..." },
      "created_at": "..."
    }
  ]
}
```

#### POST /api/books/:id/reviews
```json
Request:
{
  "rating": 5,
  "comment": "Amazing!"
}

Response: { created review }
```

---

### User Endpoints

#### GET /api/users/me
```json
Response:
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user"
}
```

#### PUT /api/users/me
```json
Request:
{
  "name": "New Name",
  "email": "newemail@example.com"
}

Response: { updated user }
```

#### POST /api/users/me/change-password
```json
Request:
{
  "current_password": "...",
  "new_password": "..."
}

Response: { "message": "Password changed" }
```

---

### Admin Endpoints

#### GET /api/admin/stats
```json
Response:
{
  "total_revenue": 5000.00,
  "total_orders": 150,
  "total_users": 50,
  "total_books": 10
}
```

#### GET /api/admin/users
```json
Response:
{
  "users": [...]
}
```

#### PUT /api/admin/users/:id (Admin only)
```json
Request: { "role": "admin" }
Response: { updated user }
```

---

## Security Requirements

### Authentication
- ✅ JWT tokens for session management
- ✅ Password hashing (bcrypt or similar)
- ✅ Secure password reset flow
- ✅ Email verification (optional)

### Authorization
- ✅ Role-based access control (RBAC)
- ✅ Admin-only endpoints protection
- ✅ User data isolation
- ✅ Rate limiting

### Data Protection
- ✅ HTTPS/TLS encryption in transit
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Input validation and sanitization

### Payment Security
- ✅ Use Stripe/PayPal SDK (never handle raw card data)
- ✅ PCI compliance
- ✅ Webhooks for payment verification

---

## Implementation Steps

### Phase 1: Database Setup
1. Create all tables with proper constraints
2. Add indexes for frequently queried columns
3. Set up Row Level Security (RLS) policies
4. Seed sample data (10 books)

### Phase 2: Authentication
1. Implement user registration
2. Implement user login with JWT
3. Implement password hashing
4. Implement password reset (email-based)
5. Add session validation

### Phase 3: Book Management
1. CRUD operations for books
2. Search and filtering logic
3. Category/genre management
4. Stock management

### Phase 4: Shopping Features
1. Cart management (add, update, remove)
2. Wishlist functionality
3. Price calculations
4. Stock validation

### Phase 5: Orders & Payments
1. Order creation from cart
2. Order history tracking
3. Stripe/PayPal integration
4. Webhook handlers for payment confirmation
5. Order status management

### Phase 6: Reviews & Ratings
1. Review creation and validation
2. Rating calculations
3. Review moderation (optional)

### Phase 7: Admin Features
1. Dashboard statistics
2. Book management interface
3. User management
4. Order management
5. Analytics and reporting

### Phase 8: Testing & Deployment
1. Unit tests for API endpoints
2. Integration tests
3. Load testing
4. Security testing
5. Deployment setup

---

## Payment Integration (Stripe Example)

### Stripe Integration
```javascript
// Backend webhook handler
POST /api/webhooks/stripe
- Listen for payment.intent.succeeded
- Verify payment amount and items
- Update order status to 'completed'
- Clear user's cart
- Send confirmation email

// Frontend
- Use Stripe SDK for payment form
- Get payment token from Stripe
- Send to backend along with order data
```

---

## Email Notifications

### Emails to Send
1. **Order Confirmation** - After successful purchase
2. **Order Shipped** - When order is processed
3. **Password Reset** - Password reset link
4. **Welcome Email** - New account creation
5. **Review Reminder** - Post-purchase review request

---

## Performance Optimization

### Database Optimization
- ✅ Add indexes on frequently searched columns
- ✅ Use pagination for large datasets
- ✅ Implement database connection pooling
- ✅ Cache frequently accessed data

### API Optimization
- ✅ Compress API responses (gzip)
- ✅ Implement API rate limiting
- ✅ Use query result caching
- ✅ Lazy load related data

---

## Monitoring & Logging

### What to Monitor
- API response times
- Database query performance
- Error rates
- User registration and login attempts
- Payment transaction success/failure rates

### Logging
- All API requests and responses
- Authentication attempts
- Payment transactions
- Admin actions
- Error stack traces

---

## Environment Variables

```
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=your-super-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
NODE_ENV=production
PORT=3000
```

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] JWT secret generated and secured
- [ ] CORS configured correctly
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Logging set up
- [ ] Error handling implemented
- [ ] Payment integration tested
- [ ] Webhooks configured
- [ ] Email service configured
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] API documentation completed

---

## Next Steps

1. **Choose Backend Stack**: Supabase, Node.js + Express, or Django
2. **Set Up Database**: Create tables and relationships
3. **Implement Authentication**: JWT-based auth system
4. **Build API Endpoints**: Follow the endpoint specifications
5. **Integrate Payment**: Stripe or PayPal
6. **Testing**: Unit, integration, and E2E tests
7. **Deployment**: Deploy to production environment

This comprehensive guide will help you build a robust backend that supports all the frontend features currently implemented in BookHaven.
