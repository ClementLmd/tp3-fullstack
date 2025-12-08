import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from 'shared';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        set({ user, token });
        localStorage.setItem('token', token);
      },
      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('token');
      },
      isAuthenticated: () => {
        return get().user !== null && get().token !== null;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

