/**
 * Socket.io event handlers
 * 
 * Handles all WebSocket events from clients and manages session state.
 */

import { Server, Socket } from "socket.io";
import jwt, { Secret } from "jsonwebtoken";
import { COOKIE_NAME } from "../controllers/authController";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "shared/src/types";
import {
  handleJoinSession,
  handleAnswer,
  handleLeaveSession,
} from "./sessionManager";

/**
 * Authenticate socket connection using JWT from cookie
 */
function authenticateSocket(socket: Socket): { userId: string; role: string } | null {
  try {
    // Get token from handshake auth or cookies
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.cookie
        ?.split(";")
        .find((c) => c.trim().startsWith(`${COOKIE_NAME}=`))
        ?.split("=")[1];

    if (!token) {
      return null;
    }

    const secret: Secret = (process.env.JWT_SECRET || "default-secret") as unknown as Secret;
    const decoded = jwt.verify(token, secret) as { userId: string; role: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Setup socket.io event handlers
 */
export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log("Client connected:", socket.id);

    // Authenticate connection
    const auth = authenticateSocket(socket);
    if (!auth) {
      socket.emit("error", "Authentication required");
      socket.disconnect();
      return;
    }

    const { userId, role } = auth;
    console.log(`User ${userId} (${role}) connected with socket ${socket.id}`);

    // Handle join session (students only)
    socket.on("joinSession", async (data) => {
      if (role !== "STUDENT") {
        socket.emit("error", "Only students can join sessions");
        return;
      }

      await handleJoinSession(io, socket, data.accessCode, userId);
    });

    // Handle answer submission (students only)
    socket.on("answer", async (data) => {
      if (role !== "STUDENT") {
        socket.emit("error", "Only students can submit answers");
        return;
      }

      // Get access code from room
      const rooms = Array.from(socket.rooms);
      const sessionRoom = rooms.find((r) => r.startsWith("session:"));
      if (!sessionRoom) {
        socket.emit("error", "You are not in a session");
        return;
      }

      const accessCode = sessionRoom.replace("session:", "");
      await handleAnswer(io, socket, accessCode, userId, data.questionId, data.answer);
    });

    // Handle leave session
    socket.on("leaveSession", () => {
      const rooms = Array.from(socket.rooms);
      const sessionRoom = rooms.find((r) => r.startsWith("session:"));
      if (sessionRoom) {
        const accessCode = sessionRoom.replace("session:", "");
        handleLeaveSession(socket, accessCode, userId);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Clean up: leave all session rooms
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room.startsWith("session:")) {
          const accessCode = room.replace("session:", "");
          handleLeaveSession(socket, accessCode, userId);
        }
      });
    });
  });
}

