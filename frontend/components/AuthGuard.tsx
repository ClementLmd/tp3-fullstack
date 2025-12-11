"use client";


import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/store/authStore';

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
  const { user, token, initialize, logout } = useAuthStore((s) => ({
    user: s.user,
    token: s.token,
    initialize: s.initialize,
    logout: s.logout,
  }));

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    if (roles && !roles.includes(user.role)) {
      // If user doesn't have the required role, log out and redirect
      logout();
      router.replace('/login');
    }
  }, [token, user, roles, router, logout]);

  if (!token || !user) return null; // or a loader

  return <>{children}</>;
}
