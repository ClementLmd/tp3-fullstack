"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";

interface TeacherQuiz {
  id: string;
  title: string;
  sessionCount: number;
  totalParticipants: number;
  avgScore: number;
  maxScore: number;
}

interface StudentQuiz {
  id: string;
  title: string;
  bestScore: number;
  maxScore: number;
}

export default function PerformanceSlot() {
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["dashboard-quizzes"],
    queryFn: async () => {
      const response = await apiClient.get<TeacherQuiz[] | StudentQuiz[]>(
        "/dashboard/quizzes"
      );
      return response.data;
    },
  });

  const user = useAuthStore((s) => s.user);

  if (isLoading) {
    return <div className="animate-pulse h-40 bg-slate-700/50 rounded"></div>;
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">📊 No performance data yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {user?.role === "TEACHER" ? (
        <TeacherPerformance quizzes={quizzes as TeacherQuiz[]} />
      ) : (
        <StudentPerformance quizzes={quizzes as StudentQuiz[]} />
      )}
    </div>
  );
}

function TeacherPerformance({ quizzes }: { quizzes: TeacherQuiz[] }) {
  const totalEngagement = quizzes.reduce(
    (sum, q) => sum + q.totalParticipants,
    0
  );
  const avgEngagement =
    quizzes.length > 0 ? Math.round(totalEngagement / quizzes.length) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-4 rounded-lg border border-blue-500/30 hover:border-blue-400/50 transition">
          <p className="text-slate-400 text-sm font-medium">Total Engagement</p>
          <p className="text-3xl font-black text-blue-300 mt-2">
            {totalEngagement}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            students participated 📈
          </p>
        </div>
        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 p-4 rounded-lg border border-cyan-500/30 hover:border-cyan-400/50 transition">
          <p className="text-slate-400 text-sm font-medium">Avg Engagement</p>
          <p className="text-3xl font-black text-cyan-300 mt-2">
            {avgEngagement}
          </p>
          <p className="text-xs text-slate-500 mt-2">per quiz 📊</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span>📈 Quiz Performance Breakdown</span>
        </h4>
        <div className="space-y-3">
          {quizzes.map((quiz, index) => {
            // Calculate percentage based on actual max score, fallback to 100 if maxScore is 0
            const maxScore = quiz.maxScore || 100;
            const percentage =
              maxScore > 0
                ? Math.min((quiz.avgScore / maxScore) * 100, 100)
                : 0;

            return (
              <div key={quiz.id} className="group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition truncate">
                    {quiz.title}
                  </span>
                  <span className="text-xs font-bold text-cyan-300 bg-cyan-500/20 px-2 py-1 rounded-full">
                    {Math.round(quiz.avgScore)}
                    {maxScore > 0 && ` / ${maxScore}`}
                  </span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden border border-slate-600/50">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700 ease-out"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StudentPerformance({ quizzes }: { quizzes: StudentQuiz[] }) {
  const avgScore =
    quizzes.length > 0
      ? Math.round(
          quizzes.reduce((sum, q) => sum + q.bestScore, 0) / quizzes.length
        )
      : 0;
  const topScore =
    quizzes.length > 0 ? Math.max(...quizzes.map((q) => q.bestScore)) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 p-4 rounded-lg border border-yellow-500/30 hover:border-yellow-400/50 transition">
          <p className="text-slate-400 text-sm font-medium">Average Score</p>
          <p className="text-3xl font-black text-yellow-300 mt-2">{avgScore}</p>
          <p className="text-xs text-slate-500 mt-2">📊 across all quizzes</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 p-4 rounded-lg border border-green-500/30 hover:border-green-400/50 transition">
          <p className="text-slate-400 text-sm font-medium">Best Score</p>
          <p className="text-3xl font-black text-green-300 mt-2">{topScore}</p>
          <p className="text-xs text-slate-500 mt-2">🏆 your record</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span>⭐ Your Score Progression</span>
        </h4>
        <div className="space-y-3">
          {quizzes.map((quiz, index) => {
            // Calculate percentage based on actual max score, fallback to 100 if maxScore is 0
            const maxScore = quiz.maxScore || 100;
            const percentage =
              maxScore > 0
                ? Math.min((quiz.bestScore / maxScore) * 100, 100)
                : 0;

            return (
              <div key={quiz.id} className="group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-white group-hover:text-yellow-300 transition truncate">
                    {quiz.title}
                  </span>
                  <span className="text-xs font-bold text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded-full">
                    {quiz.bestScore}
                    {maxScore > 0 && ` / ${maxScore}`}
                  </span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden border border-slate-600/50">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-700 ease-out"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
