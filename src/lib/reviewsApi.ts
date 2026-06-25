/**
 * reviewsApi.ts
 * Replaces db.getReviews() / db.saveReviews() in BookDetail.tsx.
 */
import api from './api';

export interface ReviewAPI {
  id:             string;
  userId:         string;
  bookId:         string;
  userName:       string;
  rating:         number;
  comment:        string;
  sentimentScore?: number;
  createdAt:      string;
}

export async function getBookReviews(bookId: string, page = 1): Promise<{ reviews: ReviewAPI[]; total: number }> {
  const { data } = await api.get(`/reviews/book/${bookId}`, { params: { page } });
  return data;
}

export async function postReview(bookId: string, rating: number, comment: string): Promise<ReviewAPI> {
  const { data } = await api.post<ReviewAPI>('/reviews/', { bookId, rating, comment });
  return data;
}