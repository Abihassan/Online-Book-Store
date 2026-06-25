import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AuthUser, loginUser, registerUser, logoutUser,
  fetchMe, restoreSession, updateProfile, changePassword,
} from '../lib/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  login:          (email: string, password: string) => Promise<AuthUser>;
  register:       (email: string, password: string, name: string) => Promise<AuthUser>;
  logout:         () => Promise<void>;
  updateUser:     (updates: { name?: string; email?: string; avatar_url?: string }) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  // Legacy support: allow direct user object set (used by profile page)
  setUser:        (u: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState]  = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on mount ────────────────────────────────────────────────
  useEffect(() => {
    const restored = restoreSession();
    if (restored) {
      setUserState(restored);
      // Silently refresh user data from server
      fetchMe().then(fresh => { if (fresh) setUserState(fresh); }).catch(() => {});
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const u = await loginUser(email, password);
    setUserState(u);
    return u;
  };

  const register = async (email: string, password: string, name: string): Promise<AuthUser> => {
    const u = await registerUser(email, password, name);
    setUserState(u);
    return u;
  };

  const logout = async () => {
    await logoutUser();
    setUserState(null);
  };

  const updateUser = async (updates: { name?: string; email?: string; avatar_url?: string }) => {
    const updated = await updateProfile(updates);
    setUserState(updated);
  };

  const handleChangePassword = async (current: string, next: string) => {
    await changePassword(current, next);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin: user?.role === 'admin',
      loading,
      login,
      register,
      logout,
      updateUser,
      changePassword: handleChangePassword,
      setUser: setUserState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};