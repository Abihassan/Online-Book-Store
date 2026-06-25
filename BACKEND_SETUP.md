# BookHaven Backend Setup Guide

## Quick Start with Supabase (Recommended)

Since you have Supabase available, this is the fastest way to set up the backend.

### Step 1: Create Database Tables

Execute these SQL commands in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Books table
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Cart items table
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Wishlist items table
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  payment_method TEXT,
  shipping_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Create indexes for better performance
CREATE INDEX idx_books_genre ON books(genre);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_reviews_book_id ON reviews(book_id);
```

### Step 2: Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users: Users can only read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Users: Admin can read all users
CREATE POLICY "Admin can read all users" ON users
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Books: Public read access
CREATE POLICY "Books are public" ON books
  FOR SELECT TO authenticated
  USING (true);

-- Books: Only admin can insert, update, delete
CREATE POLICY "Admin can manage books" ON books
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin can update books" ON books
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin can delete books" ON books
  FOR DELETE TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Cart items: Users can manage their own cart
CREATE POLICY "Users can view own cart" ON cart_items
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own cart" ON cart_items
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart" ON cart_items
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own cart" ON cart_items
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Wishlist items: Users can manage their own wishlist
CREATE POLICY "Users can view own wishlist" ON wishlist_items
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own wishlist" ON wishlist_items
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own wishlist" ON wishlist_items
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Orders: Users can view their own, admin can view all
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Order items: Same as orders
CREATE POLICY "Users can view order items" ON order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin')
    )
  );

-- Reviews: Public read, authenticated users can add
CREATE POLICY "Reviews are public" ON reviews
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

### Step 3: Seed Sample Data

```sql
-- Insert sample books
INSERT INTO books (title, author, description, price, genre, stock, rating, reviews_count, cover_image)
VALUES
  ('The Midnight Library', 'Matt Haig', 'Between life and death there is a library...', 14.99, 'Fiction', 45, 4.5, 1250, 'https://images.pexels.com/photos/762687/pexels-photo-762687.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Project Hail Mary', 'Andy Weir', 'A lone astronaut must save the earth from disaster...', 16.99, 'Science Fiction', 32, 4.8, 2340, 'https://images.pexels.com/photos/2128249/pexels-photo-2128249.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('The Seven Husbands of Evelyn Hugo', 'Taylor Jenkins Reid', 'Aging and reclusive Hollywood movie icon...', 13.99, 'Romance', 28, 4.7, 1890, 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Atomic Habits', 'James Clear', 'An easy and proven way to build good habits...', 15.99, 'Self-Help', 67, 4.9, 3200, 'https://images.pexels.com/photos/4132936/pexels-photo-4132936.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('The Silent Patient', 'Alex Michaelides', 'Alicia Berenson''s life is seemingly perfect...', 14.99, 'Mystery', 41, 4.6, 1567, 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Educated', 'Tara Westover', 'A memoir of a young woman who left her survivalist family...', 15.99, 'Biography', 55, 4.7, 2100, 'https://images.pexels.com/photos/1231622/pexels-photo-1231622.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Dune', 'Frank Herbert', 'Set on the desert planet Arrakis...', 17.99, 'Science Fiction', 38, 4.8, 2890, 'https://images.pexels.com/photos/1556654/pexels-photo-1556654.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Where the Crawdads Sing', 'Delia Owens', 'For years, rumors of the Marsh Girl haunted Barkley Cove...', 14.99, 'Fiction', 49, 4.5, 1780, 'https://images.pexels.com/photos/757889/pexels-photo-757889.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('The Psychology of Money', 'Morgan Housel', 'Doing well with money isn''t necessarily about what you know...', 15.99, 'Finance', 62, 4.8, 2456, 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('The Invisible Life of Addie LaRue', 'V.E. Schwab', 'Between life and death, a young woman makes a Faustian bargain...', 16.99, 'Fantasy', 34, 4.6, 1456, 'https://images.pexels.com/photos/3721941/pexels-photo-3721941.jpeg?auto=compress&cs=tinysrgb&w=400');
```

### Step 4: Create Authentication with Supabase Auth

Use Supabase's built-in authentication:

```javascript
// In your backend/frontend code
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

### Step 5: Create API Routes (Edge Functions)

Create Supabase Edge Functions for custom business logic:

```bash
supabase functions new create-order
supabase functions new process-payment
supabase functions new generate-invoice
```

---

## Backend API Implementation

### Option 1: Node.js + Express (Recommended for Learning)

```bash
npm init -y
npm install express dotenv cors axios bcryptjs jsonwebtoken
npm install --save-dev nodemon
```

**server.js**:
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Environment Variables Setup

Create `.env` file in backend:

```
DATABASE_URL=postgresql://user:password@host:5432/bookhaven
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
SENDGRID_API_KEY=SG.xxxxx
NODE_ENV=development
PORT=5000

# Supabase (if using Supabase backend)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

---

## Frontend Integration with Backend

Update your frontend to use backend APIs instead of localStorage:

```typescript
// Before (localStorage)
const cart = db.getCart();

// After (Backend API)
const response = await fetch('/api/cart', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
const { items } = await response.json();
```

---

## Testing the Backend

### Using Postman or cURL

```bash
# Test sign up
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Test get books
curl http://localhost:5000/api/books

# Test add to cart
curl -X POST http://localhost:5000/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "book_id": "book-uuid",
    "quantity": 1
  }'
```

---

## Deployment Options

### Option 1: Supabase (Easiest)
- Already set up for you
- Free tier available
- No additional setup needed

### Option 2: Heroku
```bash
heroku create bookhaven-backend
heroku config:set DATABASE_URL=...
git push heroku main
```

### Option 3: AWS (Scalable)
- Use EC2 for compute
- RDS for database
- Elastic Load Balancer for scaling

### Option 4: Railway.app (Modern, Easy)
```bash
# Connect GitHub repo
# Set environment variables
# Deploy automatically
```

---

## Next Steps

1. **Choose deployment method** (Supabase recommended)
2. **Set up database** with provided SQL
3. **Create authentication** system
4. **Build API endpoints** according to specifications
5. **Integrate with frontend**
6. **Add payment processing** (Stripe)
7. **Set up email notifications**
8. **Deploy to production**

---

## Troubleshooting

### Common Issues

**1. CORS Error**
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
```

**2. Database Connection Error**
- Check DATABASE_URL format
- Verify database is running
- Check network connectivity

**3. JWT Authentication Failing**
- Verify JWT_SECRET is consistent
- Check token expiration
- Ensure Bearer token format is correct

**4. Port Already in Use**
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

---

## Performance Tips

1. **Add database indexes** for frequently queried columns
2. **Implement pagination** for large datasets
3. **Use connection pooling** for databases
4. **Cache frequently accessed data** (Redis)
5. **Enable GZIP compression** for API responses
6. **Use CDN** for static files

---

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Hash passwords with bcrypt
- [ ] Implement rate limiting
- [ ] Validate all inputs
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for trusted origins
- [ ] Implement request logging
- [ ] Add error handling
- [ ] Use SQL parameterized queries
- [ ] Enable database backups

Your BookHaven backend is now ready to be developed!
