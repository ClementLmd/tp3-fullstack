/**
 * Hooks for managing quiz sessions
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";

interface Session {
  id: string;
  quizId: string;
  accessCode: string;
  isActive: boolean;
  currentQuestionIndex: number;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
  participantCount?: number;
}

interface StartSessionPayload {
  quizId: string;
}

/**
 * Hook to start a new quiz session
 */
export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation<Session, Error, StartSessionPayload>({
    mutationFn: async (payload: StartSessionPayload) => {
      const response = await apiClient.post<Session>("/api/sessions", payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

/**
 * Hook to get session details
 */
export function useSession(sessionId: string | null) {
  return useQuery<Session>({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error("Session ID is required");
      const response = await apiClient.get<Session>(`/api/sessions/${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId,
  });
}

/**
 * Hook to move to next question
 */
export function useNextQuestion() {
  return useMutation<void, Error, string>({
    mutationFn: async (sessionId: string) => {
      await apiClient.post(`/api/sessions/${sessionId}/next`);
    },
  });
}

/**
 * Hook to show results
 */
export function useShowResults() {
  return useMutation<void, Error, string>({
    mutationFn: async (sessionId: string) => {
      await apiClient.post(`/api/sessions/${sessionId}/results`);
    },
  });
}

/**
 * Hook to end session
 */
export function useEndSession() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (sessionId: string) => {
      await apiClient.post(`/api/sessions/${sessionId}/end`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

