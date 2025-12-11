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

  const { mutate, isPending, error: mutationError } = useAuthMutation('signup');

  const [form, setForm] = useState<SignupPayload>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT' as UserRole,
  });
  const [validationError, setValidationError] = useState<string | null>(null);

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
      setValidationError(v);
      return;
    }
    setValidationError(null);
    mutate(form as SignupPayload);
  };

  const displayError = validationError || (mutationError?.message);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-900 to-slate-950 flex items-center justify-center px-4 py-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Card */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
              Create Account
            </div>
            <p className="text-slate-300 text-sm">Join Quiz Platform and start learning</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition duration-200 backdrop-blur"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition duration-200 backdrop-blur"
                required
              />
              <p className="text-xs text-slate-400">Min 8 characters, at least 1 number and 1 letter</p>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="John"
                  value={form.firstName}
                  onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition duration-200 backdrop-blur"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition duration-200 backdrop-blur"
                  required
                />
              </div>
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Account Type
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition duration-200 backdrop-blur cursor-pointer"
              >
                <option value="STUDENT" className="bg-slate-900">Student</option>
                <option value="TEACHER" className="bg-slate-900">Teacher</option>
              </select>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm font-medium animate-pulse">
                {displayError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full relative group overflow-hidden rounded-lg font-semibold py-3 px-4 transition-all duration-300"
            >
              {/* Button background with gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 transition-all duration-300 group-hover:scale-105"></div>
              
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>

              {/* Disabled state */}
              {isPending && (
                <div className="absolute inset-0 bg-black/30"></div>
              )}

              {/* Button content */}
              <div className="relative flex items-center justify-center gap-2">
                {isPending ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </div>
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-slate-300 text-sm">
              Already have an account?{' '}
              <a href="/login" className="font-semibold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent hover:opacity-80 transition">
                Sign in
              </a>
            </p>
          </div>

          {/* Back to home link */}
          <div className="text-center">
            <a href="/" className="text-xs text-slate-400 hover:text-slate-300 transition">
              ← Back to home
            </a>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-slate-400 text-xs mt-6">
          Test credentials: student1@example.com / student123
        </p>
      </div>
    </div>
  );
}
