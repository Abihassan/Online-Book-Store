/**
 * adminApi.ts
 * Admin + ML analytics API helpers.
 */

import api, { fastapiClient } from './api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalBooks: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface RevenuePoint {
  month: string;
  revenue: number;
}

export interface TopBook {
  title: string;
  sales: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  createdAt: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  pages: number;
}

// ── Reading Analytics Types ──────────────────────────────────────────────────

export interface HeatmapPoint {
  day: string;
  hour: number;
  value: number;
}

export interface GenreTrend {
  genre: string;
  value: number;
}

export interface PeakHour {
  hour: number;
  users: number;
}

export interface TopEngagingBook {
  bookId: string;
  title: string;
  engagement: number;
}

export interface ReadingStats {
  heatmap: HeatmapPoint[];
  genreTrends: GenreTrend[];
  peakHours: PeakHour[];
  topEngaging: TopEngagingBook[];
}

// ── ML Recommendation Types ──────────────────────────────────────────────────

export interface RecommendationsResponse {
  recommendations: string[];
}

// ── Sentiment Types ──────────────────────────────────────────────────────────

export interface BookSentiment {
  sentiment: string;
  score: number;
  reviewCount: number;
}

// ── Stats cards ──────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>(
    '/admin/stats'
  );

  return data;
}

// ── Monthly revenue (bar chart) ──────────────────────────────────────────────

export async function getMonthlyRevenue(): Promise<
  RevenuePoint[]
> {
  const { data } = await api.get<RevenuePoint[]>(
    '/admin/revenue'
  );

  return data;
}

// ── Top selling books ────────────────────────────────────────────────────────

export async function getTopBooks(
  n = 10
): Promise<TopBook[]> {
  const { data } = await api.get<TopBook[]>(
    '/admin/top-books',
    {
      params: { n },
    }
  );

  return data;
}

// ── Admin users list ─────────────────────────────────────────────────────────

export async function getAdminUsers(
  page = 1,
  search = ''
): Promise<AdminUsersResponse> {
  const { data } = await api.get<AdminUsersResponse>(
    '/admin/users',
    {
      params: {
        page,
        search,
      },
    }
  );

  return data;
}

// ── Update admin user ────────────────────────────────────────────────────────

export async function updateAdminUser(
  userId: string,
  updates: {
    is_active?: boolean;
    role?: string;
  }
): Promise<AdminUser> {
  const { data } = await api.put<AdminUser>(
    `/admin/users/${userId}`,
    updates
  );

  return data;
}

// ── Reading analytics (FastAPI) ──────────────────────────────────────────────

export async function getReadingStats(): Promise<ReadingStats> {
  const { data } = await fastapiClient.get<ReadingStats>(
    '/analytics/reading-stats'
  );

  return data;
}

// ── Optional heatmap image helper ────────────────────────────────────────────

export async function getHeatmapImage(): Promise<string> {
  const { data } = await fastapiClient.get<{
    image: string;
  }>('/analytics/heatmap-image');

  return data.image;
}

// ── ML recommendations ───────────────────────────────────────────────────────

export async function getRecommendations(
  userId: string,
  n = 10
): Promise<RecommendationsResponse> {
  const { data } =
    await fastapiClient.get<RecommendationsResponse>(
      `/ml/recommend/${userId}`,
      {
        params: { n },
      }
    );

  return data;
}

// ── Book sentiment analysis ──────────────────────────────────────────────────

export async function getBookSentiment(
  bookId: string
): Promise<BookSentiment> {
  const { data } =
    await fastapiClient.get<BookSentiment>(
      `/ml/sentiment/${bookId}`
    );

  return data;
}