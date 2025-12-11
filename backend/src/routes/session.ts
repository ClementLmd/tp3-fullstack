/**
 * Session management routes for teachers
 * All routes require authentication and teacher role
 */

import { Router } from 'express';
import {
  createSession,
  getSession,
  startSession,
  broadcastQuestion,
  endSession,
  getSessionByCode,
} from '../controllers/sessionController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from 'shared/src/types/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/sessions - Create a new session (teacher only)
router.post('/', requireRole([UserRole.TEACHER]), createSession);

// GET /api/sessions/:id - Get session details (teacher only)
router.get('/:id', requireRole([UserRole.TEACHER]), getSession);

// PATCH /api/sessions/:id/start - Start a session (teacher only)
router.patch('/:id/start', requireRole([UserRole.TEACHER]), startSession);

// PATCH /api/sessions/:id/question - Broadcast next question (teacher only)
router.patch('/:id/question', requireRole([UserRole.TEACHER]), broadcastQuestion);

// DELETE /api/sessions/:id - End a session (teacher only)
router.delete('/:id', requireRole([UserRole.TEACHER]), endSession);

// GET /api/sessions/by-code/:code - Get session by access code (students can use this)
router.get('/by-code/:code', getSessionByCode);

export default router;
