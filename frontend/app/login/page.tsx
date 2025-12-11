"use client";

import React, { useState, useEffect } from "react";
import useAuthMutation from "../../lib/hooks/useAuthMutation";
import { useAuthStore } from "../../lib/store/authStore";
import type { LoginPayload } from "shared/src/types/auth";
import Link from 'next/link';

export default function LoginPage() {
  const initialize = useAuthStore((s) => s.initialize);
  useEffect(() => initialize(), [initialize]);

  const { mutate, isPending, error } = useAuthMutation("login");

  const [form, setForm] = useState<LoginPayload>({ email: "", password: "" });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setValidationError('Email and password required.');
      return;
    }
    setValidationError(null);
    mutate(form);
  };

  const displayError = validationError || (error?.message);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-950 flex items-center justify-center px-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Card */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="text-5xl font-bold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Welcome back
            </div>
            <p className="text-slate-300 text-sm">Sign in to your Quiz Platform account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="input-field"
                required
                disabled={isPending}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-field pr-12"
                  required
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  disabled={isPending}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm font-medium animate-pulse">
                ⚠️ {displayError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full relative group overflow-hidden rounded-lg font-semibold py-3 px-4 transition-all duration-300"
            >
              {/* Button background with gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-300 group-hover:scale-105 disabled:scale-100"></div>
              
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 disabled:hidden"></div>

              {/* Disabled state */}
              {isPending && (
                <div className="absolute inset-0 bg-black/20"></div>
              )}

              {/* Button content */}
              <div className="relative flex items-center justify-center gap-2">
                {isPending ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>🔐 Sign In</span>
                )}
              </div>
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-slate-300 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent hover:opacity-80 transition">
                Create one
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="text-center pt-2 border-t border-white/10">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-300 transition">
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-slate-400 text-xs mt-6">
          Test: teacher1@example.com / teacher123
        </p>
      </div>
    </div>
  );
}
