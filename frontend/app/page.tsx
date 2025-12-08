"use client";

import Link from "next/link";
import { useAuthStore } from "../lib/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Home component - Main landing page for Quiz Platform
 * Displays different UI based on authentication state:
 * - Unauthenticated: Shows login/signup call-to-action buttons
 * - Authenticated: Shows user profile and logout button only
 */
export default function Home() {
  // Extract auth state from Zustand store (user, logout method, auth status)
  const { user, initialize, logout, isAuthenticated } = useAuthStore((s) => ({
    user: s.user,
    initialize: s.initialize,
    logout: s.logout,
    isAuthenticated: s.isAuthenticated,
  }));

  // Initialize auth from localStorage on client-side mount
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined") initialize();
  }, [initialize]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      {/* Main card container with dark blue gradient */}
      <div className="w-full max-w-4xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-2xl shadow-2xl p-10 border border-blue-400/30">
        {/* Header section with branding and navigation */}
        <div className="flex items-center justify-between mb-8">
          <div>
            {/* Main heading with gradient text: light blue to cyan */}
            <h1 className="text-5xl font-extrabold mb-2 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Quiz Platform
            </h1>
            {/* Subtitle in light gray */}
            <p className="text-slate-300">
              Real-time interactive quiz platform for teachers and students
            </p>
          </div>
          {/* Desktop navigation - hidden on mobile (md:block) */}
          <div className="hidden md:block">
            {/* Show logout + user info ONLY when authenticated */}
            {isAuthenticated ? (
              <div className="text-right bg-gradient-to-br from-blue-400/10 to-cyan-400/10 p-4 rounded-lg border border-blue-300/30">
                {/* Display user's first and last name in cyan */}
                <p className="text-sm text-slate-200">
                  Logged in as{" "}
                  <span className="text-cyan-300 font-semibold">
                    {user?.firstName} {user?.lastName}
                  </span>
                </p>
                {/* Display user role in blue */}
                <p className="text-sm text-slate-400">
                  Role:{" "}
                  <span className="text-blue-300 font-semibold">
                    {user?.role}
                  </span>
                </p>
                {/* Logout button with hover gradient effect */}
                <button
                  onClick={() => {
                    logout();
                    try {
                      router.push("/");
                    } catch (e) {
                      window.location.href = "/";
                    }
                  }}
                  className="mt-3 px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold shadow-lg hover:from-red-700 hover:to-red-800 transition transform hover:scale-105"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link
                  href="/login"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow hover:from-blue-700 hover:to-blue-800 transition"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg shadow hover:from-cyan-700 hover:to-cyan-800 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Feature cards section - only shown when authenticated */}
        {isAuthenticated && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Manage Quizzes (Teachers only) */}
            {user?.role === 'TEACHER' && (
              <div 
                onClick={() => router.push('/teacher/quizzes')}
                className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-lg border border-blue-400/50 hover:border-cyan-300 transition hover:shadow-lg cursor-pointer"
              >
                <h2 className="text-2xl font-bold mb-2 text-blue-300">📝 Manage Quizzes</h2>
                <p className="text-slate-300">Create, edit, and organize your quiz collection with multiple question types.</p>
              </div>
            )}
            {/* Card 2: Host Quiz feature (Teachers only) */}
            {user?.role === 'TEACHER' && (
              <div className="p-6 bg-gradient-to-br from-purple-500/20 to-blue-500/10 rounded-lg border border-purple-400/50 hover:border-blue-300 transition hover:shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-purple-300">🎯 Host a Quiz</h2>
                <p className="text-slate-300">Launch live quiz sessions for your students with real-time interaction and instant feedback.</p>
              </div>
            )}
            {/* Card 3: Join Quiz feature (Students) */}
            {user?.role === 'STUDENT' && (
              <div className="p-6 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-lg border border-cyan-400/50 hover:border-blue-300 transition hover:shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-cyan-300">🚀 Join a Session</h2>
                  <p className="text-slate-300">Join using an access code and participate in a live quiz session from any device.</p>
              </div>
            )}
          </div>
        )}

        {/* Mobile navigation - shown only for unauthenticated users */}
        {!isAuthenticated && (
          <div className="mt-8 flex gap-4 justify-center md:hidden">
            <Link
              href="/login"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition transform hover:scale-105"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-semibold rounded-lg shadow-lg hover:from-cyan-700 hover:to-cyan-800 transition transform hover:scale-105"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
