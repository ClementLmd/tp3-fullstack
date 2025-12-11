/**
 * Session Controller
 * Handles HTTP endpoints for managing quiz sessions (start, stop, next question)
 */

import { Response } from "express";
import { query } from "../db/connection";
import { AuthRequest } from "../middleware/auth";
import { generateAccessCode } from "../utils/generateAccessCode";
import {
  initializeSession,
  startNextQuestion,
  showResults,
  endSession,
  getSessionState,
} from "../socket/sessionManager";
import { Server } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "shared/src/types";

// We need to pass io instance - will be set in index.ts
let ioInstance: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

export function setIoInstance(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  ioInstance = io;
}

/**
 * POST /api/sessions
 * Start a new quiz session
 */
export async function startSession(req: AuthRequest, res: Response) {
  const { quizId } = req.body;

  if (!quizId) {
    return res.status(400).json({ error: "Quiz ID is required" });
  }

  try {
    // Verify quiz exists and belongs to teacher
    const quizResult = await query(
      `SELECT id FROM quizzes WHERE id = $1 AND creator_id = $2`,
      [quizId, req.userId]
    );

    if (!quizResult.rows.length) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Generate unique access code
    let accessCode: string = "";
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      accessCode = generateAccessCode();
      const existing = await query(
        `SELECT id FROM sessions WHERE access_code = $1 AND is_active = true`,
        [accessCode]
      );
      if (!existing.rows.length) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique || !accessCode) {
      return res.status(500).json({ error: "Failed to generate unique access code" });
    }

    // Create session in database
    const sessionResult = await query(
      `INSERT INTO sessions (quiz_id, access_code, is_active, current_question_index, started_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, quiz_id, access_code, is_active, current_question_index, started_at, created_at`,
      [quizId, accessCode, true, 0, new Date()]
    );

    const session = sessionResult.rows[0];

    // Initialize session state for WebSocket
    if (ioInstance) {
      await initializeSession(session.id, accessCode);
    }

    return res.status(201).json({
      id: session.id,
      quizId: session.quiz_id,
      accessCode: session.access_code,
      isActive: session.is_active,
      currentQuestionIndex: session.current_question_index,
      startedAt: session.started_at,
      createdAt: session.created_at,
    });
  } catch (error) {
    console.error("Start session error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/sessions/:sessionId/next
 * Move to next question
 */
export async function nextQuestion(req: AuthRequest, res: Response) {
  const { sessionId } = req.params;

  try {
    // Verify session exists and belongs to teacher
    const sessionResult = await query(
      `SELECT s.id, s.access_code, s.quiz_id, q.creator_id
       FROM sessions s
       INNER JOIN quizzes q ON s.quiz_id = q.id
       WHERE s.id = $1 AND q.creator_id = $2 AND s.is_active = true`,
      [sessionId, req.userId]
    );

    if (!sessionResult.rows.length) {
      return res.status(404).json({ error: "Session not found or not active" });
    }

    const session = sessionResult.rows[0];

    if (!ioInstance) {
      return res.status(500).json({ error: "WebSocket server not available" });
    }

    // Start next question
    const hasMore = await startNextQuestion(ioInstance, session.access_code);

    return res.status(200).json({
      success: true,
      hasMoreQuestions: hasMore,
    });
  } catch (error) {
    console.error("Next question error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/sessions/:sessionId/results
 * Show results for current question
 */
export async function showQuestionResults(req: AuthRequest, res: Response) {
  const { sessionId } = req.params;

  try {
    // Verify session exists and belongs to teacher
    const sessionResult = await query(
      `SELECT s.id, s.access_code, s.quiz_id, q.creator_id
       FROM sessions s
       INNER JOIN quizzes q ON s.quiz_id = q.id
       WHERE s.id = $1 AND q.creator_id = $2 AND s.is_active = true`,
      [sessionId, req.userId]
    );

    if (!sessionResult.rows.length) {
      return res.status(404).json({ error: "Session not found or not active" });
    }

    const session = sessionResult.rows[0];

    if (!ioInstance) {
      return res.status(500).json({ error: "WebSocket server not available" });
    }

    await showResults(ioInstance, session.access_code);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Show results error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/sessions/:sessionId/end
 * End the session
 */
export async function stopSession(req: AuthRequest, res: Response) {
  const { sessionId } = req.params;

  try {
    // Verify session exists and belongs to teacher
    const sessionResult = await query(
      `SELECT s.id, s.access_code, s.quiz_id, q.creator_id
       FROM sessions s
       INNER JOIN quizzes q ON s.quiz_id = q.id
       WHERE s.id = $1 AND q.creator_id = $2`,
      [sessionId, req.userId]
    );

    if (!sessionResult.rows.length) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = sessionResult.rows[0];

    if (!ioInstance) {
      return res.status(500).json({ error: "WebSocket server not available" });
    }

    await endSession(ioInstance, session.access_code);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Stop session error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/sessions/:sessionId
 * Get session details
 */
export async function getSession(req: AuthRequest, res: Response) {
  const { sessionId } = req.params;

  try {
    const sessionResult = await query(
      `SELECT s.id, s.quiz_id, s.access_code, s.is_active, s.current_question_index, 
              s.started_at, s.ended_at, s.created_at,
              q.title as quiz_title
       FROM sessions s
       INNER JOIN quizzes q ON s.quiz_id = q.id
       WHERE s.id = $1 AND q.creator_id = $2`,
      [sessionId, req.userId]
    );

    if (!sessionResult.rows.length) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = sessionResult.rows[0];
    const sessionState = getSessionState(session.access_code);

    return res.status(200).json({
      id: session.id,
      quizId: session.quiz_id,
      quizTitle: session.quiz_title,
      accessCode: session.access_code,
      isActive: session.is_active,
      currentQuestionIndex: session.current_question_index,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      createdAt: session.created_at,
      participantCount: sessionState?.participants.size || 0,
    });
  } catch (error) {
    console.error("Get session error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

