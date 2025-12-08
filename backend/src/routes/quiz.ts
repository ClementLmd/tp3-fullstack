/**
 * Quiz management routes for teachers.
 * All routes are protected and require teacher role.
 */

import { Router } from 'express';
import {
  listQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
} from '../controllers/quizController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from 'shared/src/types';

const router = Router();

// All routes require authentication and teacher role
router.use(authenticateToken);
router.use(requireRole([UserRole.TEACHER]));

// GET /api/quizzes - List all quizzes for the authenticated teacher
router.get('/', listQuizzes);

// GET /api/quizzes/:id - Get a specific quiz with questions
router.get('/:id', getQuiz);

// POST /api/quizzes - Create a new quiz with questions
router.post('/', createQuiz);

// PUT /api/quizzes/:id - Update an existing quiz
router.put('/:id', updateQuiz);

// DELETE /api/quizzes/:id - Delete a quiz
router.delete('/:id', deleteQuiz);

export default router;
