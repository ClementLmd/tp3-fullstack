/**
 * Socket.io event handlers for quiz management
 * Allows teachers to create, update, and delete quizzes in real-time
 */

import { Server, Socket } from 'socket.io';
import { query, getClient } from '../db/connection';
import { Quiz, Question, QuestionType, CreateQuizRequest, ServerToClientEvents, ClientToServerEvents } from 'shared/src/types';

// Extended socket type with user info
interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: string;
}

/**
 * Validate questions array
 * Returns error message if validation fails, null if valid
 */
function validateQuestions(questions: unknown[]): string | null {
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return 'At least one question is required.';
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i] as Record<string, unknown>;
    
    if (!q.text || typeof q.text !== 'string' || !q.text.trim()) {
      return `Question ${i + 1}: text is required.`;
    }

    if (!q.type || !Object.values(QuestionType).includes(q.type as QuestionType)) {
      return `Question ${i + 1}: invalid type.`;
    }

    // Validate based on question type
    if (q.type === QuestionType.MULTIPLE_CHOICE) {
      const options = q.options as Record<string, unknown> | undefined;
      if (!options || !options.choices || !Array.isArray(options.choices) || options.choices.length < 2) {
        return `Question ${i + 1}: Multiple choice requires at least 2 choices.`;
      }
      if (typeof options.correctAnswer !== 'number' || options.correctAnswer < 0 || options.correctAnswer >= options.choices.length) {
        return `Question ${i + 1}: Invalid correct answer index.`;
      }
    }

    if (q.type === QuestionType.TRUE_FALSE) {
      if (!q.correctAnswer || typeof q.correctAnswer !== 'string' || !['true', 'false'].includes(q.correctAnswer.toLowerCase())) {
        return `Question ${i + 1}: True/False requires correctAnswer to be 'true' or 'false'.`;
      }
    }

    if (q.type === QuestionType.TEXT) {
      if (!q.correctAnswer || typeof q.correctAnswer !== 'string' || !q.correctAnswer.trim()) {
        return `Question ${i + 1}: Text question requires a correct answer.`;
      }
    }

    // Validate points
    if (q.points !== undefined && (typeof q.points !== 'number' || q.points < 0)) {
      return `Question ${i + 1}: Points must be a positive number.`;
    }

    // Validate time limit
    if (q.timeLimit !== undefined && (typeof q.timeLimit !== 'number' || q.timeLimit < 0)) {
      return `Question ${i + 1}: Time limit must be a positive number.`;
    }
  }
  
  return null;
}

/**
 * Prepare question options for database storage
 * Returns JSON string for MULTIPLE_CHOICE, null otherwise
 */
function prepareQuestionOptions(question: Record<string, unknown>): string | null {
  return question.type === QuestionType.MULTIPLE_CHOICE 
    ? JSON.stringify(question.options) 
    : null;
}

/**
 * Register quiz management socket handlers
 */
export function registerQuizHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>, socket: Socket) {
  const authSocket = socket as AuthenticatedSocket;
  /**
   * Create a new quiz with questions
   */
  socket.on('createQuiz', async (data: CreateQuizRequest, callback) => {
    try {
      // Get user info from socket
      const userId = authSocket.userId;
      const userRole = authSocket.userRole;

      if (!userId || userRole !== 'TEACHER') {
        return callback({
          success: false,
          error: 'Unauthorized. Only teachers can create quizzes.',
        });
      }

      const { title, description, questions } = data;

      if (!title || !title.trim()) {
        return callback({
          success: false,
          error: 'Title is required.',
        });
      }

      // Validate questions
      const validationError = validateQuestions(questions);
      if (validationError) {
        return callback({
          success: false,
          error: validationError,
        });
      }

      const client = await getClient();

      try {
        await client.query('BEGIN');

        // Insert quiz
        const quizResult = await client.query(
          `INSERT INTO quizzes (title, description, creator_id)
           VALUES ($1, $2, $3)
           RETURNING id, title, description, creator_id, created_at, updated_at`,
          [title, description || null, userId]
        );

        const quizRow = quizResult.rows[0];
        const quizId = quizRow.id;

        // Insert questions
        const insertedQuestions: Question[] = [];
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const order = q.order !== undefined ? q.order : i;
          const points = q.points !== undefined ? q.points : 1;

          const questionResult = await client.query(
            `INSERT INTO questions (quiz_id, text, type, options, correct_answer, "order", points, time_limit)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, quiz_id, text, type, options, correct_answer, "order", points, time_limit, created_at, updated_at`,
            [
              quizId,
              q.text,
              q.type,
              prepareQuestionOptions(q),
              q.correctAnswer || null,
              order,
              points,
              q.timeLimit || null,
            ]
          );

          const qRow = questionResult.rows[0];
          insertedQuestions.push({
            id: qRow.id,
            quizId: qRow.quiz_id,
            text: qRow.text,
            type: qRow.type as QuestionType,
            options: qRow.options,
            correctAnswer: qRow.correct_answer,
            order: qRow.order,
            points: qRow.points,
            timeLimit: qRow.time_limit,
            createdAt: qRow.created_at,
            updatedAt: qRow.updated_at,
          });
        }

        await client.query('COMMIT');

        const quiz: Quiz = {
          id: quizRow.id,
          title: quizRow.title,
          description: quizRow.description,
          creatorId: quizRow.creator_id,
          createdAt: quizRow.created_at,
          updatedAt: quizRow.updated_at,
          questions: insertedQuestions,
        };

        // Emit to all connected teachers (broadcast)
        io.emit('quizCreated', quiz);

        callback({
          success: true,
          quiz,
        });
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create quiz error:', err);
        callback({
          success: false,
          error: 'Failed to create quiz.',
        });
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('Create quiz socket error:', err);
      callback({
        success: false,
        error: 'Internal server error.',
      });
    }
  });

  /**
   * Update an existing quiz
   */
  socket.on('updateQuiz', async (data: { quizId: string } & CreateQuizRequest, callback) => {
    try {
      // Get user info from socket
      const userId = authSocket.userId;
      const userRole = authSocket.userRole;

      if (!userId || userRole !== 'TEACHER') {
        return callback({
          success: false,
          error: 'Unauthorized. Only teachers can update quizzes.',
        });
      }

      const { quizId, title, description, questions } = data;

      if (!quizId) {
        return callback({
          success: false,
          error: 'Quiz ID is required.',
        });
      }

      if (!title || !title.trim()) {
        return callback({
          success: false,
          error: 'Title is required.',
        });
      }

      // Validate questions
      const validationError = validateQuestions(questions);
      if (validationError) {
        return callback({
          success: false,
          error: validationError,
        });
      }

      const client = await getClient();

      try {
        await client.query('BEGIN');

        // Check if quiz exists and belongs to user
        const checkResult = await client.query(
          `SELECT id FROM quizzes WHERE id = $1 AND creator_id = $2`,
          [quizId, userId]
        );

        if (!checkResult.rows.length) {
          await client.query('ROLLBACK');
          return callback({
            success: false,
            error: 'Quiz not found or you do not have permission to update it.',
          });
        }

        // Update quiz
        const quizResult = await client.query(
          `UPDATE quizzes 
           SET title = $1, description = $2
           WHERE id = $3
           RETURNING id, title, description, creator_id, created_at, updated_at`,
          [title, description || null, quizId]
        );

        const quizRow = quizResult.rows[0];

        // Delete existing questions
        await client.query(`DELETE FROM questions WHERE quiz_id = $1`, [quizId]);

        // Insert new questions
        const insertedQuestions: Question[] = [];
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const order = q.order !== undefined ? q.order : i;
          const points = q.points !== undefined ? q.points : 1;

          const questionResult = await client.query(
            `INSERT INTO questions (quiz_id, text, type, options, correct_answer, "order", points, time_limit)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, quiz_id, text, type, options, correct_answer, "order", points, time_limit, created_at, updated_at`,
            [
              quizId,
              q.text,
              q.type,
              prepareQuestionOptions(q),
              q.correctAnswer || null,
              order,
              points,
              q.timeLimit || null,
            ]
          );

          const qRow = questionResult.rows[0];
          insertedQuestions.push({
            id: qRow.id,
            quizId: qRow.quiz_id,
            text: qRow.text,
            type: qRow.type as QuestionType,
            options: qRow.options,
            correctAnswer: qRow.correct_answer,
            order: qRow.order,
            points: qRow.points,
            timeLimit: qRow.time_limit,
            createdAt: qRow.created_at,
            updatedAt: qRow.updated_at,
          });
        }

        await client.query('COMMIT');

        const quiz: Quiz = {
          id: quizRow.id,
          title: quizRow.title,
          description: quizRow.description,
          creatorId: quizRow.creator_id,
          createdAt: quizRow.created_at,
          updatedAt: quizRow.updated_at,
          questions: insertedQuestions,
        };

        // Emit to all connected teachers (broadcast)
        io.emit('quizUpdated', quiz);

        callback({
          success: true,
          quiz,
        });
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update quiz error:', err);
        callback({
          success: false,
          error: 'Failed to update quiz.',
        });
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('Update quiz socket error:', err);
      callback({
        success: false,
        error: 'Internal server error.',
      });
    }
  });

  /**
   * Delete a quiz
   */
  socket.on('deleteQuiz', async (data: { quizId: string }, callback) => {
    try {
      // Get user info from socket
      const userId = authSocket.userId;
      const userRole = authSocket.userRole;

      if (!userId || userRole !== 'TEACHER') {
        return callback({
          success: false,
          error: 'Unauthorized. Only teachers can delete quizzes.',
        });
      }

      const { quizId } = data;

      if (!quizId) {
        return callback({
          success: false,
          error: 'Quiz ID is required.',
        });
      }

      // Check if quiz exists and belongs to user, then delete
      const result = await query(
        `DELETE FROM quizzes 
         WHERE id = $1 AND creator_id = $2 
         RETURNING id`,
        [quizId, userId]
      );

      if (!result.rows.length) {
        return callback({
          success: false,
          error: 'Quiz not found or you do not have permission to delete it.',
        });
      }

      // Emit to all connected teachers (broadcast)
      io.emit('quizDeleted', quizId);

      callback({
        success: true,
      });
    } catch (err) {
      console.error('Delete quiz socket error:', err);
      callback({
        success: false,
        error: 'Internal server error.',
      });
    }
  });
}
