"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { UserRole } from 'shared/src/types';
import { useAuthStore } from '@/lib/store/authStore';
import { useStudentSocket } from '@/lib/hooks/useSocket';

export default function JoinSessionPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { joinSession } = useStudentSocket();

  const [accessCode, setAccessCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessCode.trim()) {
      setError('Please enter an access code');
      return;
    }

    if (!user) {
      setError('You must be logged in');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      const result = await joinSession(accessCode.toUpperCase(), user.id, userName);
      
      // Redirect to the session page
      router.push(`/student/session/${result.sessionId}`);
    } catch (err: any) {
      console.error('Failed to join session:', err);
      setError(err.message || 'Failed to join session. Please check your access code.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <AuthGuard roles={[UserRole.STUDENT]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-8">
        <div className="max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
              Join Quiz Session
            </h1>
            <p className="text-slate-300">Enter the access code provided by your teacher</p>
          </div>

          {/* Join Form */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 border border-purple-400/30 shadow-2xl">
            <form onSubmit={handleJoinSession}>
              <div className="mb-6">
                <label className="block text-slate-300 font-semibold mb-3">
                  Access Code
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full px-6 py-4 bg-slate-900/50 border-2 border-slate-600 rounded-lg text-white text-2xl font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase tracking-widest"
                  disabled={isJoining}
                  autoComplete="off"
                />
                <p className="text-slate-400 text-sm mt-2 text-center">
                  6-character code (letters and numbers)
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 font-semibold text-center">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isJoining || !accessCode.trim()}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold shadow-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
              >
                {isJoining ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Joining...
                  </span>
                ) : (
                  '🚀 Join Session'
                )}
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <h4 className="font-semibold text-purple-300 mb-2">ℹ️ How to join</h4>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Get the access code from your teacher</li>
                <li>• The code is 6 characters (letters and numbers)</li>
                <li>• Make sure you&apos;re logged in as a student</li>
                <li>• The session must be active to join</li>
              </ul>
            </div>
          </div>

          {/* Back Link */}
          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/')}
              className="text-slate-400 hover:text-purple-300 transition"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
