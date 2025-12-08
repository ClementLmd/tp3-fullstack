"use client";

import React, { useState, useEffect } from 'react';
import useAuthMutation from '../../lib/hooks/useAuthMutation';
import { useAuthStore } from '../../lib/store/authStore';
import type { LoginPayload } from 'shared/src/types/auth';

export default function LoginPage() {
  const initialize = useAuthStore((s) => s.initialize);
  useEffect(() => initialize(), [initialize]);

  const mutation = useAuthMutation('login');

  const [form, setForm] = useState<LoginPayload>({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Email and password required.');
      return;
    }
    setError(null);
    mutation.mutate(form);
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">Welcome back</h2>
      <p className="text-center text-slate-300 mb-8">Sign in to continue to Quiz Platform</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-semibold text-blue-300">Email</label>
          <input
            type="email"
            className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300"
            value={form.email}
            onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-semibold text-blue-300">Password</label>
          <input
            type="password"
            className="w-full bg-slate-700 border border-blue-400/30 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
            required
          />
        </div>

        {error && <div className="text-red-400 text-sm font-medium bg-red-900/30 border border-red-500/50 p-3 rounded-lg">{error}</div>}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-bold shadow-lg hover:from-blue-700 hover:to-blue-800 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={(mutation as any).isLoading}
        >
          {(mutation as any).isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      {/* Link to signup page */}
      <div className="mt-6 text-center">
        <p className="text-slate-300">Don&apos;t have an account? <a className="text-cyan-400 font-semibold hover:text-cyan-300 transition" href="/signup">Create one</a></p>
      </div>
    </div>
  );
}
