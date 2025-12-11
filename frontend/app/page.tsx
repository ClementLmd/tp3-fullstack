"use client";

import { useAuthStore } from '../lib/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Home page - Landing page with login/signup/dashboard buttons
 * Shows buttons for unauthenticated users, auto-redirects authenticated users
 */
export default function Home() {
  const { initialize, isAuthenticated } = useAuthStore((s) => ({
    initialize: s.initialize,
    isAuthenticated: s.isAuthenticated,
  }));

  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initialize();
      setMounted(true);
    }
  }, [initialize]);

  // Auto-redirect authenticated users to dashboard
  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [mounted, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl w-full mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block mb-6">
            <div className="text-7xl font-black mb-4 animate-bounce" style={{animationDelay: '0s'}}>
              📚
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent leading-tight">
            Quiz Platform
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-4 font-light">
            Real-time interactive quizzes for teachers and students
          </p>
          
          <p className="text-slate-400 max-w-2xl mx-auto mb-12">
            Create engaging quiz sessions, participate in real-time, and track your progress instantly
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            {/* Login Button */}
            <Link
              href="/login"
              className="group relative w-full sm:w-auto overflow-hidden rounded-xl font-bold py-4 px-8 text-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 transition-all duration-300 group-hover:scale-110"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
              <div className="relative text-white flex items-center justify-center gap-2">
                <span>🔐 Sign In</span>
              </div>
            </Link>

            {/* Signup Button */}
            <Link
              href="/signup"
              className="group relative w-full sm:w-auto overflow-hidden rounded-xl font-bold py-4 px-8 text-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-cyan-700 transition-all duration-300 group-hover:scale-110"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
              <div className="relative text-white flex items-center justify-center gap-2">
                <span>✨ Create Account</span>
              </div>
            </Link>
          </div>

          {/* Test Credentials Box */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-6 max-w-2xl mx-auto mb-12">
            <p className="text-slate-300 font-semibold mb-4">🧪 Quick Test Credentials:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300 font-bold">👨‍🏫 Teacher</p>
                <p className="text-xs text-slate-400 font-mono mt-2">teacher1@example.com</p>
                <p className="text-xs text-slate-400 font-mono">teacher123</p>
              </div>
              <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-lg p-4">
                <p className="text-sm text-cyan-300 font-bold">👨‍🎓 Student</p>
                <p className="text-xs text-slate-400 font-mono mt-2">student1@example.com</p>
                <p className="text-xs text-slate-400 font-mono">student123</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          {/* Feature 1 */}
          <div className="backdrop-blur-lg bg-white/5 border border-white/20 rounded-xl p-8 hover:border-blue-400/50 transition-all duration-300 group">
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🎯</div>
            <h3 className="text-xl font-bold text-white mb-3">Create Quizzes</h3>
            <p className="text-slate-400 text-sm">Design engaging quizzes with multiple question types and real-time session management</p>
          </div>

          {/* Feature 2 */}
          <div className="backdrop-blur-lg bg-white/5 border border-white/20 rounded-xl p-8 hover:border-cyan-400/50 transition-all duration-300 group">
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">⚡</div>
            <h3 className="text-xl font-bold text-white mb-3">Live Sessions</h3>
            <p className="text-slate-400 text-sm">Host real-time quiz sessions with instant feedback and live participant tracking</p>
          </div>

          {/* Feature 3 */}
          <div className="backdrop-blur-lg bg-white/5 border border-white/20 rounded-xl p-8 hover:border-purple-400/50 transition-all duration-300 group">
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📊</div>
            <h3 className="text-xl font-bold text-white mb-3">Analytics</h3>
            <p className="text-slate-400 text-sm">Track performance with detailed statistics and comprehensive dashboards</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-12 border-t border-white/10">
          <p className="text-slate-500 text-sm">
            🚀 Ready to get started? Sign in with your account or create a new one
          </p>
        </div>
      </div>
    </div>
  );
}

