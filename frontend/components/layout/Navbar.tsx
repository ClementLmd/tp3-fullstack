"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { Button } from "@/components/ui/Button";

export const Navbar = () => {
  const { user, logout, token } = useAuthStore();

  // Check authentication directly from state (safer with persist middleware)
  const isAuthenticated = !!token && !!user;

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Quiz Platform
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">
                  {user?.firstName} {user?.lastName}
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {user?.role === "TEACHER" ? "👨‍🏫 Enseignant" : "👨‍🎓 Étudiant"}
                  </span>
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Connexion
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Inscription
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
