import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Quiz, Question, QuestionType } from 'shared/src/types';

// Types for creating/updating quizzes
export interface CreateQuizPayload {
  title: string;
  description?: string;
  questions: Omit<Question, 'id' | 'quizId' | 'createdAt' | 'updatedAt'>[];
}

export interface UpdateQuizPayload extends CreateQuizPayload {
  id: string;
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

// Hook to create a new quiz
export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation<Quiz, Error, CreateQuizPayload>({
    mutationFn: async (payload: CreateQuizPayload) => {
      const response = await apiClient.post<Quiz>('/api/quizzes', payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate quizzes list to refetch
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
}

// Hook to update an existing quiz
export function useUpdateQuiz() {
  const queryClient = useQueryClient();

  return useMutation<Quiz, Error, UpdateQuizPayload>({
    mutationFn: async ({ id, ...payload }: UpdateQuizPayload) => {
      const response = await apiClient.put<Quiz>(`/api/quizzes/${id}`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate both the list and the specific quiz
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quiz', data.id] });
    },
  });
}

// Hook to delete a quiz
export function useDeleteQuiz() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/quizzes/${id}`);
    },
    onSuccess: () => {
      // Invalidate quizzes list to refetch
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
}
