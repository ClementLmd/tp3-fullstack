/**
 * React Query hooks for session management API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Session } from 'shared';

// Extended session type with additional UI fields
export interface SessionWithDetails extends Session {
  quizTitle?: string;
}

// Hook to create a new session
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation<Session, Error, { quizId: string }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<Session>('/api/sessions', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

// Hook to get a session by ID
export function useSession(sessionId: string | null) {
  return useQuery<SessionWithDetails>({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      const response = await apiClient.get<SessionWithDetails>(`/api/sessions/${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId,
  });
}

// Hook to start a session
export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (sessionId: string) => {
      await apiClient.patch(`/api/sessions/${sessionId}/start`);
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
}

// Hook to broadcast a question
export function useBroadcastQuestion() {
  return useMutation<
    { question: any },
    Error,
    { sessionId: string; questionIndex: number }
  >({
    mutationFn: async ({ sessionId, questionIndex }) => {
      const response = await apiClient.patch(
        `/api/sessions/${sessionId}/question`,
        { questionIndex }
      );
      return response.data;
    },
  });
}

// Hook to end a session
export function useEndSession() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (sessionId: string) => {
      await apiClient.delete(`/api/sessions/${sessionId}`);
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

// Hook to get session by access code (for students)
export function useSessionByCode(accessCode: string | null) {
  return useQuery<SessionWithDetails>({
    queryKey: ['session-by-code', accessCode],
    queryFn: async () => {
      if (!accessCode) throw new Error('Access code is required');
      const response = await apiClient.get<SessionWithDetails>(
        `/api/sessions/by-code/${accessCode.toUpperCase()}`
      );
      return response.data;
    },
    enabled: !!accessCode,
    retry: false, // Don't retry on 404
  });
}
