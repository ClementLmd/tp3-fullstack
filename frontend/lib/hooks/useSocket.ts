/**
 * Socket.io hook for real-time quiz sessions
 * Manages WebSocket connection and events for teachers and students
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Question, ServerToClientEvents, ClientToServerEvents } from 'shared';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

interface UseSocketOptions {
  autoConnect?: boolean;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = false } = options;
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
      setError(err.message);
    });

    socketRef.current = socket;
    return socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    connect,
    disconnect,
  };
}

// Teacher-specific socket hook
export function useTeacherSocket(sessionId: string | null) {
  const { socket, isConnected, error, connect, disconnect } = useSocket();
  const [connectedStudents, setConnectedStudents] = useState<number>(0);
  const [students, setStudents] = useState<Array<{ userId: string; userName: string }>>([]);

  useEffect(() => {
    if (!sessionId) return;

    const socketInstance = connect();

    // Join teacher room
    socketInstance.emit('joinTeacherRoom', { sessionId });

    // Listen for session updates
    socketInstance.on('sessionUpdate', (data) => {
      setConnectedStudents(data.connectedStudents);
      setStudents(data.students);
    });

    return () => {
      disconnect();
    };
  }, [sessionId, connect, disconnect]);

  const broadcastQuestion = useCallback(
    (question: Question) => {
      if (socket && sessionId) {
        socket.emit('broadcastQuestion', { sessionId, question });
      }
    },
    [socket, sessionId]
  );

  const broadcastResults = useCallback(
    (questionId: string) => {
      if (socket && sessionId) {
        socket.emit('broadcastResults', { sessionId, questionId });
      }
    },
    [socket, sessionId]
  );

  return {
    socket,
    isConnected,
    error,
    connectedStudents,
    students,
    broadcastQuestion,
    broadcastResults,
  };
}

// Student-specific socket hook
export function useStudentSocket() {
  const { socket, isConnected, error, connect, disconnect } = useSocket();
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [results, setResults] = useState<{
    questionId: string;
    leaderboard: Array<{ rank: number; userId: string; name: string; score: number }>;
  } | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState<{
    questionId: string;
    isCorrect: boolean;
    pointsEarned: number;
  } | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for questions
    socket.on('question', (question) => {
      setCurrentQuestion(question);
      setTimeLeft(question.timeLimit || null);
      setAnswerSubmitted(null); // Reset answer state for new question
    });

    // Listen for timer updates
    socket.on('timerUpdate', (data) => {
      setTimeLeft(data.timeLeft);
    });

    // Listen for time up
    socket.on('timeUp', () => {
      setTimeLeft(0);
    });

    // Listen for results
    socket.on('results', (data) => {
      setResults(data);
    });

    // Listen for answer confirmation
    socket.on('answerSubmitted', (data) => {
      setAnswerSubmitted(data);
    });

    return () => {
      socket.off('question');
      socket.off('timerUpdate');
      socket.off('timeUp');
      socket.off('results');
      socket.off('answerSubmitted');
    };
  }, [socket]);

  const joinSession = useCallback(
    (accessCode: string, userId: string, userName: string) => {
      const socketInstance = connect();
      socketInstance.emit('joinSession', { accessCode, userId, userName });
      
      return new Promise<{ sessionId: string; quizId: string; currentQuestionIndex: number }>((resolve, reject) => {
        socketInstance.once('joinedSession', (data) => {
          resolve(data);
        });
        
        socketInstance.once('error', (err) => {
          reject(new Error(err.message));
        });
      });
    },
    [connect]
  );

  const submitAnswer = useCallback(
    (questionId: string, answer: string) => {
      if (socket) {
        socket.emit('answer', { questionId, answer });
      }
    },
    [socket]
  );

  const leaveSession = useCallback(() => {
    if (socket) {
      socket.emit('leaveSession');
      disconnect();
    }
  }, [socket, disconnect]);

  return {
    socket,
    isConnected,
    error,
    currentQuestion,
    timeLeft,
    results,
    answerSubmitted,
    joinSession,
    submitAnswer,
    leaveSession,
  };
}
