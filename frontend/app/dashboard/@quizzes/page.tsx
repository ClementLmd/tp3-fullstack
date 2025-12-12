"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";

interface Quiz {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  sessionCount?: number;
  totalParticipants?: number;
  bestScore?: number;
  questionCount?: number;
}

export default function QuizzesSlot() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["dashboard-quizzes"],
    queryFn: async () => {
      const response = await apiClient.get<Quiz[]>("/dashboard/quizzes");
      return response.data;
    },
  });

  const handleQuizClick = (quizId: string) => {
    if (user?.role === "TEACHER") {
      router.push(`/teacher/quizzes/${quizId}`);
    }
  };

  const handleEditQuiz = (e: React.MouseEvent, quizId: string) => {
    e.stopPropagation();
    router.push(`/teacher/quizzes/${quizId}`);
  };

  const handleHostQuiz = (e: React.MouseEvent, quizId: string) => {
    e.stopPropagation();
    router.push(`/teacher/quizzes/${quizId}/host`);
  };

  if (isLoading) {
    return (
      <div className="divide-y divide-slate-700">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 animate-pulse">
            <div className="h-5 bg-slate-600 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-slate-600 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-400 text-lg font-medium">
          📭 No quizzes available
        </p>
        <p className="text-slate-500 text-sm mt-2">
          Create a new quiz to get started
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-700">
      {quizzes.map((quiz, index) => (
        <div
          key={quiz.id}
          onClick={() => handleQuizClick(quiz.id)}
          className={`p-6 hover:bg-slate-700/40 transition-all duration-300 group border-l-4 border-l-transparent hover:border-l-cyan-500 ${
            user?.role === "TEACHER" ? "cursor-pointer" : "cursor-default"
          }`}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition duration-200 truncate">
                {quiz.title}
              </h3>
              {quiz.description && (
                <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                  {quiz.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  📅 {new Date(quiz.createdAt).toLocaleDateString()}
                </span>
                {quiz.sessionCount !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                    🎯 {quiz.sessionCount} sessions
                  </span>
                )}
                {quiz.totalParticipants !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-full">
                    👥 {quiz.totalParticipants} people
                  </span>
                )}
                {quiz.bestScore !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full">
                    ⭐ Best: {quiz.bestScore}
                  </span>
                )}
              </div>
              {user?.role === "TEACHER" && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={(e) => handleEditQuiz(e, quiz.id)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-blue-800 transition transform hover:scale-105"
                  >
                    ✏️ Edit
                  </button>
                  {(quiz.questionCount ?? 0) > 0 && (
                    <button
                      onClick={(e) => handleHostQuiz(e, quiz.id)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-sm hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
                    >
                      🎯 Host Quiz
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:shadow-cyan-500/30 transition-all duration-300">
                {quiz.sessionCount !== undefined ? "📚" : "✓"}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
