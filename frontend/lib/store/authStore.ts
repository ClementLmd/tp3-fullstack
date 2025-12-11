import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "shared/src/types/auth";
import { queryClient } from "../providers/ReactQueryProvider";
import { apiClient } from "../api/client";

interface AuthState {
  user: User | null;
  // Set authentication state (called after login/signup)
  // Token is stored in httpOnly cookie, not in client state
  setAuth: (user: User) => void; // Token parameter removed - token is in httpOnly cookie
  // Clears authentication state (async to call backend logout endpoint)
  logout: () => Promise<void>;
  // Initialize from localStorage (user data)
  initialize: () => void;
  isAuthenticated: boolean;
}

// Persisted auth store: stores `user` in localStorage under `auth-storage`
// Token is stored in httpOnly cookie (set by backend), not in client state
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => {
        // Token is stored in httpOnly cookie (set by backend)
        // Only store user data in state/localStorage
        // Zustand persist middleware will automatically save to localStorage
        set({ user, isAuthenticated: true });
      },
      logout: async () => {
        // Call backend logout endpoint (fire and forget - don't block UI on error)
        try {
          await apiClient.post("/auth/logout");
        } catch (error) {
          // Don't block logout if backend call fails - still clear local state
          console.warn(
            "Logout API call failed, but continuing with local logout",
            error
          );
        }

        // Clear local state regardless of API call result
        // Cookie is cleared server-side by logout endpoint
        set({ user: null, isAuthenticated: false });
        try {
          localStorage.removeItem("user");
          localStorage.removeItem("token"); // Cleanup old token if exists (legacy)
          // Clear react-query cache on logout so no stale, user-specific data remains
          try {
            queryClient.clear();
          } catch (e) {
            // Ignore if queryClient isn't available in this environment
            console.warn("Unable to clear query cache on logout", e);
          }
        } catch (e) {
          console.warn("Unable to remove auth from localStorage", e);
        }
      },
      initialize: () => {
        // Zustand persist middleware automatically restores state from localStorage
        // This function ensures isAuthenticated is synced with user state
        // Zustand persist restores the state on mount, so we just sync isAuthenticated
        const currentState = useAuthStore.getState();
        if (currentState.user && !currentState.isAuthenticated) {
          set({ isAuthenticated: true });
        } else if (!currentState.user && currentState.isAuthenticated) {
          set({ isAuthenticated: false });
        }
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
