import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Quiz, Question, QuestionType } from 'shared/src/types';
import { useSocketQuiz } from './useSocketQuiz';

// Types for creating/updating quizzes
export interface CreateQuizPayload {
  title: string;
  description?: string;
  questions: Omit<Question, 'id' | 'quizId' | 'createdAt' | 'updatedAt'>[];
}

export interface UpdateQuizPayload extends CreateQuizPayload {
  id: string;
}

// Hook to use socket.io for real-time updates
export function useQuizzesRealtime() {
  const queryClient = useQueryClient();

  const socketOps = useSocketQuiz({
    enabled: true,
    onQuizCreated: (quiz) => {
      // Add new quiz to the cache
      queryClient.setQueryData<Quiz[]>(['quizzes'], (old) => {
        if (!old) return [quiz];
        // Check if quiz already exists (avoid duplicates)
        if (old.some(q => q.id === quiz.id)) return old;
        return [quiz, ...old];
      });
    },
    onQuizUpdated: (quiz) => {
      // Update quiz in the cache
      queryClient.setQueryData<Quiz[]>(['quizzes'], (old) => {
        if (!old) return [quiz];
        return old.map(q => q.id === quiz.id ? quiz : q);
      });
      // Also update the individual quiz cache
      queryClient.setQueryData(['quiz', quiz.id], quiz);
    },
    onQuizDeleted: (quizId) => {
      // Remove quiz from the cache
      queryClient.setQueryData<Quiz[]>(['quizzes'], (old) => {
        if (!old) return [];
        return old.filter(q => q.id !== quizId);
      });
      // Remove from individual quiz cache
      queryClient.removeQueries({ queryKey: ['quiz', quizId] });
    },
  });

  return socketOps;
}

// Hook to fetch all quizzes for the teacher
export function useQuizzes() {
  return useQuery<Quiz[]>({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const response = await apiClient.get<Quiz[]>('/api/quizzes');
      return response.data;
    },
  });
}

// Hook to fetch a specific quiz by ID
export function useQuiz(id: string | null) {
  return useQuery<Quiz>({
    queryKey: ['quiz', id],
    queryFn: async () => {
      if (!id) throw new Error('Quiz ID is required');
      const response = await apiClient.get<Quiz>(`/api/quizzes/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Hook to create a new quiz (using socket.io)
export function useCreateQuizSocket() {
  const queryClient = useQueryClient();
  const { createQuiz, isConnected } = useQuizzesRealtime();

  return useMutation<Quiz, Error, CreateQuizPayload>({
    mutationFn: async (payload: CreateQuizPayload) => {
      const response = await createQuiz(payload);
      if (!response.success || !response.quiz) {
        throw new Error(response.error || 'Failed to create quiz');
      }
      return response.quiz;
    },
    onSuccess: (quiz) => {
      // Update cache optimistically
      queryClient.setQueryData<Quiz[]>(['quizzes'], (old) => {
        if (!old) return [quiz];
        return [quiz, ...old];
      });
    },
    meta: {
      isConnected,
    },
  });
}

// Hook to update an existing quiz (using socket.io)
export function useUpdateQuizSocket() {
  const queryClient = useQueryClient();
  const { updateQuiz, isConnected } = useQuizzesRealtime();

  return useMutation<Quiz, Error, UpdateQuizPayload>({
    mutationFn: async ({ id, ...payload }: UpdateQuizPayload) => {
      const response = await updateQuiz(id, payload);
      if (!response.success || !response.quiz) {
        throw new Error(response.error || 'Failed to update quiz');
      }
      return response.quiz;
    },
    onSuccess: (quiz) => {
      // Update cache optimistically
      queryClient.setQueryData<Quiz[]>(['quizzes'], (old) => {
        if (!old) return [quiz];
        return old.map(q => q.id === quiz.id ? quiz : q);
      });
      queryClient.setQueryData(['quiz', quiz.id], quiz);
    },
    meta: {
      isConnected,
    },
  });
}

// Hook to delete a quiz (using socket.io)
export function useDeleteQuizSocket() {
  const queryClient = useQueryClient();
  const { deleteQuiz, isConnected } = useQuizzesRealtime();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const response = await deleteQuiz(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete quiz');
      }
    },
    onSuccess: (_, quizId) => {
      // Remove from cache optimistically
      queryClient.setQueryData<Quiz[]>(['quizzes'], (old) => {
        if (!old) return [];
        return old.filter(q => q.id !== quizId);
      });
      queryClient.removeQueries({ queryKey: ['quiz', quizId] });
    },
    meta: {
      isConnected,
    },
  });
}


// Keep REST API hooks as fallbacks
export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation<Quiz, Error, CreateQuizPayload>({
    mutationFn: async (payload: CreateQuizPayload) => {
      const response = await apiClient.post<Quiz>('/api/quizzes', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient();

  return useMutation<Quiz, Error, UpdateQuizPayload>({
    mutationFn: async ({ id, ...payload }: UpdateQuizPayload) => {
      const response = await apiClient.put<Quiz>(`/api/quizzes/${id}`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quiz', data.id] });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/quizzes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
}
