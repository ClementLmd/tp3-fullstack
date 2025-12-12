/**
 * Dashboard routes for role-based statistics and data
 * GET endpoints with authentication and role-based filtering
 */

import { Router } from "express";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { Response } from "express";
import { query } from "../db/connection";
import { UserRole } from "shared/src/types/auth";

const router = Router();

// Apply authentication middleware to all dashboard routes
router.use(authenticateToken);

/**
 * GET /dashboard/stats
 * Returns role-specific statistics
 * - Teachers: number of quizzes created, total sessions, average participants
 * - Students: quizzes participated in, average score, total points
 */
router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    if (userRole === UserRole.TEACHER) {
      // Teacher statistics
      const statsResult = await query(
        `SELECT 
          COUNT(DISTINCT q.id) as total_quizzes,
          COUNT(DISTINCT s.id) as total_sessions,
          COALESCE(AVG(session_participants.participant_count), 0) as avg_participants,
          COALESCE(SUM(session_participants.participant_count), 0) as total_participants
         FROM quizzes q
         LEFT JOIN sessions s ON q.id = s.quiz_id
         LEFT JOIN (
           SELECT session_id, COUNT(id) as participant_count
           FROM participations
           GROUP BY session_id
         ) session_participants ON s.id = session_participants.session_id
         WHERE q.creator_id = $1`,
        [userId]
      );

      const stats = statsResult.rows[0];
      return res.json({
        role: "TEACHER",
        totalQuizzes: parseInt(stats.total_quizzes) || 0,
        totalSessions: parseInt(stats.total_sessions) || 0,
        avgParticipants: parseFloat(stats.avg_participants) || 0,
        totalParticipants: parseInt(stats.total_participants) || 0,
      });
    } else {
      // Student statistics
      const statsResult = await query(
        `SELECT 
          COUNT(DISTINCT p.session_id) as total_participated,
          COALESCE(AVG(p.score), 0) as avg_score,
          COALESCE(SUM(p.score), 0) as total_score,
          MAX(p.score) as highest_score
         FROM participations p
         WHERE p.user_id = $1`,
        [userId]
      );

      const stats = statsResult.rows[0];
      return res.json({
        role: "STUDENT",
        totalParticipated: parseInt(stats.total_participated) || 0,
        avgScore: parseFloat(stats.avg_score) || 0,
        totalScore: parseInt(stats.total_score) || 0,
        highestScore: parseInt(stats.highest_score) || 0,
      });
    }
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

/**
 * GET /dashboard/quizzes
 * - Teachers: get all quizzes they created
 * - Students: get quizzes they participated in
 */
router.get("/quizzes", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    if (userRole === UserRole.TEACHER) {
      // Teacher's own quizzes
      const quizzesResult = await query(
        `SELECT 
          q.id,
          q.title,
          q.description,
          q.created_at,
          COUNT(DISTINCT s.id) as session_count,
          COUNT(DISTINCT p.id) as total_participants,
          COALESCE(AVG(p.score), 0) as avg_score,
          COALESCE((
            SELECT SUM(points) 
            FROM questions 
            WHERE quiz_id = q.id
          ), 0) as max_score,
          COALESCE((
            SELECT COUNT(*) 
            FROM questions 
            WHERE quiz_id = q.id
          ), 0) as question_count
         FROM quizzes q
         LEFT JOIN sessions s ON q.id = s.quiz_id
         LEFT JOIN participations p ON s.id = p.session_id
         WHERE q.creator_id = $1
         GROUP BY q.id, q.title, q.description, q.created_at
         ORDER BY q.created_at DESC`,
        [userId]
      );

      return res.json(
        quizzesResult.rows.map((q) => ({
          id: q.id,
          title: q.title,
          description: q.description,
          createdAt: q.created_at,
          sessionCount: parseInt(q.session_count),
          totalParticipants: parseInt(q.total_participants),
          avgScore: parseFloat(q.avg_score) || 0,
          maxScore: parseInt(q.max_score) || 0,
          questionCount: parseInt(q.question_count) || 0,
        }))
      );
    } else {
      // Student's participated quizzes
      const quizzesResult = await query(
        `SELECT DISTINCT
          q.id,
          q.title,
          q.description,
          q.created_at,
          COALESCE(MAX(p.score), 0) as best_score,
          COALESCE((
            SELECT SUM(points) 
            FROM questions 
            WHERE quiz_id = q.id
          ), 0) as max_score
         FROM quizzes q
         INNER JOIN sessions s ON q.id = s.quiz_id
         INNER JOIN participations p ON s.id = p.session_id
         WHERE p.user_id = $1
         GROUP BY q.id, q.title, q.description, q.created_at
         ORDER BY q.created_at DESC`,
        [userId]
      );

      return res.json(
        quizzesResult.rows.map((q) => ({
          id: q.id,
          title: q.title,
          description: q.description,
          createdAt: q.created_at,
          bestScore: parseInt(q.best_score),
          maxScore: parseInt(q.max_score) || 0,
        }))
      );
    }
  } catch (error) {
    console.error("Dashboard quizzes error:", error);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
});

/**
 * GET /dashboard/sessions
 * - Teachers: get all sessions for their quizzes with statistics
 * - Students: get sessions they participated in
 */
router.get("/sessions", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    if (userRole === UserRole.TEACHER) {
      // Teacher's quiz sessions
      const sessionsResult = await query(
        `SELECT 
          s.id,
          s.quiz_id,
          q.title,
          s.access_code,
          s.is_active,
          s.started_at,
          s.ended_at,
          COUNT(DISTINCT p.id) as participant_count,
          COALESCE(AVG(p.score), 0) as avg_score
         FROM sessions s
         INNER JOIN quizzes q ON s.quiz_id = q.id
         LEFT JOIN participations p ON s.id = p.session_id
         WHERE q.creator_id = $1
         GROUP BY s.id, s.quiz_id, q.title, s.access_code, s.is_active, s.started_at, s.ended_at
         ORDER BY s.started_at DESC`,
        [userId]
      );

      return res.json(
        sessionsResult.rows.map((s) => ({
          id: s.id,
          quizId: s.quiz_id,
          quizTitle: s.title,
          accessCode: s.access_code,
          isActive: s.is_active,
          startedAt: s.started_at,
          endedAt: s.ended_at,
          participantCount: parseInt(s.participant_count),
          avgScore: parseFloat(s.avg_score),
        }))
      );
    } else {
      // Student's participated sessions
      const sessionsResult = await query(
        `SELECT 
          s.id,
          s.quiz_id,
          q.title,
          s.access_code,
          s.is_active,
          s.started_at,
          s.ended_at,
          p.score,
          p.completed_at
         FROM sessions s
         INNER JOIN quizzes q ON s.quiz_id = q.id
         INNER JOIN participations p ON s.id = p.session_id
         WHERE p.user_id = $1
         ORDER BY s.started_at DESC`,
        [userId]
      );

      return res.json(
        sessionsResult.rows.map((s) => ({
          id: s.id,
          quizId: s.quiz_id,
          quizTitle: s.title,
          accessCode: s.access_code,
          isActive: s.is_active,
          startedAt: s.started_at,
          endedAt: s.ended_at,
          score: parseInt(s.score),
          completedAt: s.completed_at,
        }))
      );
    }
  } catch (error) {
    console.error("Dashboard sessions error:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

/**
 * GET /dashboard/quiz/:quizId/details
 * - Teachers: get detailed stats for their quiz (with top performers, etc.)
 * - Students: cannot access other users' data
 */
router.get("/quiz/:quizId/details", async (req: AuthRequest, res: Response) => {
  try {
    const { quizId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    // Verify ownership for teachers
    if (userRole === UserRole.TEACHER) {
      const ownerCheckResult = await query(
        `SELECT id FROM quizzes WHERE id = $1 AND creator_id = $2`,
        [quizId, userId]
      );

      if (ownerCheckResult.rows.length === 0) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this quiz" });
      }

      // Get quiz details with performance stats
      const detailsResult = await query(
        `SELECT 
          q.id,
          q.title,
          q.description,
          COUNT(DISTINCT s.id) as total_sessions,
          COUNT(DISTINCT p.id) as total_participants,
          COALESCE(AVG(p.score), 0) as avg_score,
          MAX(p.score) as highest_score,
          MIN(p.score) as lowest_score
         FROM quizzes q
         LEFT JOIN sessions s ON q.id = s.quiz_id
         LEFT JOIN participations p ON s.id = p.session_id
         WHERE q.id = $1
         GROUP BY q.id, q.title, q.description`,
        [quizId]
      );

      if (detailsResult.rows.length === 0) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const quiz = detailsResult.rows[0];

      // Get top performers
      const topPerformersResult = await query(
        `SELECT 
          u.id,
          u.first_name,
          u.last_name,
          p.score,
          COUNT(DISTINCT a.id) as correct_answers
         FROM participations p
         INNER JOIN sessions s ON p.session_id = s.id
         INNER JOIN users u ON p.user_id = u.id
         LEFT JOIN answers a ON p.id = a.participation_id AND a.is_correct = true
         WHERE s.quiz_id = $1
         GROUP BY u.id, u.first_name, u.last_name, p.score
         ORDER BY p.score DESC
         LIMIT 5`,
        [quizId]
      );

      return res.json({
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          totalSessions: parseInt(quiz.total_sessions),
          totalParticipants: parseInt(quiz.total_participants),
          avgScore: parseFloat(quiz.avg_score),
          highestScore: parseInt(quiz.highest_score),
          lowestScore: parseInt(quiz.lowest_score),
        },
        topPerformers: topPerformersResult.rows.map((t) => ({
          userId: t.id,
          name: `${t.first_name} ${t.last_name}`,
          score: parseInt(t.score),
          correctAnswers: parseInt(t.correct_answers),
        })),
      });
    } else {
      return res
        .status(403)
        .json({ error: "Students cannot access this endpoint" });
    }
  } catch (error) {
    console.error("Quiz details error:", error);
    res.status(500).json({ error: "Failed to fetch quiz details" });
  }
});

/**
 * GET /dashboard/sessions/:sessionId/results
 * - Teachers: get detailed results for a session (participants, scores, etc.)
 * - Students: cannot access other users' data
 */
router.get(
  "/sessions/:sessionId/results",
  async (req: AuthRequest, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = req.userId;
      const userRole = req.userRole;

      if (userRole === UserRole.TEACHER) {
        // Verify session belongs to teacher
        const sessionCheckResult = await query(
          `SELECT s.id, s.quiz_id, s.access_code, s.is_active, s.started_at, s.ended_at,
                q.title as quiz_title
         FROM sessions s
         INNER JOIN quizzes q ON s.quiz_id = q.id
         WHERE s.id = $1 AND q.creator_id = $2`,
          [sessionId, userId]
        );

        if (sessionCheckResult.rows.length === 0) {
          return res.status(404).json({ error: "Session not found" });
        }

        const session = sessionCheckResult.rows[0];

        // Get participants with their scores
        const participantsResult = await query(
          `SELECT 
          p.id as participation_id,
          p.user_id,
          p.score,
          p.joined_at,
          p.completed_at,
          u.first_name,
          u.last_name,
          u.email,
          COALESCE((
            SELECT COUNT(*) 
            FROM answers a 
            WHERE a.participation_id = p.id AND a.is_correct IS TRUE
          ), 0)::integer as correct_answers,
          COALESCE((
            SELECT COUNT(*) 
            FROM questions q
            WHERE q.quiz_id = $2
          ), 0)::integer as total_answers
         FROM participations p
         INNER JOIN users u ON p.user_id = u.id
         WHERE p.session_id = $1
         ORDER BY p.score DESC, u.last_name ASC, u.first_name ASC`,
          [sessionId, session.quiz_id]
        );

        return res.json({
          session: {
            id: session.id,
            quizId: session.quiz_id,
            quizTitle: session.quiz_title,
            accessCode: session.access_code,
            isActive: session.is_active,
            startedAt: session.started_at,
            endedAt: session.ended_at,
          },
          participants: participantsResult.rows.map((p) => ({
            participationId: p.participation_id,
            userId: p.user_id,
            name: `${p.first_name} ${p.last_name}`,
            email: p.email,
            score: parseInt(p.score),
            correctAnswers: parseInt(p.correct_answers) || 0,
            totalAnswers: parseInt(p.total_answers) || 0,
            joinedAt: p.joined_at,
            completedAt: p.completed_at,
          })),
        });
      } else {
        // Student's own session summary
        // Verify student participated in this session
        const participationCheckResult = await query(
          `SELECT p.id as participation_id, p.score, s.quiz_id
           FROM participations p
           INNER JOIN sessions s ON p.session_id = s.id
           WHERE p.session_id = $1 AND p.user_id = $2`,
          [sessionId, userId]
        );

        if (participationCheckResult.rows.length === 0) {
          return res
            .status(404)
            .json({ error: "Session not found or you did not participate" });
        }

        const participation = participationCheckResult.rows[0];
        const quizId = participation.quiz_id;

        // Get all questions from the quiz
        const questionsResult = await query(
          `SELECT id, text, type, options, correct_answer, points
           FROM questions
           WHERE quiz_id = $1
           ORDER BY "order" ASC`,
          [quizId]
        );

        // Get student's answers
        const answersResult = await query(
          `SELECT question_id, answer, is_correct, points
           FROM answers
           WHERE participation_id = $1`,
          [participation.participation_id]
        );

        // Create a map of answers by question_id
        const answersMap = new Map(
          answersResult.rows.map((a) => [
            a.question_id,
            {
              answer: a.answer,
              isCorrect: a.is_correct,
              points: parseInt(a.points) || 0,
            },
          ])
        );

        // Build summary
        const summary = {
          questions: questionsResult.rows.map((question) => {
            const answerInfo = answersMap.get(question.id);
            let correctAnswerText = "";

            if (question.type === "MULTIPLE_CHOICE") {
              const options = question.options as {
                choices: string[];
                correctAnswer: number;
              };
              correctAnswerText = options.choices[options.correctAnswer];
            } else {
              correctAnswerText = question.correct_answer || "";
            }

            return {
              questionId: question.id,
              questionText: question.text,
              correctAnswer: correctAnswerText,
              studentAnswer: answerInfo?.answer,
              isCorrect: answerInfo?.isCorrect,
              points: answerInfo?.points || 0,
            };
          }),
          finalScore: parseInt(participation.score) || 0,
        };

        return res.json(summary);
      }
    } catch (error) {
      console.error("Session results error:", error);
      res.status(500).json({ error: "Failed to fetch session results" });
    }
  }
);

export default router;
