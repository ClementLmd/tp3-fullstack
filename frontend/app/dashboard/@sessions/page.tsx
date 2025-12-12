'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/authStore';

interface Session {
  id: string;
  quizId: string;
  quizTitle: string;
  accessCode: string;
  isActive: boolean;
  startedAt: string;
  endedAt?: string;
  participantCount?: number;
  avgScore?: number;
  score?: number;
  completedAt?: string;
}

export default function SessionsSlot() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['dashboard-sessions'],
    queryFn: async () => {
      const response = await apiClient.get<Session[]>('/dashboard/sessions');
      return response.data;
    },
  });

  const handleSessionClick = (sessionId: string) => {
    if (user?.role === 'TEACHER') {
      router.push(`/dashboard/sessions/${sessionId}/results`);
    }
  };

  if (isLoading) {
    return (
      <div className="divide-y divide-slate-700">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-slate-600 rounded w-full mb-2"></div>
            <div className="h-3 bg-slate-600 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400 text-sm">📭 No sessions yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
      {sessions.slice(0, 10).map((session, index) => (
        <div
          key={session.id}
          onClick={() => handleSessionClick(session.id)}
          className={`p-4 hover:bg-slate-700/40 transition-all duration-300 group ${
            user?.role === 'TEACHER' ? 'cursor-pointer' : 'cursor-default'
          }`}
          style={{animationDelay: `${index * 0.05}s`}}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-white truncate text-sm group-hover:text-cyan-300 transition">
                  {session.quizTitle}
                </h4>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${
                    session.isActive
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50'
                      : 'bg-slate-600/50 text-slate-300 border border-slate-500/30'
                  }`}
                >
                  {session.isActive ? '🔴 Live' : '✓ Done'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Access: <span className="font-bold text-cyan-300">{session.accessCode}</span>
              </p>
              {user?.role === 'TEACHER' ? (
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                  <span>👥 {session.participantCount || 0}</span>
                  <span className="text-slate-600">•</span>
                  <span>Avg: {Math.round(session.avgScore || 0)}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-2">
                  Score: <span className="text-yellow-300 font-bold">{session.score}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
