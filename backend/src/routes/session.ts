/**
 * Session routes for managing quiz sessions
 * Requires authentication and teacher role
 */

import { Router } from "express";
import {
  startSession,
  nextQuestion,
  showQuestionResults,
  stopSession,
  getSession,
} from "../controllers/sessionController";
import { authenticateToken, requireRole } from "../middleware/auth";
import { UserRole } from "shared/src/types/auth";

const router = Router();

// All routes require authentication and teacher role
router.use(authenticateToken);
router.use(requireRole([UserRole.TEACHER]));

// POST /api/sessions - Start a new session
router.post("/", startSession);

// GET /api/sessions/:sessionId - Get session details
router.get("/:sessionId", getSession);

// POST /api/sessions/:sessionId/next - Move to next question
router.post("/:sessionId/next", nextQuestion);

// POST /api/sessions/:sessionId/results - Show results for current question
router.post("/:sessionId/results", showQuestionResults);

// POST /api/sessions/:sessionId/end - End the session
router.post("/:sessionId/end", stopSession);

export default router;

