"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../lib/store/authStore";

/**
 * AuthGuard wraps children and redirects unauthenticated users to `/login`.
 * Also accepts optional `roles` prop to restrict access by role.
 */
type Props = {
  children: React.ReactNode;
  roles?: string[];
};

export default function AuthGuard({ children, roles }: Props) {
  const router = useRouter();
  const { user, isAuthenticated, initialize, logout } = useAuthStore((s) => ({
    user: s.user,
    isAuthenticated: s.isAuthenticated,
    initialize: s.initialize,
    logout: s.logout,
  }));

  // Track if we've initialized - Zustand persist restores state synchronously,
  // but we need to call initialize() once to sync isAuthenticated
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Initialize synchronously - Zustand persist restores state immediately on store creation
    // This just syncs isAuthenticated with user state
    initialize();
    setHasInitialized(true);
  }, [initialize]);

  useEffect(() => {
    // Only check auth after initialization
    if (!hasInitialized) return;

    // Token is now in httpOnly cookie, not in Zustand store
    // Check isAuthenticated and user instead of token
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    if (roles && !roles.includes(user.role)) {
      // If user doesn't have the required role, log out and redirect
      const handleLogout = async () => {
        await logout();
        router.replace("/login");
      };
      handleLogout();
    }
  }, [hasInitialized, isAuthenticated, user, roles, router, logout]);

  // Show nothing if not initialized or not authenticated
  // Zustand persist restores state synchronously on store creation,
  // but we need to call initialize() to sync isAuthenticated
  if (!hasInitialized || !isAuthenticated || !user) {
    return null; // or a loader
  }

  return <>{children}</>;
}
