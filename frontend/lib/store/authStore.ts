import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "shared/src/types/auth";
import { queryClient } from "../providers/ReactQueryProvider";
import { apiClient } from "../api/client";

interface AuthState {
  user: User | null;
  token: string | null;
  // Set authentication state (called after login/signup)
  setAuth: (user: User, token: string) => void;
  // Clears authentication state (async to call backend logout endpoint)
  logout: () => Promise<void>;
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
        // Token is now stored in httpOnly cookie (set by backend)
        // Only store user data in state/localStorage, NOT the token
        set({ user, token: null, isAuthenticated: true }); // token is null, stored in cookie
        try {
          // Store user data for UI state, but NOT the token (security)
          localStorage.setItem("user", JSON.stringify(user));
          // Remove old token from localStorage if it exists (migration cleanup)
          localStorage.removeItem("token");
        } catch (e) {
          // localStorage might be disabled in some environments
          console.warn("Unable to persist user to localStorage", e);
        }
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
        set({ user: null, token: null, isAuthenticated: false });
        try {
          localStorage.removeItem("user");
          localStorage.removeItem("token"); // Cleanup old token if exists
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
        try {
          // Token is now in httpOnly cookie, not accessible via JavaScript
          // Only restore user data from localStorage for UI state
          const userJson = localStorage.getItem("user");
          if (userJson) {
            const user: User = JSON.parse(userJson);
            // Assume authenticated if user data exists (cookie will be validated on first API call)
            // If cookie is invalid, API will return 401 and redirect to login
            set({ user, token: null, isAuthenticated: true });
          } else {
            set({ user: null, token: null, isAuthenticated: false });
          }
        } catch (e) {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
