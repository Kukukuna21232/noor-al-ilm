import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

export interface User { id: string; name: string; email: string; role: 'user'|'moderator'|'teacher'|'admin'; }

interface AuthState {
  user: User | null; token: string | null; isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, token: null, isAuthenticated: false,
      setAuth: (user, token) => { Cookies.set('token', token, { expires: 7, secure: true, sameSite: 'strict' }); set({ user, token, isAuthenticated: true }); },
      logout: () => { Cookies.remove('token'); set({ user: null, token: null, isAuthenticated: false }); },
    }),
    { name: 'video-auth', partialize: (s) => ({ token: s.token }) }
  )
);
