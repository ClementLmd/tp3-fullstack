"use client";

import React from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AppHeader() {
  const { user, logout, isAuthenticated } = useAuthStore((s) => ({
    user: s.user,
    logout: s.logout,
    isAuthenticated: s.isAuthenticated,
  }));
  const router = useRouter();
  const pathname = usePathname();

  // Don't show header on login/signup pages or if not authenticated
  if (!isAuthenticated || !user || pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  return (
    <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Left: Logo/Brand */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent hover:from-blue-300 hover:to-cyan-300 transition-all"
            >
              Quiz Platform
            </Link>
          </div>

          {/* Center: Navigation buttons */}
          <div className="hidden md:flex items-center gap-2">
            {/* Quizzes button */}
            <Link
              href={user.role === "TEACHER" ? "/teacher/quizzes" : "/dashboard"}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive("/teacher/quizzes") || (user.role === "STUDENT" && isActive("/dashboard"))
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                  : "bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              📚 Quizzes
            </Link>

            {/* Dashboard button */}
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive("/dashboard")
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                  : "bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              📊 Dashboard
            </Link>

            {/* Host a Quiz button (Teachers only) */}
            {user.role === "TEACHER" && (
              <Link
                href="/teacher/host"
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive("/teacher/host")
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                    : "bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                🎯 Host a Quiz
              </Link>
            )}

            {/* Join Session button (Students only) */}
            {user.role === "STUDENT" && (
              <Link
                href="/student/join"
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive("/student/join")
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                    : "bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                🚀 Join Session
              </Link>
            )}
          </div>

          {/* Right: User info and logout */}
          <div className="flex items-center gap-6">
            <div className="hidden sm:block text-right">
              <p className="text-sm text-slate-400">Welcome back</p>
              <p className="text-lg font-semibold text-white">
                {user.firstName} {user.lastName}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-300">{user.role}</span>
              </div>
            </div>

            <div className="h-10 w-px bg-white/10"></div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

