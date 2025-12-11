/**
 * Socket.io hook for real-time quiz management
 * Provides socket connection and quiz CRUD operations
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Quiz, CreateQuizRequest, ServerToClientEvents, ClientToServerEvents } from 'shared/src/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

interface UseSocketQuizOptions {
  enabled?: boolean;
  onQuizCreated?: (quiz: Quiz) => void;
  onQuizUpdated?: (quiz: Quiz) => void;
  onQuizDeleted?: (quizId: string) => void;
  onError?: (error: string) => void;
}

interface SocketQuizOperations {
  createQuiz: (data: CreateQuizRequest) => Promise<{ success: boolean; quiz?: Quiz; error?: string }>;
  updateQuiz: (quizId: string, data: CreateQuizRequest) => Promise<{ success: boolean; quiz?: Quiz; error?: string }>;
  deleteQuiz: (quizId: string) => Promise<{ success: boolean; error?: string }>;
  isConnected: boolean;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
}

/**
 * Custom hook to manage socket.io connection and quiz operations
 */
export function useSocketQuiz(options: UseSocketQuizOptions = {}): SocketQuizOperations {
  const {
    enabled = true,
    onQuizCreated,
    onQuizUpdated,
    onQuizDeleted,
    onError,
  } = options;

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Initialize socket connection with credentials (cookies)
    // Since we're using httpOnly cookies, we don't need to pass token explicitly
    // The cookies will be sent automatically with withCredentials: true
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
      withCredentials: true, // Send cookies with socket connection
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      if (onError) {
        onError(`Connection error: ${error.message}`);
      }
    });

    // Quiz event handlers
    socket.on('quizCreated', (quiz) => {
      console.log('Quiz created:', quiz);
      if (onQuizCreated) {
        onQuizCreated(quiz);
      }
    });

    socket.on('quizUpdated', (quiz) => {
      console.log('Quiz updated:', quiz);
      if (onQuizUpdated) {
        onQuizUpdated(quiz);
      }
    });

    socket.on('quizDeleted', (quizId) => {
      console.log('Quiz deleted:', quizId);
      if (onQuizDeleted) {
        onQuizDeleted(quizId);
      }
    });

    socket.on('error', (message) => {
      console.error('Socket error:', message);
      if (onError) {
        onError(message);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('quizCreated');
      socket.off('quizUpdated');
      socket.off('quizDeleted');
      socket.off('error');
      socket.close();
    };
  }, [enabled, onQuizCreated, onQuizUpdated, onQuizDeleted, onError]);

  // Create quiz operation
  const createQuiz = useCallback(async (data: CreateQuizRequest): Promise<{ success: boolean; quiz?: Quiz; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current || !isConnected) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      socketRef.current.emit('createQuiz', data, (response) => {
        resolve(response);
      });
    });
  }, [isConnected]);

  // Update quiz operation
  const updateQuiz = useCallback(async (quizId: string, data: CreateQuizRequest): Promise<{ success: boolean; quiz?: Quiz; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current || !isConnected) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      socketRef.current.emit('updateQuiz', { quizId, ...data }, (response) => {
        resolve(response);
      });
    });
  }, [isConnected]);

  // Delete quiz operation
  const deleteQuiz = useCallback(async (quizId: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current || !isConnected) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      socketRef.current.emit('deleteQuiz', { quizId }, (response) => {
        resolve(response);
      });
    });
  }, [isConnected]);

  return {
    createQuiz,
    updateQuiz,
    deleteQuiz,
    isConnected,
    socket: socketRef.current,
  };
}
