import { Response } from 'express';
import { UserRole } from 'shared/src/types/auth';
import { AuthRequest } from '../middleware/auth';

// Mock database before importing controller
import '../test-utils/mocks/db';
import { mockQuery } from '../test-utils/mocks/db';

// Mock session service
jest.mock('../services/sessionService');
import * as sessionService from '../services/sessionService';

// Import controller after mocks are set up
import {
  createSession,
  getSession,
  startSession,
  broadcastQuestion,
  endSession,
  getSessionByCode,
} from './sessionController';

const mockGenerateAccessCode = sessionService.generateAccessCode as jest.MockedFunction<typeof sessionService.generateAccessCode>;
const mockCreateActiveSession = sessionService.createActiveSession as jest.MockedFunction<typeof sessionService.createActiveSession>;
const mockGetActiveSession = sessionService.getActiveSession as jest.MockedFunction<typeof sessionService.getActiveSession>;
const mockGetActiveSessionByCode = sessionService.getActiveSessionByCode as jest.MockedFunction<typeof sessionService.getActiveSessionByCode>;
const mockUpdateSessionState = sessionService.updateSessionState as jest.MockedFunction<typeof sessionService.updateSessionState>;
const mockUpdateCurrentQuestion = sessionService.updateCurrentQuestion as jest.MockedFunction<typeof sessionService.updateCurrentQuestion>;
const mockRemoveActiveSession = sessionService.removeActiveSession as jest.MockedFunction<typeof sessionService.removeActiveSession>;
const mockIsAccessCodeInUse = sessionService.isAccessCodeInUse as jest.MockedFunction<typeof sessionService.isAccessCodeInUse>;

describe('Session Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockQuery.mockReset();

    // Setup mock request
    mockRequest = {
      body: {},
      params: {},
      userId: 'teacher-123',
      userRole: UserRole.TEACHER,
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createSession', () => {
    const validQuizId = 'quiz-123';

    it('should create a session successfully', async () => {
      const mockAccessCode = 'ABC123';
      const mockSessionId = 'session-123';

      mockRequest.body = { quizId: validQuizId };

      // Mock quiz check
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: validQuizId, title: 'Test Quiz', creator_id: 'teacher-123' }],
      });

      // Mock access code generation
      mockGenerateAccessCode.mockReturnValue(mockAccessCode);
      mockIsAccessCodeInUse.mockReturnValue(false);

      // Mock session creation
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: mockSessionId,
          quiz_id: validQuizId,
          access_code: mockAccessCode,
          is_active: false,
          current_question_index: 0,
          created_at: new Date().toISOString(),
        }],
      });

      await createSession(mockRequest as AuthRequest, mockResponse as Response);

      // Verify quiz was checked
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, title, creator_id FROM quizzes'),
        [validQuizId, 'teacher-123']
      );

      // Verify session was created in database
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sessions'),
        [validQuizId, mockAccessCode, false, 0]
      );

      // Verify active session was created in memory
      expect(mockCreateActiveSession).toHaveBeenCalledWith(
        mockSessionId,
        validQuizId,
        mockAccessCode,
        'teacher-123'
      );

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockSessionId,
          quizId: validQuizId,
          accessCode: mockAccessCode,
          isActive: false,
          currentQuestionIndex: 0,
        })
      );
    });

    it('should return 400 if quizId is missing', async () => {
      mockRequest.body = {};

      await createSession(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Quiz ID is required.' });
    });

    it('should return 404 if quiz not found', async () => {
      mockRequest.body = { quizId: validQuizId };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await createSession(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Quiz not found or unauthorized.' });
    });
  });

  describe('getSession', () => {
    it('should get session successfully', async () => {
      const sessionId = 'session-123';
      mockRequest.params = { id: sessionId };

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: sessionId,
          quiz_id: 'quiz-123',
          access_code: 'ABC123',
          is_active: false,
          current_question_index: 0,
          started_at: null,
          ended_at: null,
          created_at: new Date().toISOString(),
          quiz_title: 'Test Quiz',
          creator_id: 'teacher-123',
        }],
      });

      await getSession(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: sessionId,
          accessCode: 'ABC123',
        })
      );
    });

    it('should return 404 if session not found', async () => {
      mockRequest.params = { id: 'session-123' };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getSession(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Session not found.' });
    });

    it('should return 403 if user is not the creator', async () => {
      mockRequest.params = { id: 'session-123' };
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'session-123',
          creator_id: 'other-teacher',
        }],
      });

      await getSession(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized access to session.' });
    });
  });

  describe('startSession', () => {
    it('should start session successfully', async () => {
      const sessionId = 'session-123';
      mockRequest.params = { id: sessionId };

      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            id: sessionId,
            quiz_id: 'quiz-123',
            creator_id: 'teacher-123',
          }],
        })
        .mockResolvedValueOnce({ rows: [] }); // Update query

      await startSession(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sessions'),
        [sessionId]
      );
      expect(mockUpdateSessionState).toHaveBeenCalledWith(sessionId, true);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Session started successfully.' });
    });

    it('should return 404 if session not found', async () => {
      mockRequest.params = { id: 'session-123' };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await startSession(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 if user is not the creator', async () => {
      mockRequest.params = { id: 'session-123' };
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'session-123',
          creator_id: 'other-teacher',
        }],
      });

      await startSession(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('broadcastQuestion', () => {
    it('should broadcast question successfully', async () => {
      const sessionId = 'session-123';
      const questionIndex = 0;
      mockRequest.params = { id: sessionId };
      mockRequest.body = { questionIndex };

      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            id: sessionId,
            quiz_id: 'quiz-123',
            is_active: true,
            creator_id: 'teacher-123',
          }],
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'question-123',
            quiz_id: 'quiz-123',
            text: 'What is 2+2?',
            type: 'MULTIPLE_CHOICE',
            options: { choices: ['3', '4', '5'], correctAnswer: 1 },
            order: 0,
            points: 10,
            time_limit: 30,
          }],
        })
        .mockResolvedValueOnce({ rows: [] }); // Update query

      await broadcastQuestion(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, quiz_id, text, type'),
        ['quiz-123', questionIndex]
      );
      expect(mockUpdateCurrentQuestion).toHaveBeenCalledWith(sessionId, questionIndex);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        question: expect.objectContaining({
          id: 'question-123',
          text: 'What is 2+2?',
        }),
      });
    });

    it('should return 400 if questionIndex is missing', async () => {
      mockRequest.params = { id: 'session-123' };
      mockRequest.body = {};

      await broadcastQuestion(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Question index is required.' });
    });

    it('should return 400 if session is not active', async () => {
      mockRequest.params = { id: 'session-123' };
      mockRequest.body = { questionIndex: 0 };

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'session-123',
          quiz_id: 'quiz-123',
          is_active: false,
          creator_id: 'teacher-123',
        }],
      });

      await broadcastQuestion(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Session is not active.' });
    });
  });

  describe('endSession', () => {
    it('should end session successfully', async () => {
      const sessionId = 'session-123';
      mockRequest.params = { id: sessionId };

      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            id: sessionId,
            creator_id: 'teacher-123',
          }],
        })
        .mockResolvedValueOnce({ rows: [] }); // Update query

      await endSession(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sessions'),
        [sessionId]
      );
      expect(mockRemoveActiveSession).toHaveBeenCalledWith(sessionId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Session ended successfully.' });
    });
  });

  describe('getSessionByCode', () => {
    it('should get session by access code successfully', async () => {
      const accessCode = 'ABC123';
      mockRequest.params = { code: accessCode };

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'session-123',
          quiz_id: 'quiz-123',
          access_code: accessCode,
          is_active: true,
          current_question_index: 0,
          created_at: new Date().toISOString(),
          quiz_title: 'Test Quiz',
        }],
      });

      await getSessionByCode(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessCode: accessCode,
          isActive: true,
        })
      );
    });

    it('should return 404 if session not found or not active', async () => {
      mockRequest.params = { code: 'INVALID' };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getSessionByCode(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Session not found or not active.' });
    });
  });
});
