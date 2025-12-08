import { Response } from 'express';
import { query, getClient } from '../db/connection';
import { AuthRequest } from '../middleware/auth';
import { Quiz, Question, QuestionType } from 'shared/src/types';

/**
 * GET /api/quizzes
 * List all quizzes created by the authenticated teacher
 */
export async function listQuizzes(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      `SELECT id, title, description, creator_id, created_at, updated_at 
       FROM quizzes 
       WHERE creator_id = $1 
       ORDER BY created_at DESC`,
      [req.userId]
    );

    const quizzes: Quiz[] = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      creatorId: row.creator_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.status(200).json(quizzes);
  } catch (err) {
    console.error('List quizzes error', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/quizzes/:id
 * Get a specific quiz with all its questions
 */
export async function getQuiz(req: AuthRequest, res: Response) {
  const quizId = req.params.id;

  try {
    // Get quiz
    const quizResult = await query(
      `SELECT id, title, description, creator_id, created_at, updated_at 
       FROM quizzes 
       WHERE id = $1 AND creator_id = $2`,
      [quizId, req.userId]
    );

    if (!quizResult.rows.length) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }

    // Get questions
    const questionsResult = await query(
      `SELECT id, quiz_id, text, type, options, correct_answer, "order", points, time_limit, created_at, updated_at 
       FROM questions 
       WHERE quiz_id = $1 
       ORDER BY "order" ASC`,
      [quizId]
    );

    const row = quizResult.rows[0];
    const quiz: Quiz = {
      id: row.id,
      title: row.title,
      description: row.description,
      creatorId: row.creator_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      questions: questionsResult.rows.map(q => ({
        id: q.id,
        quizId: q.quiz_id,
        text: q.text,
        type: q.type as QuestionType,
        options: q.options,
        correctAnswer: q.correct_answer,
        order: q.order,
        points: q.points,
        timeLimit: q.time_limit,
        createdAt: q.created_at,
        updatedAt: q.updated_at,
      })),
    };

    return res.status(200).json(quiz);
  } catch (err) {
    console.error('Get quiz error', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /api/quizzes
 * Create a new quiz with questions
 */
export async function createQuiz(req: AuthRequest, res: Response) {
  const { title, description, questions } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'At least one question is required.' });
  }

  // Validate questions
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    
    if (!q.text || !q.text.trim()) {
      return res.status(400).json({ error: `Question ${i + 1}: text is required.` });
    }

    if (!q.type || !Object.values(QuestionType).includes(q.type)) {
      return res.status(400).json({ error: `Question ${i + 1}: invalid type.` });
    }

    // Validate based on question type
    if (q.type === QuestionType.MULTIPLE_CHOICE) {
      if (!q.options || !q.options.choices || !Array.isArray(q.options.choices) || q.options.choices.length < 2) {
        return res.status(400).json({ error: `Question ${i + 1}: Multiple choice requires at least 2 choices.` });
      }
      if (typeof q.options.correctAnswer !== 'number' || q.options.correctAnswer < 0 || q.options.correctAnswer >= q.options.choices.length) {
        return res.status(400).json({ error: `Question ${i + 1}: Invalid correct answer index.` });
      }
    }

    if (q.type === QuestionType.TRUE_FALSE) {
      if (!q.correctAnswer || !['true', 'false'].includes(q.correctAnswer.toLowerCase())) {
        return res.status(400).json({ error: `Question ${i + 1}: True/False requires correctAnswer to be 'true' or 'false'.` });
      }
    }

    if (q.type === QuestionType.TEXT) {
      if (!q.correctAnswer || !q.correctAnswer.trim()) {
        return res.status(400).json({ error: `Question ${i + 1}: Text question requires a correct answer.` });
      }
    }

    // Validate points
    if (q.points !== undefined && (typeof q.points !== 'number' || q.points < 0)) {
      return res.status(400).json({ error: `Question ${i + 1}: Points must be a positive number.` });
    }

    // Validate time limit
    if (q.timeLimit !== undefined && (typeof q.timeLimit !== 'number' || q.timeLimit < 0)) {
      return res.status(400).json({ error: `Question ${i + 1}: Time limit must be a positive number.` });
    }
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Insert quiz
    const quizResult = await client.query(
      `INSERT INTO quizzes (title, description, creator_id)
       VALUES ($1, $2, $3)
       RETURNING id, title, description, creator_id, created_at, updated_at`,
      [title, description || null, req.userId]
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
          q.type === QuestionType.MULTIPLE_CHOICE ? JSON.stringify(q.options) : null,
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

    return res.status(201).json(quiz);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create quiz error', err);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
}

/**
 * PUT /api/quizzes/:id
 * Update an existing quiz and its questions
 */
export async function updateQuiz(req: AuthRequest, res: Response) {
  const quizId = req.params.id;
  const { title, description, questions } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'At least one question is required.' });
  }

  // Validate questions (same validation as create)
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    
    if (!q.text || !q.text.trim()) {
      return res.status(400).json({ error: `Question ${i + 1}: text is required.` });
    }

    if (!q.type || !Object.values(QuestionType).includes(q.type)) {
      return res.status(400).json({ error: `Question ${i + 1}: invalid type.` });
    }

    if (q.type === QuestionType.MULTIPLE_CHOICE) {
      if (!q.options || !q.options.choices || !Array.isArray(q.options.choices) || q.options.choices.length < 2) {
        return res.status(400).json({ error: `Question ${i + 1}: Multiple choice requires at least 2 choices.` });
      }
      if (typeof q.options.correctAnswer !== 'number' || q.options.correctAnswer < 0 || q.options.correctAnswer >= q.options.choices.length) {
        return res.status(400).json({ error: `Question ${i + 1}: Invalid correct answer index.` });
      }
    }

    if (q.type === QuestionType.TRUE_FALSE) {
      if (!q.correctAnswer || !['true', 'false'].includes(q.correctAnswer.toLowerCase())) {
        return res.status(400).json({ error: `Question ${i + 1}: True/False requires correctAnswer to be 'true' or 'false'.` });
      }
    }

    if (q.type === QuestionType.TEXT) {
      if (!q.correctAnswer || !q.correctAnswer.trim()) {
        return res.status(400).json({ error: `Question ${i + 1}: Text question requires a correct answer.` });
      }
    }

    if (q.points !== undefined && (typeof q.points !== 'number' || q.points < 0)) {
      return res.status(400).json({ error: `Question ${i + 1}: Points must be a positive number.` });
    }

    if (q.timeLimit !== undefined && (typeof q.timeLimit !== 'number' || q.timeLimit < 0)) {
      return res.status(400).json({ error: `Question ${i + 1}: Time limit must be a positive number.` });
    }
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Check if quiz exists and belongs to user
    const checkResult = await client.query(
      `SELECT id FROM quizzes WHERE id = $1 AND creator_id = $2`,
      [quizId, req.userId]
    );

    if (!checkResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Quiz not found.' });
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
          q.type === QuestionType.MULTIPLE_CHOICE ? JSON.stringify(q.options) : null,
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

    return res.status(200).json(quiz);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update quiz error', err);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
}

/**
 * DELETE /api/quizzes/:id
 * Delete a quiz and all its questions
 */
export async function deleteQuiz(req: AuthRequest, res: Response) {
  const quizId = req.params.id;

  try {
    // Check if quiz exists and belongs to user, then delete
    const result = await query(
      `DELETE FROM quizzes 
       WHERE id = $1 AND creator_id = $2 
       RETURNING id`,
      [quizId, req.userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }

    return res.status(200).json({ message: 'Quiz deleted successfully.' });
  } catch (err) {
    console.error('Delete quiz error', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
