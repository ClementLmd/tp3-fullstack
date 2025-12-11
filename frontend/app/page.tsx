"use client";

import Link from "next/link";
import { useAuthStore } from "../lib/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useAuthMutation from "../lib/hooks/useAuthMutation";
import type { LoginPayload } from "shared/src/types/auth";

/**
 * Home page - Landing page with login/signup/dashboard buttons
 * Shows buttons for unauthenticated users, auto-redirects authenticated users
 */
export default function Home() {
  const { user, initialize, logout, isAuthenticated } = useAuthStore((s) => ({
    user: s.user,
    initialize: s.initialize,
    logout: s.logout,
    isAuthenticated: s.isAuthenticated,
  }));

  const router = useRouter();

  useEffect(() => {
    // Only initialize if user is not already loaded
    // This prevents unnecessary re-initialization after login
    if (typeof window !== "undefined" && !user) {
      initialize();
    }
  }, [initialize, user]);

  // Mutation for quick login
  const loginMutation = useAuthMutation("login");

  // Quick login handlers for mock accounts
  const handleQuickLogin = (role: "teacher" | "student") => {
    const credentials: LoginPayload =
      role === "teacher"
        ? { email: "teacher1@example.com", password: "teacher123" }
        : { email: "student1@example.com", password: "student123" };

    loginMutation.mutate(credentials);
  };

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
            {isAuthenticated && (
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
                  onClick={async () => {
                    await logout();
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
            )}
          </div>
        </div>

        {/* Feature cards section - only shown when authenticated */}
        {isAuthenticated && (
          <div className="mt-8 space-y-6">
            {/* Dashboard Card - Always visible for authenticated users */}
            <div
              onClick={() => router.push("/dashboard")}
              className="p-6 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-lg border border-emerald-400/50 hover:border-teal-300 transition hover:shadow-lg cursor-pointer"
            >
              <h2 className="text-2xl font-bold mb-2 text-emerald-300">
                📊 Go to Dashboard
              </h2>
              <p className="text-slate-300">
                View your statistics, quizzes, sessions, and performance
                overview.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Manage Quizzes (Teachers only) */}
              {user?.role === "TEACHER" && (
                <div
                  onClick={() => router.push("/teacher/quizzes")}
                  className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-lg border border-blue-400/50 hover:border-cyan-300 transition hover:shadow-lg cursor-pointer"
                >
                  <h2 className="text-2xl font-bold mb-2 text-blue-300">
                    📝 Manage Quizzes
                  </h2>
                  <p className="text-slate-300">
                    Create, edit, and organize your quiz collection with
                    multiple question types.
                  </p>
                </div>
              )}
              {/* Card 2: Host Quiz feature (Teachers only) */}
              {user?.role === "TEACHER" && (
                <div className="p-6 bg-gradient-to-br from-purple-500/20 to-blue-500/10 rounded-lg border border-purple-400/50 hover:border-blue-300 transition hover:shadow-lg">
                  <h2 className="text-2xl font-bold mb-2 text-purple-300">
                    🎯 Host a Quiz
                  </h2>
                  <p className="text-slate-300">
                    Launch live quiz sessions for your students with real-time
                    interaction and instant feedback.
                  </p>
                </div>
              )}
              {/* Card 3: Join Quiz feature (Students) */}
              {user?.role === "STUDENT" && (
                <div className="p-6 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-lg border border-cyan-400/50 hover:border-blue-300 transition hover:shadow-lg">
                  <h2 className="text-2xl font-bold mb-2 text-cyan-300">
                    🚀 Join a Session
                  </h2>
                  <p className="text-slate-300">
                    Join using an access code and participate in a live quiz
                    session from any device.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Login Section - shown only for unauthenticated users */}
        {!isAuthenticated && (
          <div className="mt-8 space-y-6">
            {/* Quick Login Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Teacher Quick Login */}
              <div className="p-6 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg border border-blue-400/50 hover:border-blue-300 transition hover:shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-blue-300 mb-1">
                      👨‍🏫 Teacher Account
                    </h3>
                    <p className="text-sm text-slate-400">
                      teacher@example.com
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleQuickLogin("teacher")}
                  disabled={loginMutation.isPending}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loginMutation.isPending
                    ? "Connecting..."
                    : "Quick Login as Teacher"}
                </button>
              </div>

              {/* Student Quick Login */}
              <div className="p-6 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-lg border border-cyan-400/50 hover:border-cyan-300 transition hover:shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-cyan-300 mb-1">
                      👨‍🎓 Student Account
                    </h3>
                    <p className="text-sm text-slate-400">
                      student@example.com
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleQuickLogin("student")}
                  disabled={loginMutation.isPending}
                  className="w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg font-semibold shadow-lg hover:from-cyan-700 hover:to-cyan-800 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loginMutation.isPending
                    ? "Connecting..."
                    : "Quick Login as Student"}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-800 text-slate-400">Or</span>
              </div>
            </div>

            {/* Regular Login/Signup Links */}
            <div className="flex gap-4 justify-center">
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
          </div>
        )}

        {/* Features Grid - shown only for unauthenticated users */}
        {!isAuthenticated && (
          <>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="backdrop-blur-lg bg-white/5 border border-white/20 rounded-xl p-8 hover:border-blue-400/50 transition-all duration-300 group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  🎯
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Create Quizzes
                </h3>
                <p className="text-slate-400 text-sm">
                  Design engaging quizzes with multiple question types and
                  real-time session management
                </p>
              </div>

              {/* Feature 2 */}
              <div className="backdrop-blur-lg bg-white/5 border border-white/20 rounded-xl p-8 hover:border-cyan-400/50 transition-all duration-300 group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  ⚡
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Live Sessions
                </h3>
                <p className="text-slate-400 text-sm">
                  Host real-time quiz sessions with instant feedback and live
                  participant tracking
                </p>
              </div>

              {/* Feature 3 */}
              <div className="backdrop-blur-lg bg-white/5 border border-white/20 rounded-xl p-8 hover:border-purple-400/50 transition-all duration-300 group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  📊
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Analytics</h3>
                <p className="text-slate-400 text-sm">
                  Track performance with detailed statistics and comprehensive
                  dashboards
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-16 pt-12 border-t border-white/10">
              <p className="text-slate-500 text-sm">
                🚀 Ready to get started? Sign in with your account or create a
                new one
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
