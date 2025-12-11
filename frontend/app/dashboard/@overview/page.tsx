'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/authStore';
import StatCard from '@/components/dashboard/StatCard';

interface TeacherStats {
  role: string;
  totalQuizzes: number;
  totalSessions: number;
  avgParticipants: number;
  totalParticipants: number;
}

interface StudentStats {
  role: string;
  totalParticipated: number;
  avgScore: number;
  totalScore: number;
  highestScore: number;
}

type StatsResponse = TeacherStats | StudentStats;

export default function OverviewSlot() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get<StatsResponse>('/dashboard/stats');
      return response.data;
    },
  });

  const user = useAuthStore((s) => s.user);

  if (isLoading) {
    return (
      <>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card animate-pulse h-28 bg-slate-700/50"></div>
        ))}
      </>
    );
  }

  if (user?.role === 'TEACHER' && stats && 'totalQuizzes' in stats) {
    const teacherStats = stats as TeacherStats;
    return (
      <>
        <StatCard 
          title="Total Quizzes" 
          value={teacherStats.totalQuizzes} 
          icon="📚"
          color="from-blue-500 to-blue-600"
        />
        <StatCard 
          title="Active Sessions" 
          value={teacherStats.totalSessions} 
          icon="🎯"
          color="from-cyan-500 to-cyan-600"
        />
        <StatCard 
          title="Avg Participants" 
          value={Math.round(teacherStats.avgParticipants)} 
          icon="👥"
          color="from-violet-500 to-violet-600"
        />
        <StatCard 
          title="Total Participants" 
          value={teacherStats.totalParticipants} 
          icon="📊"
          color="from-emerald-500 to-emerald-600"
        />
      </>
    );
  }

  if (user?.role === 'STUDENT' && stats && 'totalParticipated' in stats) {
    const studentStats = stats as StudentStats;
    return (
      <>
        <StatCard 
          title="Quizzes Attempted" 
          value={studentStats.totalParticipated} 
          icon="✅"
          color="from-green-500 to-green-600"
        />
        <StatCard 
          title="Average Score" 
          value={Math.round(studentStats.avgScore)} 
          icon="⭐"
          color="from-yellow-500 to-yellow-600"
        />
        <StatCard 
          title="Highest Score" 
          value={studentStats.highestScore} 
          icon="🏆"
          color="from-amber-500 to-amber-600"
        />
        <StatCard 
          title="Total Points" 
          value={studentStats.totalScore} 
          icon="💯"
          color="from-pink-500 to-pink-600"
        />
      </>
    );
  }

  return null;
}
