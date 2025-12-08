"use client";

import React, { useState, useEffect } from 'react';
import useAuthMutation from '../../lib/hooks/useAuthMutation';
import { useAuthStore } from '../../lib/store/authStore';
import type { SignupPayload, UserRole } from 'shared/src/types/auth';
import { useRouter } from 'next/navigation';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Password requirements: min 8 chars, at least one number and one letter (synced with backend)
// Anchored regex: at least one digit, at least one ASCII letter, and minimum length 8
const passwordRegex = /^(?=.*\d)(?=.*[A-Za-z]).{8,}$/;

export default function SignupPage() {
  const router = useRouter();
  const initialize = useAuthStore((s) => s.initialize);
  useEffect(() => initialize(), [initialize]);

  const mutation = useAuthMutation('signup');

  const [form, setForm] = useState<SignupPayload>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT' as UserRole,
  });
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!form.email || !form.password || !form.firstName || !form.lastName) return 'All fields required.';

    const emailOk = emailRegex.test(form.email);
    const pwdRaw = String(form.password);
    const pwd = pwdRaw.trim();
    const pwdOk = passwordRegex.test(pwd);

    // Debug logging (masked) to help debug why passwords are being rejected.
    try {
      const masked = '*'.repeat(Math.max(0, Math.min(64, pwd.length)));
      console.debug('[signup] validate', { email: form.email, emailOk, passwordLength: pwdRaw.length, passwordTrimmedLength: pwd.length, passwordMasked: masked, passwordOk: pwdOk });
    } catch (e) {
      // ignore logging issues
    }

    if (!emailOk) return 'Invalid email format.';
    if (!pwdOk) return 'Password must be at least 8 characters and include at least 1 letter and 1 number.';
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    mutation.mutate(form as SignupPayload);
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-cyan-400/50">
      <h2 className="text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">Create your account</h2>
      <p className="text-center text-slate-300 mb-8">Join Quiz Platform to host and participate in live quizzes</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block mb-2 text-sm font-semibold text-cyan-300">Email</label>
          <input
            type="email"
            className="w-full bg-slate-700 border border-cyan-400/30 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
            placeholder="your@email.com"
            // HTML5 pattern for email — basic validation (frontend convenience only)
            pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
            title="Enter a valid email address"
            value={form.email}
            onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-semibold text-cyan-300">Password</label>
          <input
            type="password"
            className="w-full bg-slate-700 border border-cyan-400/30 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
            placeholder="••••••••"
            // Removed HTML `pattern` because the browser can block the submit
            // before our JS runs and logs helpful debug info. We validate in JS.
            title="Minimum 8 characters, at least 1 number and 1 letter"
            value={form.password}
            onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
            required
          />
          {/* Password requirements hint */}
          <p className="text-xs text-slate-400 mt-1">Min 8 characters, at least 1 number and 1 letter</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-sm font-semibold text-cyan-300">First name</label>
            <input
              type="text"
              className="w-full bg-slate-700 border border-cyan-400/30 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
              placeholder="John"
              value={form.firstName}
              onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-cyan-300">Last name</label>
            <input
              type="text"
              className="w-full bg-slate-700 border border-cyan-400/30 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
              placeholder="Doe"
              value={form.lastName}
              onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <label className="block mb-2 text-sm font-semibold text-cyan-300">Role</label>
          <select
            className="w-full bg-slate-700 border border-cyan-400/30 px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
            value={form.role}
            onChange={(e) => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
          >
          <option value="STUDENT" className="bg-slate-800">Student</option>
            <option value="TEACHER" className="bg-slate-800">Teacher</option>
          </select>
        </div>

        {error && <div className="text-red-400 text-sm font-medium bg-red-900/30 border border-red-500/50 p-3 rounded-lg">{error}</div>}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 text-white py-3 rounded-lg font-bold shadow-lg hover:from-cyan-700 hover:to-cyan-800 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={(mutation as any).isLoading}
        >
          {(mutation as any).isLoading ? 'Creating...' : 'Sign Up'}
        </button>
      </form>

      {/* Link to login page */}
      <div className="mt-6 text-center">
        <p className="text-slate-300">Already have an account? <a className="text-blue-400 font-semibold hover:text-blue-300 transition" href="/login">Log in</a></p>
      </div>
    </div>
  );
}
