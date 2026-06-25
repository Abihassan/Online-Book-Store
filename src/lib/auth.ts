/**
 * auth.ts
 * Authentication API helpers.
 */

import api, {
  setTokens,
  clearTokens,
  getAccessToken,
} from './api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  is_active: boolean;
  avatar_url?: string;
  created_at?: string;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// ── Login ────────────────────────────────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string
): Promise<AuthUser> {
  try {
    const { data } =
      await api.post<AuthResponse>(
        '/auth/login',
        {
          email,
          password,
        }
      );

    setTokens(
      data.accessToken,
      data.refreshToken
    );

    localStorage.setItem(
      'bookhaven_user',
      JSON.stringify(data.user)
    );

    return data.user;
  } catch (err: any) {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      'Login failed';

    throw new Error(message);
  }
}

// ── Register ─────────────────────────────────────────────────────────────────

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<AuthUser> {
  try {
    const { data } =
      await api.post<AuthResponse>(
        '/auth/register',
        {
          email,
          password,
          name,
        }
      );

    setTokens(
      data.accessToken,
      data.refreshToken
    );

    localStorage.setItem(
      'bookhaven_user',
      JSON.stringify(data.user)
    );

    return data.user;
  } catch (err: any) {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      'Registration failed';

    throw new Error(message);
  }
}

// ── Logout ───────────────────────────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore API errors
  } finally {
    clearTokens();
  }
}

// ── Fetch current user ───────────────────────────────────────────────────────

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const { data } =
      await api.get<AuthUser>('/auth/me');

    localStorage.setItem(
      'bookhaven_user',
      JSON.stringify(data)
    );

    return data;
  } catch {
    clearTokens();
    return null;
  }
}

// ── Update profile ───────────────────────────────────────────────────────────

export async function updateProfile(
  updates: {
    name?: string;
    email?: string;
    avatar_url?: string;
  }
): Promise<AuthUser> {
  const { data } =
    await api.put<AuthUser>(
      '/auth/me',
      updates
    );

  localStorage.setItem(
    'bookhaven_user',
    JSON.stringify(data)
  );

  return data;
}

// ── Change password ──────────────────────────────────────────────────────────

export async function changePassword(
  currentPw: string,
  newPw: string
): Promise<void> {
  await api.put(
    '/auth/change-password',
    {
      currentPassword: currentPw,
      newPassword: newPw,
    }
  );
}

// ── Restore session ──────────────────────────────────────────────────────────

export function restoreSession():
  | AuthUser
  | null {
  try {
    const stored =
      localStorage.getItem(
        'bookhaven_user'
      );

    const token = getAccessToken();

    if (!stored || !token) {
      return null;
    }

    return JSON.parse(stored) as AuthUser;
  } catch {
    clearTokens();
    return null;
  }
}

// ── Forgot Password ───────────────────────────────────────────────────────────

export async function forgotPassword(
  email: string
): Promise<void> {
  try {
    await api.post('/auth/forgot-password', { email });
  } catch (err: any) {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      'Failed to send reset email';
    throw new Error(message);
  }
}

// ── Optional Helpers ─────────────────────────────────────────────────────────

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function isAdmin(
  user: AuthUser | null
): boolean {
  return user?.role === 'admin';
}