/**
 * useWebSocket Hook
 * 
 * Manages WebSocket connection for real-time quiz sessions.
 * 
 * How WebSockets work:
 * 1. Client connects to server → persistent connection established
 * 2. Client joins a "room" (session) → receives events only for that room
 * 3. Server broadcasts events → all clients in the room receive them
 * 4. Client can emit events → server processes and responds
 * 
 * Example flow:
 * - Student joins session → socket.emit('joinSession', { accessCode, userId })
 * - Teacher sends question → server broadcasts 'question' event to room
 * - Student answers → socket.emit('answer', { questionId, answer })
 * - Server calculates results → broadcasts 'results' event with leaderboard
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "shared/src/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface UseWebSocketReturn {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  error: string | null;
  joinSession: (accessCode: string, userId: string) => void;
  leaveSession: () => void;
  submitAnswer: (questionId: string, answer: string) => void;
}

/**
 * useWebSocket hook
 * 
 * Creates and manages a Socket.io connection for real-time quiz sessions.
 * 
 * @returns {UseWebSocketReturn} Socket instance and helper functions
 * 
 * Usage:
 * ```tsx
 * const { socket, isConnected, joinSession, submitAnswer } = useWebSocket();
 * 
 * useEffect(() => {
 *   if (!socket) return;
 *   
 *   socket.on('question', (question) => {
 *     console.log('New question:', question);
 *   });
 *   
 *   socket.on('results', (results) => {
 *     console.log('Leaderboard:', results.leaderboard);
 *   });
 *   
 *   return () => {
 *     socket.off('question');
 *     socket.off('results');
 *   };
 * }, [socket]);
 * ```
 */
export function useWebSocket(): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  // Initialize socket connection
  useEffect(() => {
    // Create socket connection
    // Socket.io automatically handles reconnection
    const newSocket = io(API_URL, {
      withCredentials: true, // Send cookies (for authentication)
      transports: ["websocket", "polling"], // Fallback to polling if websocket fails
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;

    // Connection events
    newSocket.on("connect", () => {
      console.log("WebSocket connected:", newSocket.id);
      setIsConnected(true);
      setError(null);
    });

    newSocket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("WebSocket connection error:", err);
      setError("Failed to connect to server");
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, []);

  // Join a session room
  const joinSession = useCallback(
    (accessCode: string, userId: string) => {
      if (!socket || !isConnected) {
        setError("Not connected to server");
        return;
      }

      socket.emit("joinSession", { accessCode, userId });
    },
    [socket, isConnected]
  );

  // Leave current session
  const leaveSession = useCallback(() => {
    if (!socket) return;
    socket.emit("leaveSession");
  }, [socket]);

  // Submit an answer
  const submitAnswer = useCallback(
    (questionId: string, answer: string) => {
      if (!socket || !isConnected) {
        setError("Not connected to server");
        return;
      }

      socket.emit("answer", { questionId, answer });
    },
    [socket, isConnected]
  );

  return {
    socket,
    isConnected,
    error,
    joinSession,
    leaveSession,
    submitAnswer,
  };
}

