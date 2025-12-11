/**
 * Session controller for managing quiz sessions
 * Handles HTTP endpoints for session management
 */

import { Response } from 'express';
import { query } from '../db/connection';
import { AuthRequest } from '../middleware/auth';
import { Session, Question, QuestionType } from 'shared';
import {
  generateAccessCode,
  createActiveSession,
  updateSessionState,
  updateCurrentQuestion,
  removeActiveSession,
  isAccessCodeInUse,
} from '../services/sessionService';

// Configuration constants
const MAX_ACCESS_CODE_ATTEMPTS = 10;

/**
 * POST /api/sessions
 * Create a new session for a quiz
 */
export async function createSession(req: AuthRequest, res: Response) {
  const { quizId } = req.body;

  if (!quizId) {
    return res.status(400).json({ error: 'Quiz ID is required.' });
  }

  try {
    // Verify quiz exists and belongs to the teacher
    const quizResult = await query(
      'SELECT id, title, creator_id FROM quizzes WHERE id = $1 AND creator_id = $2',
      [quizId, req.userId]
    );

    if (!quizResult.rows.length) {
      return res.status(404).json({ error: 'Quiz not found or unauthorized.' });
    }

    // Generate unique access code (check both in-memory and database)
    let accessCode = generateAccessCode();
    let attempts = 0;
    while (attempts < MAX_ACCESS_CODE_ATTEMPTS) {
      // Check in-memory first
      if (isAccessCodeInUse(accessCode)) {
        accessCode = generateAccessCode();
        attempts++;
        continue;
      }
      
      // Check database for active sessions with this code
      const codeCheckResult = await query(
        'SELECT id FROM sessions WHERE access_code = $1 AND is_active = true',
        [accessCode]
      );
      
      if (codeCheckResult.rows.length === 0) {
        // Code is unique, break the loop
        break;
      }
      
      accessCode = generateAccessCode();
      attempts++;
    }

    if (attempts >= MAX_ACCESS_CODE_ATTEMPTS) {
      return res.status(500).json({ error: 'Failed to generate unique access code. Please try again.' });
    }

    // Create session in database
    const sessionResult = await query(
      `INSERT INTO sessions (quiz_id, access_code, is_active, current_question_index)
       VALUES ($1, $2, $3, $4)
       RETURNING id, quiz_id, access_code, is_active, current_question_index, created_at`,
      [quizId, accessCode, false, 0]
    );

    const sessionRow = sessionResult.rows[0];
    const session: Session = {
      id: sessionRow.id,
      quizId: sessionRow.quiz_id,
      accessCode: sessionRow.access_code,
      isActive: sessionRow.is_active,
      currentQuestionIndex: sessionRow.current_question_index,
      createdAt: sessionRow.created_at,
    };

    // Create active session in memory
    createActiveSession(session.id, quizId, accessCode, req.userId!);

    return res.status(201).json(session);
  } catch (err) {
    console.error('Create session error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/sessions/:id
 * Get session details
 */
export async function getSession(req: AuthRequest, res: Response) {
  const sessionId = req.params.id;

  try {
    const sessionResult = await query(
      `SELECT s.id, s.quiz_id, s.access_code, s.is_active, s.current_question_index, 
              s.started_at, s.ended_at, s.created_at, q.title as quiz_title, q.creator_id
       FROM sessions s
       JOIN quizzes q ON s.quiz_id = q.id
       WHERE s.id = $1`,
      [sessionId]
    );

    if (!sessionResult.rows.length) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const row = sessionResult.rows[0];

    // Check if user is the creator
    if (row.creator_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized access to session.' });
    }

    const session: Session & { quizTitle?: string } = {
      id: row.id,
      quizId: row.quiz_id,
      accessCode: row.access_code,
      isActive: row.is_active,
      currentQuestionIndex: row.current_question_index,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      createdAt: row.created_at,
      quizTitle: row.quiz_title,
    };

    return res.status(200).json(session);
  } catch (err) {
    console.error('Get session error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * PATCH /api/sessions/:id/start
 * Start a session (make it active)
 */
export async function startSession(req: AuthRequest, res: Response) {
  const sessionId = req.params.id;

  try {
    // Verify session exists and user is the creator
    const sessionResult = await query(
      `SELECT s.id, s.quiz_id, q.creator_id
       FROM sessions s
       JOIN quizzes q ON s.quiz_id = q.id
       WHERE s.id = $1`,
      [sessionId]
    );

    if (!sessionResult.rows.length) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const row = sessionResult.rows[0];
    if (row.creator_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to start this session.' });
    }

    // Update session to active
    await query(
      `UPDATE sessions 
       SET is_active = true, started_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [sessionId]
    );

    // Update in-memory session
    updateSessionState(sessionId, true);

    return res.status(200).json({ message: 'Session started successfully.' });
  } catch (err) {
    console.error('Start session error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * PATCH /api/sessions/:id/question
 * Broadcast the next question to all connected students
 */
export async function broadcastQuestion(req: AuthRequest, res: Response) {
  const sessionId = req.params.id;
  const { questionIndex } = req.body;

  if (questionIndex === undefined || typeof questionIndex !== 'number') {
    return res.status(400).json({ error: 'Question index is required.' });
  }

  try {
    // Verify session exists and user is the creator
    const sessionResult = await query(
      `SELECT s.id, s.quiz_id, s.is_active, q.creator_id
       FROM sessions s
       JOIN quizzes q ON s.quiz_id = q.id
       WHERE s.id = $1`,
      [sessionId]
    );

    if (!sessionResult.rows.length) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const row = sessionResult.rows[0];
    if (row.creator_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to control this session.' });
    }

    if (!row.is_active) {
      return res.status(400).json({ error: 'Session is not active.' });
    }

    // Get the question
    const questionResult = await query(
      `SELECT id, quiz_id, text, type, options, "order", points, time_limit
       FROM questions
       WHERE quiz_id = $1 AND "order" = $2`,
      [row.quiz_id, questionIndex]
    );

    if (!questionResult.rows.length) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    const qRow = questionResult.rows[0];
    const question: Question = {
      id: qRow.id,
      quizId: qRow.quiz_id,
      text: qRow.text,
      type: qRow.type as QuestionType,
      options: qRow.options,
      order: qRow.order,
      points: qRow.points,
      timeLimit: qRow.time_limit,
      createdAt: '', // Not needed for broadcast
      updatedAt: '', // Not needed for broadcast
    };

    // Update current question index in database and memory
    await query(
      'UPDATE sessions SET current_question_index = $1 WHERE id = $2',
      [questionIndex, sessionId]
    );
    updateCurrentQuestion(sessionId, questionIndex);

    // The actual socket broadcast will be handled by the socket handler
    // This endpoint just updates the state and returns the question data
    return res.status(200).json({ question });
  } catch (err) {
    console.error('Broadcast question error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * DELETE /api/sessions/:id
 * End a session
 */
export async function endSession(req: AuthRequest, res: Response) {
  const sessionId = req.params.id;

  try {
    // Verify session exists and user is the creator
    const sessionResult = await query(
      `SELECT s.id, q.creator_id
       FROM sessions s
       JOIN quizzes q ON s.quiz_id = q.id
       WHERE s.id = $1`,
      [sessionId]
    );

    if (!sessionResult.rows.length) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const row = sessionResult.rows[0];
    if (row.creator_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to end this session.' });
    }

    // Update session in database
    await query(
      `UPDATE sessions 
       SET is_active = false, ended_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [sessionId]
    );

    // Remove from active sessions
    removeActiveSession(sessionId);

    return res.status(200).json({ message: 'Session ended successfully.' });
  } catch (err) {
    console.error('End session error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/sessions/by-code/:code
 * Get session by access code (for students)
 */
export async function getSessionByCode(req: AuthRequest, res: Response) {
  const accessCode = req.params.code.toUpperCase();

  try {
    const sessionResult = await query(
      `SELECT s.id, s.quiz_id, s.access_code, s.is_active, s.current_question_index, 
              s.created_at, q.title as quiz_title
       FROM sessions s
       JOIN quizzes q ON s.quiz_id = q.id
       WHERE s.access_code = $1 AND s.is_active = true`,
      [accessCode]
    );

    if (!sessionResult.rows.length) {
      return res.status(404).json({ error: 'Session not found or not active.' });
    }

    const row = sessionResult.rows[0];
    const session: Session & { quizTitle?: string } = {
      id: row.id,
      quizId: row.quiz_id,
      accessCode: row.access_code,
      isActive: row.is_active,
      currentQuestionIndex: row.current_question_index,
      createdAt: row.created_at,
      quizTitle: row.quiz_title,
    };

    return res.status(200).json(session);
  } catch (err) {
    console.error('Get session by code error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
