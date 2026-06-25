/**
 * api.ts
 * Central axios instance for all BookHaven API calls.
 * - Automatically attaches JWT access token to every request.
 * - On 401, attempts silent token refresh once, then redirects to /auth.
 */
import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// ── Base URLs ─────────────────────────────────────────────────────────────────
export const FLASK_URL   = import.meta.env.VITE_FLASK_URL   || 'http://localhost:5000/api';
export const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getAccessToken  = () => localStorage.getItem('accessToken');
export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('accessToken',  access);
  localStorage.setItem('refreshToken', refresh);
};
export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('bookhaven_user');
};

// ── Factory ───────────────────────────────────────────────────────────────────
// timeoutMs defaults to 15s, which is correct for normal CRUD-style API
// calls. Pass a longer value for endpoints backed by slower operations —
// e.g. the chat endpoint, which now runs a local LLM (see chatApi.ts) and
// can legitimately take longer than 15s to generate a reply on a CPU-only
// machine, especially on the first request after the model loads into
// memory. Raising the GLOBAL default instead would mask genuinely-stuck
// requests on fast endpoints, so this is scoped per-client instead.
export function createClient(baseURL: string, timeoutMs: number = 15_000): AxiosInstance {
  const client = axios.create({ baseURL, timeout: timeoutMs });

  // Attach access token
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Handle 401 — try refresh once
  let refreshing = false;
  let queue: Array<(token: string) => void> = [];

  client.interceptors.response.use(
    res => res,
    async err => {
      const original = err.config as AxiosRequestConfig & { _retry?: boolean };
      if (err.response?.status === 401 && !original._retry) {
        original._retry = true;

        if (refreshing) {
          return new Promise(resolve => {
            queue.push((token: string) => {
              original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
              resolve(client(original));
            });
          });
        }

        refreshing = true;
        try {
          const refresh = getRefreshToken();
          if (!refresh) throw new Error('No refresh token');
          const { data } = await axios.post(`${FLASK_URL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refresh}` },
          });
          setTokens(data.accessToken, refresh);
          queue.forEach(cb => cb(data.accessToken));
          queue = [];
          original.headers = { ...original.headers, Authorization: `Bearer ${data.accessToken}` };
          return client(original);
        } catch {
          clearTokens();
          window.location.href = '/auth';
        } finally {
          refreshing = false;
        }
      }
      return Promise.reject(err);
    }
  );

  return client;
}

// ── Exported clients ──────────────────────────────────────────────────────────
export const api        = createClient(FLASK_URL);    // Flask main API
export const fastapiClient = createClient(FASTAPI_URL); // FastAPI (ML + WS)
export default api;