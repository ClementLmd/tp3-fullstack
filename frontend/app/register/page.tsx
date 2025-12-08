"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "STUDENT" as "TEACHER" | "STUDENT",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    // TODO: Implement register logic
    setTimeout(() => {
      setIsLoading(false);
      setError("Fonctionnalité en cours de développement");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Inscription</h2>
          <p className="mt-2 text-gray-600">Créez votre compte</p>
        </div>

        <Card>
          {error && <Alert type="error">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
              <Input
                label="Nom"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              placeholder="votre@email.com"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Je suis
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "TEACHER" })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.role === "TEACHER"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="text-2xl mb-1">👨‍🏫</div>
                  <div className="font-semibold">Enseignant</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "STUDENT" })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.role === "STUDENT"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="text-2xl mb-1">👨‍🎓</div>
                  <div className="font-semibold">Étudiant</div>
                </button>
              </div>
            </div>

            <Input
              label="Mot de passe"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              helperText="Minimum 8 caractères"
            />

            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              S&apos;inscrire
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Déjà un compte ?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Connectez-vous
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
