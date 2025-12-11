"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";

export default function UnauthorizedPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="w-full max-w-md bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-2xl shadow-2xl p-10 border border-red-400/30">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Access Denied
          </h1>
          <p className="text-slate-300 mb-2">
            You don&apos;t have permission to access this page.
          </p>
          {user && (
            <p className="text-slate-400 text-sm mb-6">
              Your role:{" "}
              <span className="font-semibold text-slate-300">{user.role}</span>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition transform hover:scale-105"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-lg shadow-lg hover:from-slate-700 hover:to-slate-800 transition transform hover:scale-105"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
