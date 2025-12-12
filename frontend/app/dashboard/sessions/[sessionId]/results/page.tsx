"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import AuthGuard from "@/components/AuthGuard";
import { UserRole } from "shared/src/types";

interface SessionResult {
  session: {
    id: string;
    quizId: string;
    quizTitle: string;
    accessCode: string;
    isActive: boolean;
    startedAt: string;
    endedAt?: string;
  };
  participants: Array<{
    participationId: string;
    userId: string;
    name: string;
    email: string;
    score: number;
    correctAnswers: number;
    totalAnswers: number;
    joinedAt: string;
    completedAt?: string;
  }>;
}

export default function SessionResultsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const { data, isLoading, error } = useQuery<SessionResult>({
    queryKey: ["session-results", sessionId],
    queryFn: async () => {
      const response = await apiClient.get<SessionResult>(
        `/dashboard/sessions/${sessionId}/results`
      );
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <AuthGuard roles={[UserRole.TEACHER]}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-slate-300 mt-4">Loading session results...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !data) {
    return (
      <AuthGuard roles={[UserRole.TEACHER]}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-xl mb-4">
              Failed to load session results
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

  const { session, participants } = data;
  const avgScore =
    participants.length > 0
      ? Math.round(
          participants.reduce((sum, p) => sum + p.score, 0) /
            participants.length
        )
      : 0;
  const maxScore = Math.max(...participants.map((p) => p.score), 0);

  return (
    <AuthGuard roles={[UserRole.TEACHER]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Session Results
            </h1>
            <div className="mt-4 space-y-2">
              <p className="text-slate-300 text-lg">
                <span className="font-semibold">Quiz:</span> {session.quizTitle}
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>
                  <span className="font-semibold">Access Code:</span>{" "}
                  <span className="font-mono text-cyan-300">
                    {session.accessCode}
                  </span>
                </span>
                <span>•</span>
                <span>
                  <span className="font-semibold">Status:</span>{" "}
                  <span
                    className={`${
                      session.isActive
                        ? "text-emerald-400"
                        : "text-slate-400"
                    }`}
                  >
                    {session.isActive ? "🔴 Active" : "✓ Completed"}
                  </span>
                </span>
              </div>
              {session.startedAt && (
                <p className="text-sm text-slate-400">
                  <span className="font-semibold">Started:</span>{" "}
                  {new Date(session.startedAt).toLocaleString()}
                </p>
              )}
              {session.endedAt && (
                <p className="text-sm text-slate-400">
                  <span className="font-semibold">Ended:</span>{" "}
                  {new Date(session.endedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-6 rounded-lg border border-blue-500/30">
              <p className="text-slate-400 text-sm font-medium">
                Total Participants
              </p>
              <p className="text-3xl font-black text-blue-300 mt-2">
                {participants.length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 p-6 rounded-lg border border-yellow-500/30">
              <p className="text-slate-400 text-sm font-medium">
                Average Score
              </p>
              <p className="text-3xl font-black text-yellow-300 mt-2">
                {avgScore}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 p-6 rounded-lg border border-green-500/30">
              <p className="text-slate-400 text-sm font-medium">Top Score</p>
              <p className="text-3xl font-black text-green-300 mt-2">
                {maxScore}
              </p>
            </div>
          </div>

          {/* Participants Table */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">
                Participants Leaderboard
              </h2>
            </div>
            {participants.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-400">No participants yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Correct Answers
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Joined At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {participants.map((participant, index) => (
                      <tr
                        key={participant.participationId}
                        className="hover:bg-slate-700/30 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {index === 0 && (
                              <span className="text-2xl mr-2">🥇</span>
                            )}
                            {index === 1 && (
                              <span className="text-2xl mr-2">🥈</span>
                            )}
                            {index === 2 && (
                              <span className="text-2xl mr-2">🥉</span>
                            )}
                            {index > 2 && (
                              <span className="text-slate-400 font-semibold w-8">
                                #{index + 1}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {participant.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-400">
                            {participant.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-yellow-300">
                            {participant.score}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-300">
                            {participant.correctAnswers} / {participant.totalAnswers}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-400">
                            {new Date(participant.joinedAt).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

