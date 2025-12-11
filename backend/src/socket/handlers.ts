/**
 * Socket.io event handlers for real-time quiz sessions
 * Manages WebSocket connections for teachers and students
 */

import { Server, Socket } from 'socket.io';
import { query } from '../db/connection';
import {
  getActiveSession,
  getActiveSessionByCode,
  addUserToSession,
  removeUserFromSession,
  getConnectedUsers,
} from '../services/sessionService';
import { Question, QuestionType } from 'shared';

interface JoinSessionData {
  accessCode: string;
  userId: string;
  userName: string;
}

interface JoinTeacherRoomData {
  sessionId: string;
}

interface AnswerData {
  questionId: string;
  answer: string;
}

/**
 * Setup socket.io handlers
 */
export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    /**
     * Teacher joins their session room to manage it
     */
    socket.on('joinTeacherRoom', async (data: JoinTeacherRoomData) => {
      try {
        const { sessionId } = data;
        
        const session = getActiveSession(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found.' });
          return;
        }

        // Join the room
        socket.join(`session:${sessionId}`);
        socket.data.sessionId = sessionId;
        socket.data.isTeacher = true;

        console.log(`Teacher joined session room: ${sessionId}`);
        
        // Send current connected users count
        const users = getConnectedUsers(sessionId);
        socket.emit('sessionUpdate', { 
          connectedStudents: users.length,
          students: users,
        });
      } catch (err) {
        console.error('Join teacher room error:', err);
        socket.emit('error', { message: 'Failed to join teacher room.' });
      }
    });

    /**
     * Student joins a session via access code
     */
    socket.on('joinSession', async (data: JoinSessionData) => {
      try {
        const { accessCode, userId, userName } = data;

        if (!accessCode || !userId || !userName) {
          socket.emit('error', { message: 'Access code, user ID, and user name are required.' });
          return;
        }

        // Find session by access code
        const session = getActiveSessionByCode(accessCode.toUpperCase());
        if (!session) {
          socket.emit('error', { message: 'Invalid access code or session not active.' });
          return;
        }

        if (!session.isActive) {
          socket.emit('error', { message: 'Session has not started yet.' });
          return;
        }

        // Check if user already has a participation record
        const participationResult = await query(
          'SELECT id FROM participations WHERE session_id = $1 AND user_id = $2',
          [session.sessionId, userId]
        );

        let participationId: string;
        if (participationResult.rows.length === 0) {
          // Create participation record
          const result = await query(
            'INSERT INTO participations (session_id, user_id, score) VALUES ($1, $2, 0) RETURNING id',
            [session.sessionId, userId]
          );
          participationId = result.rows[0].id;
        } else {
          participationId = participationResult.rows[0].id;
        }

        // Add user to session
        addUserToSession(session.sessionId, socket.id, userId, userName);

        // Join the session room
        socket.join(`session:${session.sessionId}`);
        socket.data.sessionId = session.sessionId;
        socket.data.userId = userId;
        socket.data.userName = userName;
        socket.data.participationId = participationId;
        socket.data.isTeacher = false;

        console.log(`Student ${userName} (${userId}) joined session: ${session.sessionId}`);

        // Notify the student they've joined successfully
        socket.emit('joinedSession', {
          sessionId: session.sessionId,
          quizId: session.quizId,
          currentQuestionIndex: session.currentQuestionIndex,
        });

        // Notify teacher about new student
        const users = getConnectedUsers(session.sessionId);
        io.to(`session:${session.sessionId}`).emit('sessionUpdate', {
          connectedStudents: users.length,
          students: users,
        });
      } catch (err) {
        console.error('Join session error:', err);
        socket.emit('error', { message: 'Failed to join session.' });
      }
    });

    /**
     * Teacher broadcasts a question to all students
     */
    socket.on('broadcastQuestion', async (data: { sessionId: string; question: Question }) => {
      try {
        const { sessionId, question } = data;

        if (!socket.data.isTeacher) {
          socket.emit('error', { message: 'Only teachers can broadcast questions.' });
          return;
        }

        const session = getActiveSession(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found.' });
          return;
        }

        // Remove correct answer info before sending to students
        const studentQuestion: Partial<Question> = {
          id: question.id,
          quizId: question.quizId,
          text: question.text,
          type: question.type,
          options: question.options ? {
            choices: question.options.choices,
            correctAnswer: -1, // Hide correct answer from students
          } : undefined,
          order: question.order,
          points: question.points,
          timeLimit: question.timeLimit,
        };

        // Broadcast to all students in the session
        io.to(`session:${sessionId}`).emit('question', studentQuestion);

        console.log(`Question broadcasted to session ${sessionId}:`, question.id);

        // If there's a time limit, start a timer
        if (question.timeLimit) {
          let timeLeft = question.timeLimit;
          const timerInterval = setInterval(() => {
            timeLeft -= 1;
            io.to(`session:${sessionId}`).emit('timerUpdate', { timeLeft });

            if (timeLeft <= 0) {
              clearInterval(timerInterval);
              io.to(`session:${sessionId}`).emit('timeUp', { questionId: question.id });
            }
          }, 1000);
        }
      } catch (err) {
        console.error('Broadcast question error:', err);
        socket.emit('error', { message: 'Failed to broadcast question.' });
      }
    });

    /**
     * Student submits an answer
     */
    socket.on('answer', async (data: AnswerData) => {
      try {
        const { questionId, answer } = data;

        if (!socket.data.participationId) {
          socket.emit('error', { message: 'Not participating in any session.' });
          return;
        }

        // Get question details to check correct answer
        const questionResult = await query(
          'SELECT id, type, options, correct_answer, points FROM questions WHERE id = $1',
          [questionId]
        );

        if (questionResult.rows.length === 0) {
          socket.emit('error', { message: 'Question not found.' });
          return;
        }

        const question = questionResult.rows[0];
        let isCorrect = false;
        let pointsEarned = 0;

        // Check if answer is correct
        if (question.type === QuestionType.MULTIPLE_CHOICE) {
          const options = question.options;
          const answerIndex = parseInt(answer);
          isCorrect = answerIndex === options.correctAnswer;
        } else if (question.type === QuestionType.TRUE_FALSE) {
          isCorrect = answer.toLowerCase() === question.correct_answer.toLowerCase();
        } else if (question.type === QuestionType.TEXT) {
          isCorrect = answer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
        }

        if (isCorrect) {
          pointsEarned = question.points;
        }

        // Save answer to database
        await query(
          `INSERT INTO answers (question_id, participation_id, answer, is_correct, points)
           VALUES ($1, $2, $3, $4, $5)`,
          [questionId, socket.data.participationId, answer, isCorrect, pointsEarned]
        );

        // Update participation score
        await query(
          'UPDATE participations SET score = score + $1 WHERE id = $2',
          [pointsEarned, socket.data.participationId]
        );

        // Notify the student
        socket.emit('answerSubmitted', {
          questionId,
          isCorrect,
          pointsEarned,
        });

        console.log(
          `Answer submitted by ${socket.data.userName} for question ${questionId}: ${isCorrect ? 'correct' : 'incorrect'}`
        );
      } catch (err) {
        console.error('Answer submission error:', err);
        socket.emit('error', { message: 'Failed to submit answer.' });
      }
    });

    /**
     * Get current leaderboard for a session
     */
    socket.on('getLeaderboard', async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;

        const leaderboardResult = await query(
          `SELECT p.user_id, p.score, u.first_name, u.last_name
           FROM participations p
           JOIN users u ON p.user_id = u.id
           WHERE p.session_id = $1
           ORDER BY p.score DESC, p.joined_at ASC
           LIMIT 10`,
          [sessionId]
        );

        const leaderboard = leaderboardResult.rows.map((row, index) => ({
          rank: index + 1,
          userId: row.user_id,
          name: `${row.first_name} ${row.last_name}`,
          score: row.score,
        }));

        socket.emit('leaderboard', { leaderboard });
      } catch (err) {
        console.error('Get leaderboard error:', err);
        socket.emit('error', { message: 'Failed to get leaderboard.' });
      }
    });

    /**
     * Teacher broadcasts results after a question
     */
    socket.on('broadcastResults', async (data: { sessionId: string; questionId: string }) => {
      try {
        const { sessionId, questionId } = data;

        if (!socket.data.isTeacher) {
          socket.emit('error', { message: 'Only teachers can broadcast results.' });
          return;
        }

        // Get leaderboard
        const leaderboardResult = await query(
          `SELECT p.user_id, p.score, u.first_name, u.last_name
           FROM participations p
           JOIN users u ON p.user_id = u.id
           WHERE p.session_id = $1
           ORDER BY p.score DESC, p.joined_at ASC
           LIMIT 10`,
          [sessionId]
        );

        const leaderboard = leaderboardResult.rows.map((row, index) => ({
          rank: index + 1,
          userId: row.user_id,
          name: `${row.first_name} ${row.last_name}`,
          score: row.score,
        }));

        // Broadcast results to all users in the session
        io.to(`session:${sessionId}`).emit('results', {
          questionId,
          leaderboard,
        });

        console.log(`Results broadcasted to session ${sessionId} for question ${questionId}`);
      } catch (err) {
        console.error('Broadcast results error:', err);
        socket.emit('error', { message: 'Failed to broadcast results.' });
      }
    });

    /**
     * Leave session
     */
    socket.on('leaveSession', () => {
      if (socket.data.sessionId) {
        handleDisconnect(socket);
      }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
      handleDisconnect(socket);
      console.log('Client disconnected:', socket.id);
    });
  });
}

/**
 * Handle user disconnection from session
 */
function handleDisconnect(socket: Socket): void {
  if (socket.data.sessionId && !socket.data.isTeacher) {
    const sessionId = socket.data.sessionId;
    removeUserFromSession(sessionId, socket.id);

    // Notify teacher about user leaving
    const users = getConnectedUsers(sessionId);
    socket.to(`session:${sessionId}`).emit('sessionUpdate', {
      connectedStudents: users.length,
      students: users,
    });

    console.log(`User ${socket.data.userName} left session: ${sessionId}`);
  }
  
  socket.leave(`session:${socket.data.sessionId}`);
}
