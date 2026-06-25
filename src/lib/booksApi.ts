/**
 * booksApi.ts
 * Replaces all db.getBooks() / db.saveBooks() calls throughout the app.
 */
import api from './api';
import { Book } from './types';

export interface BooksParams {
  page?:       number;
  per_page?:   number;
  search?:     string;
  genre?:      string;
  author?:     string;
  sort_by?:    'title' | 'price-low' | 'price-high' | 'rating' | 'newest';
  min_price?:  number;
  max_price?:  number;
  min_rating?: number;
}

export interface BooksResponse {
  books:    Book[];
  total:    number;
  page:     number;
  pages:    number;
  per_page: number;
}

// ── Get paginated + filtered books ────────────────────────────────────────────
export async function getBooks(params: BooksParams = {}): Promise<BooksResponse> {
  const { data } = await api.get<BooksResponse>('/books/', { params });
  return data;
}

// ── Get single book ───────────────────────────────────────────────────────────
export async function getBook(id: string): Promise<Book> {
  const { data } = await api.get<Book>(`/books/${id}`);
  return data;
}

// ── Admin: create book ────────────────────────────────────────────────────────
export async function createBook(book: Partial<Book>): Promise<Book> {
  const { data } = await api.post<Book>('/books/', book);
  return data;
}

// ── Admin: update book ────────────────────────────────────────────────────────
export async function updateBook(id: string, updates: Partial<Book>): Promise<Book> {
  const { data } = await api.put<Book>(`/books/${id}`, updates);
  return data;
}

// ── Admin: delete book ────────────────────────────────────────────────────────
export async function deleteBook(id: string): Promise<void> {
  await api.delete(`/books/${id}`);
}

// ── Admin: upload PDF/EPUB file ───────────────────────────────────────────────
export async function uploadBookFile(bookId: string, file: File): Promise<{ filename: string }> {
  const form = new FormData();
  form.append('file', file);
  form.append('book_id', bookId);
  const { data } = await api.post<{ filename: string }>('/books/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// ── Download book file (triggers browser download) ───────────────────────────
export function downloadBookUrl(bookId: string): string {
  return `${import.meta.env.VITE_FLASK_URL || 'http://localhost:5000/api'}/books/${bookId}/download`;
}

export async function downloadBook(bookId: string, title: string): Promise<void> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(downloadBookUrl(bookId), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = title;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}