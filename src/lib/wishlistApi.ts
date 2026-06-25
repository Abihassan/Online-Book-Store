/**
 * wishlistApi.ts
 * Wishlist API helpers.
 */

import api from './api';
import { Book } from './types';

// ── Types ────────────────────────────────────────────────────────────────────

// Book object enriched with wishlist item id
export interface WishlistBook extends Book {
  wishlistItemId: string;
}

// ── Get Wishlist ─────────────────────────────────────────────────────────────

export async function getWishlist(): Promise<WishlistBook[]> {
  const { data } = await api.get<WishlistBook[]>(
    '/wishlist/'
  );

  return data;
}

// ── Add To Wishlist ──────────────────────────────────────────────────────────

export async function addToWishlist(
  bookId: string
): Promise<{ id: string }> {
  const { data } = await api.post<{ id: string }>(
    '/wishlist/',
    {
      bookId,
    }
  );

  return data;
}

// ── Remove From Wishlist ─────────────────────────────────────────────────────

export async function removeFromWishlist(
  itemId: string
): Promise<void> {
  await api.delete(`/wishlist/${itemId}`);
}