import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from 'shared/src/types/auth';
import { queryClient } from '../providers/ReactQueryProvider';

interface AuthState {
  user: User | null;
  token: string | null;
  // Set authentication state (called after login/signup)
  setAuth: (user: User, token: string) => void;
  // Clears authentication state
  logout: () => void;
  // Initialize from localStorage (token + user)
  initialize: () => void;
  isAuthenticated: boolean;
}

// Persisted auth store: stores `user` and `token` in localStorage under `auth-storage`
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        // update state and localStorage
        set({ user, token, isAuthenticated: true });
        try {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        } catch (e) {
          // localStorage might be disabled in some environments
          console.warn('Unable to persist auth to localStorage', e);
        }
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Clear react-query cache on logout so no stale, user-specific data remains
          try {
            queryClient.clear();
          } catch (e) {
            // Ignore if queryClient isn't available in this environment
            console.warn('Unable to clear query cache on logout', e);
          }
        } catch (e) {
          console.warn('Unable to remove auth from localStorage', e);
        }
      },
      initialize: () => {
        try {
          const token = localStorage.getItem('token');
          const userJson = localStorage.getItem('user');
          if (token && userJson) {
            const user: User = JSON.parse(userJson);
            set({ user, token, isAuthenticated: true });
          } else {
            set({ user: null, token: null, isAuthenticated: false });
          }
        } catch (e) {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

