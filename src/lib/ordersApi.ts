/**
 * ordersApi.ts
 * Replaces db.getOrders() / db.saveOrders() in Profile.tsx, Checkout.tsx, Admin.tsx.
 */
import api from './api';

export interface OrderItemAPI {
  bookId:   string;
  quantity: number;
  price:    number;
}

export interface OrderAPI {
  id:              string;
  userId:          string;
  items:           OrderItemAPI[];
  total:           number;
  status:          string;
  shippingAddress: Record<string, string>;
  paymentMethod:   string;
  createdAt:       string;
}

export interface CreateOrderPayload {
  items:           { bookId: string; quantity: number }[];
  shippingAddress: Record<string, string>;
  paymentMethod:   string;
}

export async function getOrders(): Promise<OrderAPI[]> {
  const { data } = await api.get<OrderAPI[]>('/orders/');
  return data;
}

export async function getOrder(id: string): Promise<OrderAPI> {
  const { data } = await api.get<OrderAPI>(`/orders/${id}`);
  return data;
}

export async function createOrder(payload: CreateOrderPayload): Promise<OrderAPI> {
  const { data } = await api.post<OrderAPI>('/orders/', payload);
  return data;
}

// Admin only
export async function updateOrderStatus(orderId: string, status: string): Promise<OrderAPI> {
  const { data } = await api.put<OrderAPI>(`/orders/${orderId}/status`, { status });
  return data;
}