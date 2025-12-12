"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import AuthGuard from "@/components/AuthGuard";
import { UserRole } from "shared/src/types";

interface QuizSummary {
  questions: Array<{
    questionId: string;
    questionText: string;
    correctAnswer: string;
    studentAnswer?: string;
    isCorrect?: boolean;
    points: number;
  }>;
  finalScore: number;
}

export default function SessionSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const {
    data: summary,
    isLoading,
    error,
  } = useQuery<QuizSummary>({
    queryKey: ["session-summary", sessionId],
    queryFn: async () => {
      const response = await apiClient.get<QuizSummary>(
        `/dashboard/sessions/${sessionId}/results`
      );
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <AuthGuard roles={[UserRole.STUDENT]}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-slate-300 mt-4">Loading quiz summary...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !summary) {
    return (
      <AuthGuard roles={[UserRole.STUDENT]}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-xl mb-4">
              Failed to load quiz summary
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard roles={[UserRole.STUDENT]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent mb-4">
              Récapitulatif du Quiz
            </h2>
            <div className="bg-gradient-to-br from-yellow-800 to-orange-800 rounded-xl p-6 border border-yellow-400/50 inline-block">
              <p className="text-yellow-200 text-sm mb-2">Score Final</p>
              <p className="text-5xl font-black text-white">
                {summary.finalScore}
              </p>
              <p className="text-yellow-300 text-sm mt-2">points</p>
            </div>
          </div>

          {/* Quiz Summary */}
          {summary.questions.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden mb-8">
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-2xl font-bold text-white">
                  📋 Détails des Questions
                </h3>
              </div>
              <div className="divide-y divide-slate-700">
                {summary.questions.map((q, index) => (
                  <div key={q.questionId} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-lg font-bold text-blue-300">
                            Question {index + 1}
                          </span>
                          {q.isCorrect !== undefined ? (
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                q.isCorrect
                                  ? "bg-green-500/20 text-green-300"
                                  : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {q.isCorrect ? "✅ Correct" : "❌ Incorrect"}
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-500/20 text-red-300">
                              ❌ Incorrect
                            </span>
                          )}
                          {q.points > 0 && (
                            <span className="text-yellow-300 text-sm">
                              +{q.points} points
                            </span>
                          )}
                        </div>
                        <p className="text-white text-lg mb-4">
                          {q.questionText}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-green-300 text-sm font-semibold mb-1">
                          ✅ Bonne réponse:
                        </p>
                        <p className="text-white">{q.correctAnswer}</p>
                      </div>
                      {q.studentAnswer !== undefined && (
                        <div
                          className={`p-3 rounded-lg border ${
                            q.isCorrect
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-red-500/10 border-red-500/30"
                          }`}
                        >
                          <p
                            className={`text-sm font-semibold mb-1 ${
                              q.isCorrect ? "text-green-300" : "text-red-300"
                            }`}
                          >
                            {q.isCorrect ? "✅" : "❌"} Votre réponse:
                          </p>
                          <p className="text-white">{q.studentAnswer}</p>
                        </div>
                      )}
                      {q.studentAnswer === undefined && (
                        <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
                          <p className="text-slate-400 text-sm">
                            ⏱️ Aucune réponse soumise (temps écoulé)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="text-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition transform hover:scale-105"
            >
              Retour au Dashboard
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
