/**
 * cartApi.ts
 * Replaces db.getCart() / db.saveCart() throughout Cart.tsx and Navbar.tsx.
 */
import api from './api';

export interface CartItemAPI {
  id:      string;
  userId:  string;
  bookId:  string;
  quantity: number;
  price:   number;
  addedAt: string;
}

export async function getCart(): Promise<CartItemAPI[]> {
  const { data } = await api.get<CartItemAPI[]>('/cart/');
  return data;
}

export async function addToCart(bookId: string, quantity = 1): Promise<CartItemAPI[]> {
  const { data } = await api.post<CartItemAPI[]>('/cart/', { bookId, quantity });
  return data;
}

export async function updateCartItem(itemId: string, quantity: number): Promise<void> {
  await api.put(`/cart/${itemId}`, { quantity });
}

export async function removeCartItem(itemId: string): Promise<void> {
  await api.delete(`/cart/${itemId}`);
}