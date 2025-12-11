import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { pool } from "./db/connection";
import authRoutes from "./routes/auth";
import quizRoutes from "./routes/quiz";
import { authenticateSocket } from "./socket/auth";
import { registerQuizHandlers } from "./socket/quizHandler";
import { ServerToClientEvents, ClientToServerEvents } from "shared/src/types";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
// CORS configuration: allow credentials (cookies) from frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true, // Allow cookies to be sent
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(cookieParser()); // Parse cookies from requests

// Authentication routes mounted at /auth to separate concerns
// Exposes: POST /auth/signup and POST /auth/login
app.use("/auth", authRoutes);

// Quiz management routes mounted at /api/quizzes
// Requires authentication and teacher role
app.use("/api/quizzes", quizRoutes);

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Quiz Platform API" });
});

// Socket.io authentication middleware
io.use(authenticateSocket);

// Socket.io connection
io.on("connection", (socket) => {
  const userId = (socket as unknown as { userId: string; userRole: string }).userId;
  const userRole = (socket as unknown as { userId: string; userRole: string }).userRole;
  
  console.log("Client connected:", socket.id, "User:", userId, "Role:", userRole);

  // Join teachers to a teachers-only room for broadcasting
  if (userRole === 'TEACHER') {
    socket.join('teachers');
    console.log("Teacher joined teachers room:", socket.id);
  }

  // Register quiz management handlers
  registerQuizHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Test database connection
pool.query("SELECT NOW()", (err) => {
  if (err) {
    console.error("❌ Database connection error:", err);
  } else {
    console.log("✅ Database connection successful");
  }
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
