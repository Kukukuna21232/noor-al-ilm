import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { authApi } from '@/lib/api';

export type UserRole = 'user' | 'student' | 'teacher' | 'scholar' | 'moderator' | 'admin' | 'superadmin';

export interface User {
  id: string;
  name: string;
  nameAr?: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  locale: string;
  isVerified: boolean;
  is2faEnabled?: boolean;
  reputationPoints?: number;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requires2FA: boolean;
  pendingEmail: string | null;

  login: (email: string, password: string, totpCode?: string) => Promise<void>;
  register: (name: string, email: string, password: string, locale?: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
}

const setTokenCookie = (token: string) => {
  Cookies.set('access_token', token, { expires: 1/96, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        accessToken: null,
        isLoading: false,
        isAuthenticated: false,
        requires2FA: false,
        pendingEmail: null,

        login: async (email, password, totpCode) => {
          set({ isLoading: true });
          try {
            const data = await authApi.login({ email, password, totpCode }) as { requires2FA?: boolean; accessToken?: string; user?: User };

            if (data.requires2FA) {
              set({ requires2FA: true, pendingEmail: email, isLoading: false });
              return;
            }

            if (data.accessToken) setTokenCookie(data.accessToken);
            set({
              user: data.user || null,
              accessToken: data.accessToken || null,
              isAuthenticated: true,
              requires2FA: false,
              pendingEmail: null,
            });
          } finally {
            set({ isLoading: false });
          }
        },

        register: async (name, email, password, locale = 'ar') => {
          set({ isLoading: true });
          try {
            const data = await authApi.register({ name, email, password, locale }) as { accessToken?: string; user?: User };
            if (data.accessToken) setTokenCookie(data.accessToken);
            set({ user: data.user || null, accessToken: data.accessToken || null, isAuthenticated: true });
          } finally {
            set({ isLoading: false });
          }
        },

        logout: async () => {
          try { await authApi.logout(); } catch {}
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          set({ user: null, accessToken: null, isAuthenticated: false, requires2FA: false });
        },

        fetchMe: async () => {
          try {
            const data = await authApi.me() as { user?: User };
            if (data.user) set({ user: data.user, isAuthenticated: true });
          } catch {
            Cookies.remove('access_token');
            set({ user: null, accessToken: null, isAuthenticated: false });
          }
        },

        setUser: (user) => set({ user }),
        setToken: (token) => { setTokenCookie(token); set({ accessToken: token }); },
        clearAuth: () => { Cookies.remove('access_token'); set({ user: null, accessToken: null, isAuthenticated: false }); },
      }),
      {
        name: 'noor-auth',
        partialize: (s) => ({ accessToken: s.accessToken, user: s.user }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// Role helpers
export const isAdmin = (role?: UserRole) => role === 'admin' || role === 'superadmin';
export const isTeacher = (role?: UserRole) => ['teacher', 'scholar', 'admin', 'superadmin'].includes(role || '');
export const isModerator = (role?: UserRole) => ['moderator', 'admin', 'superadmin'].includes(role || '');
