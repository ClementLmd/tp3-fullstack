"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "../../../components/AuthGuard";
import { useQuizzes, useDeleteQuiz } from "../../../lib/hooks/useQuizzes";
import { UserRole } from "shared/src/types";

export default function QuizzesPage() {
  const router = useRouter();
  const { data: quizzes, isLoading, error } = useQuizzes();
  const deleteQuiz = useDeleteQuiz();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the quiz "${title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteQuiz.mutateAsync(id);
    } catch (err) {
      console.error("Failed to delete quiz:", err);
      alert("Failed to delete quiz. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AuthGuard roles={[UserRole.TEACHER]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                My Quizzes
              </h1>
              <p className="text-slate-300 mt-2">
                Create and manage your quiz collection
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg font-semibold shadow-lg hover:from-slate-700 hover:to-slate-800 transition transform hover:scale-105"
              >
                ← Back to Home
              </button>
              <button
                onClick={() => router.push("/teacher/quizzes/new")}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold shadow-lg hover:from-blue-700 hover:to-cyan-700 transition transform hover:scale-105"
              >
                + Create New Quiz
              </button>
            </div>
          </div>

          {/* Content */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
              <p className="text-slate-300 mt-4">Loading quizzes...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6 text-center">
              <p className="text-red-400 font-semibold">
                Failed to load quizzes
              </p>
              <p className="text-slate-300 mt-2">
                Please try refreshing the page
              </p>
            </div>
          )}

          {!isLoading && !error && quizzes && quizzes.length === 0 && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-12 text-center border border-blue-400/30">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-blue-300 mb-2">
                No quizzes yet
              </h2>
              <p className="text-slate-300 mb-6">
                Create your first quiz to get started
              </p>
              <button
                onClick={() => router.push("/teacher/quizzes/new")}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold shadow-lg hover:from-blue-700 hover:to-cyan-700 transition transform hover:scale-105"
              >
                Create Your First Quiz
              </button>
            </div>
          )}

          {!isLoading && !error && quizzes && quizzes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-xl p-6 border border-blue-400/30 hover:border-cyan-400/50 transition shadow-lg hover:shadow-xl"
                >
                  {/* Quiz Title */}
                  <h3 className="text-xl font-bold text-blue-300 mb-2 line-clamp-2">
                    {quiz.title}
                  </h3>

                  {/* Quiz Description */}
                  {quiz.description && (
                    <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}

                  {/* Quiz Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <span className="font-semibold">📊</span>
                      <span>
                        {quiz.questionCount ?? quiz.questions?.length ?? 0}{" "}
                        questions
                      </span>
                    </div>
                  </div>

                  {/* Quiz Date */}
                  <p className="text-slate-400 text-xs mb-4">
                    Created: {new Date(quiz.createdAt).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/teacher/quizzes/${quiz.id}`)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(quiz.id, quiz.title)}
                      disabled={deletingId === quiz.id}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === quiz.id ? "..." : "🗑️"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
