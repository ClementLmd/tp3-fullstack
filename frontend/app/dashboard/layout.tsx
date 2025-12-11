'use client';

import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import { useAuthStore } from '@/lib/store/authStore';
import Link from 'next/link';

export default function DashboardLayout({
  children,
  overview,
  quizzes,
  sessions,
  performance,
}: {
  children: React.ReactNode;
  overview: React.ReactNode;
  quizzes: React.ReactNode;
  sessions: React.ReactNode;
  performance: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Header */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/50 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  📊 Dashboard
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="hidden sm:block text-right">
                  <p className="text-sm text-slate-400">Welcome back</p>
                  <p className="text-lg font-semibold text-white">{user?.firstName} {user?.lastName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-slate-300">{user?.role}</span>
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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Overview Section */}
          <div className="mb-12 animate-fade-in-up">
            <h2 className="section-title">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {overview}
            </div>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Wider */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quizzes Section */}
              <div className="animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                <h2 className="section-title">
                  {user?.role === 'TEACHER' ? '📚 My Quizzes' : '📚 Available Quizzes'}
                </h2>
                <div className="card-dark">
                  {quizzes}
                </div>
              </div>

              {/* Performance Section */}
              <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <h2 className="section-title">
                  {user?.role === 'TEACHER' ? '📈 Quiz Performance' : '⭐ Your Performance'}
                </h2>
                <div className="card-dark p-6">
                  {performance}
                </div>
              </div>
            </div>

            {/* Right Column - Narrower */}
            <div className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <h2 className="section-title">🎯 Sessions</h2>
              <div className="card-dark overflow-hidden">
                {sessions}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
