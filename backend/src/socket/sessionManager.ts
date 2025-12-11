/**
 * Session Manager for WebSocket Quiz Sessions
 *
 * Manages real-time quiz sessions using Socket.io rooms.
 * Each session is identified by an access code and contains:
 * - Active participants (students)
 * - Current question index
 * - Timer state
 * - Leaderboard
 */

import { Server, Socket } from "socket.io";
import { query } from "../db/connection";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  Question,
} from "shared/src/types";

interface SessionState {
  sessionId: string;
  quizId: string;
  accessCode: string;
  currentQuestionIndex: number;
  questions: Question[];
  participants: Map<string, ParticipantInfo>;
  timer?: NodeJS.Timeout;
  timeLeft?: number;
}

interface ParticipantInfo {
  userId: string;
  socketId: string;
  name: string;
  score: number;
  answers: Map<string, AnswerInfo>; // questionId -> answer
}

interface AnswerInfo {
  answer: string;
  isCorrect: boolean;
  points: number;
  answeredAt: Date;
}

// Store active sessions: accessCode -> SessionState
const activeSessions = new Map<string, SessionState>();

/**
 * Get or create session state
 */
function getSessionState(accessCode: string): SessionState | null {
  return activeSessions.get(accessCode) || null;
}

/**
 * Initialize a new session state from database
 */
export async function initializeSession(
  sessionId: string,
  accessCode: string
): Promise<SessionState | null> {
  try {
    // Get session and quiz info
    const sessionResult = await query(
      `SELECT s.id, s.quiz_id, s.access_code, s.current_question_index, s.is_active
       FROM sessions s
       WHERE s.id = $1 AND s.access_code = $2`,
      [sessionId, accessCode]
    );

    if (!sessionResult.rows.length) {
      return null;
    }

    const session = sessionResult.rows[0];

    // Get all questions for this quiz
    const questionsResult = await query(
      `SELECT id, quiz_id, text, type, options, correct_answer, "order", points, time_limit
       FROM questions
       WHERE quiz_id = $1
       ORDER BY "order" ASC`,
      [session.quiz_id]
    );

    const questions: Question[] = questionsResult.rows.map((q) => ({
      id: q.id,
      quizId: q.quiz_id,
      text: q.text,
      type: q.type,
      options: q.options,
      correctAnswer: q.correct_answer,
      order: q.order,
      points: q.points,
      timeLimit: q.time_limit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const sessionState: SessionState = {
      sessionId: session.id,
      quizId: session.quiz_id,
      accessCode: session.access_code,
      // Start at -1 if no questions have been sent yet (current_question_index = 0)
      // This allows "Start First Question" to increment to 0 and send the first question
      currentQuestionIndex:
        session.current_question_index === 0
          ? -1
          : session.current_question_index - 1,
      questions,
      participants: new Map(),
    };

    activeSessions.set(accessCode, sessionState);
    return sessionState;
  } catch (error) {
    console.error("Error initializing session:", error);
    return null;
  }
}

/**
 * Handle student joining a session
 */
export async function handleJoinSession(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  accessCode: string,
  userId: string
): Promise<void> {
  try {
    // Get user info
    const userResult = await query(
      `SELECT id, first_name, last_name, role FROM users WHERE id = $1`,
      [userId]
    );

    if (!userResult.rows.length) {
      socket.emit("error", "User not found");
      return;
    }

    const user = userResult.rows[0];
    if (user.role !== "STUDENT") {
      socket.emit("error", "Only students can join sessions");
      return;
    }

    // Get or initialize session
    let sessionState = getSessionState(accessCode);
    if (!sessionState) {
      // Try to find session in database
      const sessionResult = await query(
        `SELECT id FROM sessions WHERE access_code = $1 AND is_active = true`,
        [accessCode]
      );

      if (!sessionResult.rows.length) {
        socket.emit("error", "Session not found or not active");
        return;
      }

      sessionState = await initializeSession(
        sessionResult.rows[0].id,
        accessCode
      );

      if (!sessionState) {
        socket.emit("error", "Failed to initialize session");
        return;
      }
    }

    // Join socket room
    socket.join(`session:${accessCode}`);

    // Add participant
    const participant: ParticipantInfo = {
      userId,
      socketId: socket.id,
      name: `${user.first_name} ${user.last_name}`,
      score: 0,
      answers: new Map(),
    };

    sessionState.participants.set(userId, participant);

    // Notify student they joined successfully
    socket.emit("sessionStarted", {
      id: sessionState.sessionId,
      quizId: sessionState.quizId,
      accessCode: sessionState.accessCode,
      isActive: true,
      currentQuestionIndex: sessionState.currentQuestionIndex,
      createdAt: new Date().toISOString(),
    });

    console.log(
      `Student ${user.first_name} ${user.last_name} joined session ${accessCode}`
    );
  } catch (error) {
    console.error("Error joining session:", error);
    socket.emit("error", "Failed to join session");
  }
}

/**
 * Handle student submitting an answer
 */
export async function handleAnswer(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  accessCode: string,
  userId: string,
  questionId: string,
  answer: string
): Promise<void> {
  try {
    const sessionState = getSessionState(accessCode);
    if (!sessionState) {
      socket.emit("error", "Session not found");
      return;
    }

    const participant = sessionState.participants.get(userId);
    if (!participant) {
      socket.emit("error", "You are not in this session");
      return;
    }

    // Check if already answered
    if (participant.answers.has(questionId)) {
      socket.emit("error", "You have already answered this question");
      return;
    }

    // Get current question
    const currentQuestion =
      sessionState.questions[sessionState.currentQuestionIndex];
    if (!currentQuestion || currentQuestion.id !== questionId) {
      socket.emit("error", "Invalid question");
      return;
    }

    // Check answer correctness
    let isCorrect = false;
    let points = 0;

    if (currentQuestion.type === "MULTIPLE_CHOICE") {
      const options = currentQuestion.options as {
        choices: string[];
        correctAnswer: number;
      };
      isCorrect = answer === options.choices[options.correctAnswer];
    } else {
      isCorrect =
        answer.toLowerCase().trim() ===
        currentQuestion.correctAnswer?.toLowerCase().trim();
    }

    if (isCorrect) {
      points = currentQuestion.points || 0;
      participant.score += points;
    }

    // Store answer
    participant.answers.set(questionId, {
      answer,
      isCorrect,
      points,
      answeredAt: new Date(),
    });

    // Save to database
    await query(
      `INSERT INTO participations (session_id, user_id, score)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id, user_id) 
       DO UPDATE SET score = $3`,
      [sessionState.sessionId, userId, participant.score]
    );

    await query(
      `INSERT INTO answers (question_id, participation_id, answer, is_correct, points)
       SELECT $1, p.id, $2, $3, $4
       FROM participations p
       WHERE p.session_id = $5 AND p.user_id = $6`,
      [questionId, answer, isCorrect, points, sessionState.sessionId, userId]
    );

    console.log(
      `Student ${participant.name} answered question ${questionId}: ${
        isCorrect ? "correct" : "incorrect"
      }`
    );
  } catch (error) {
    console.error("Error handling answer:", error);
    socket.emit("error", "Failed to submit answer");
  }
}

/**
 * Start next question (teacher action)
 */
export async function startNextQuestion(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  accessCode: string
): Promise<boolean> {
  const sessionState = getSessionState(accessCode);
  if (!sessionState) {
    return false;
  }

  // Increment question index to move to next question
  sessionState.currentQuestionIndex += 1;

  // Check if there are more questions
  if (sessionState.currentQuestionIndex >= sessionState.questions.length) {
    // End session
    await endSession(io, accessCode);
    return false;
  }

  const question = sessionState.questions[sessionState.currentQuestionIndex];

  // Update database
  await query(`UPDATE sessions SET current_question_index = $1 WHERE id = $2`, [
    sessionState.currentQuestionIndex,
    sessionState.sessionId,
  ]);

  // Broadcast question to all participants
  io.to(`session:${accessCode}`).emit("question", question);

  console.log(
    `Question ${sessionState.currentQuestionIndex + 1}/${
      sessionState.questions.length
    } sent to session ${accessCode}`
  );

  // Clear any existing timer before starting a new one
  if (sessionState.timer) {
    clearInterval(sessionState.timer);
    sessionState.timer = undefined;
  }

  // Start timer if question has time limit
  if (question.timeLimit) {
    sessionState.timeLeft = question.timeLimit;
    sessionState.timer = setInterval(() => {
      if (sessionState.timeLeft === undefined || sessionState.timeLeft <= 0) {
        clearInterval(sessionState.timer);
        sessionState.timer = undefined;
        sessionState.timeLeft = 0;
        io.to(`session:${accessCode}`).emit("timerUpdate", 0);
        showResults(io, accessCode);
        return;
      }

      sessionState.timeLeft -= 1;
      io.to(`session:${accessCode}`).emit("timerUpdate", sessionState.timeLeft);

      if (sessionState.timeLeft <= 0) {
        clearInterval(sessionState.timer);
        sessionState.timer = undefined;
        sessionState.timeLeft = 0;
        showResults(io, accessCode);
      }
    }, 1000);
  }

  return true;
}

/**
 * Show results for current question
 */
export async function showResults(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  accessCode: string
): Promise<void> {
  const sessionState = getSessionState(accessCode);
  if (!sessionState) {
    return;
  }

  // Clear timer
  if (sessionState.timer) {
    clearInterval(sessionState.timer);
    sessionState.timer = undefined;
  }

  const currentQuestion =
    sessionState.questions[sessionState.currentQuestionIndex];
  if (!currentQuestion) {
    return;
  }

  // Build leaderboard
  const leaderboard = Array.from(sessionState.participants.values())
    .map((p) => ({
      userId: p.userId,
      score: p.score,
      name: p.name,
    }))
    .sort((a, b) => b.score - a.score);

  // Broadcast results
  io.to(`session:${accessCode}`).emit("results", {
    questionId: currentQuestion.id,
    leaderboard,
  });
}

/**
 * End session
 */
export async function endSession(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  accessCode: string
): Promise<void> {
  const sessionState = getSessionState(accessCode);
  if (!sessionState) {
    return;
  }

  // Clear timer
  if (sessionState.timer) {
    clearInterval(sessionState.timer);
  }

  // Update database
  await query(
    `UPDATE sessions SET is_active = false, ended_at = NOW() WHERE id = $1`,
    [sessionState.sessionId]
  );

  // Broadcast session ended
  io.to(`session:${accessCode}`).emit("sessionEnded");

  // Clean up
  activeSessions.delete(accessCode);
}

/**
 * Handle student leaving session
 */
export function handleLeaveSession(
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  accessCode: string,
  userId: string
): void {
  const sessionState = getSessionState(accessCode);
  if (sessionState) {
    sessionState.participants.delete(userId);
    socket.leave(`session:${accessCode}`);
    console.log(`Student ${userId} left session ${accessCode}`);
  }
}

export { getSessionState };
