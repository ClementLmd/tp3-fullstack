import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { pool } from "./db/connection";
import dashboardRoutes from "./routes/dashboard";
import authRoutes from "./routes/auth";
import quizRoutes from "./routes/quiz";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
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

// Dashboard routes mounted at /dashboard with authentication
// All endpoints require valid JWT token
app.use('/dashboard', dashboardRoutes);

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Quiz Platform API" });
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

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
