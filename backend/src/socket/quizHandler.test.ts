/**
 * Tests for socket quiz handler
 */

import { Server, Socket } from 'socket.io';
import { QuestionType } from 'shared/src/types';

// Mock the getClient function
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockQuery = jest.fn();

jest.mock('../db/connection', () => ({
  query: mockQuery,
  getClient: jest.fn().mockResolvedValue(mockClient),
  pool: {
    query: mockQuery,
  },
}));

// Import handler after mocks are set up
import { registerQuizHandlers } from './quizHandler';

describe('Quiz Socket Handlers', () => {
  let mockIo: Partial<Server>;
  let mockSocket: Partial<Socket> & { userId?: string; userRole?: string };
  let socketEventHandlers: Record<string, Function>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockQuery.mockReset();
    mockClient.query.mockReset();
    mockClient.release.mockReset();
    socketEventHandlers = {};

    // Mock socket with proper return type for 'on'
    mockSocket = {
      id: 'test-socket-id',
      userId: 'teacher-123',
      userRole: 'TEACHER',
      on: jest.fn((event: string, handler: Function) => {
        socketEventHandlers[event] = handler;
        return mockSocket as Socket;
      }),
      emit: jest.fn(),
    } as any;

    // Mock io
    mockIo = {
      emit: jest.fn(),
    };

    // Register handlers
    registerQuizHandlers(mockIo as Server, mockSocket as Socket);
  });

  describe('createQuiz', () => {
    const validQuizData = {
      title: 'Test Quiz',
      description: 'Test Description',
      questions: [
        {
          text: 'What is 2+2?',
          type: QuestionType.MULTIPLE_CHOICE,
          options: {
            choices: ['3', '4', '5'],
            correctAnswer: 1,
          },
          order: 0,
          points: 1,
        },
      ],
    };

    it('should create a quiz successfully for a teacher', async () => {
      const mockQuizRow = {
        id: 'quiz-123',
        title: 'Test Quiz',
        description: 'Test Description',
        creator_id: 'teacher-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuestionRow = {
        id: 'question-123',
        quiz_id: 'quiz-123',
        text: 'What is 2+2?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: { choices: ['3', '4', '5'], correctAnswer: 1 },
        correct_answer: null,
        order: 0,
        points: 1,
        time_limit: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Reset and setup mock
      mockClient.query.mockReset();
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [mockQuizRow] }) // INSERT quiz
        .mockResolvedValueOnce({ rows: [mockQuestionRow] }) // INSERT question
        .mockResolvedValueOnce(undefined); // COMMIT

      const callback = jest.fn();

      await socketEventHandlers.createQuiz(validQuizData, callback);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO quizzes'),
        expect.arrayContaining(['Test Quiz', 'Test Description', 'teacher-123'])
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(callback).toHaveBeenCalledWith({
        success: true,
        quiz: expect.objectContaining({
          id: 'quiz-123',
          title: 'Test Quiz',
        }),
      });
      expect(mockIo.emit).toHaveBeenCalledWith('quizCreated', expect.any(Object));
    });

    it('should reject if user is not a teacher', async () => {
      mockSocket.userRole = 'STUDENT';

      const callback = jest.fn();

      await socketEventHandlers.createQuiz(validQuizData, callback);

      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized. Only teachers can create quizzes.',
      });
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it('should reject if title is missing', async () => {
      const invalidData = {
        ...validQuizData,
        title: '',
      };

      const callback = jest.fn();

      await socketEventHandlers.createQuiz(invalidData, callback);

      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Title is required.',
      });
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it('should reject if questions are invalid', async () => {
      const invalidData = {
        ...validQuizData,
        questions: [
          {
            text: 'Invalid question',
            type: QuestionType.MULTIPLE_CHOICE,
            options: {
              choices: ['Only one choice'], // Invalid: needs at least 2
              correctAnswer: 0,
            },
          },
        ],
      };

      const callback = jest.fn();

      await socketEventHandlers.createQuiz(invalidData, callback);

      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Multiple choice requires at least 2 choices'),
      });
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it('should rollback on database error', async () => {
      mockClient.query.mockReset();
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error('Database error')); // INSERT fails

      const callback = jest.fn();

      await socketEventHandlers.createQuiz(validQuizData, callback);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to create quiz.',
      });
    });
  });

  describe('updateQuiz', () => {
    const validUpdateData = {
      quizId: 'quiz-123',
      title: 'Updated Quiz',
      description: 'Updated Description',
      questions: [
        {
          text: 'What is 3+3?',
          type: QuestionType.TRUE_FALSE,
          correctAnswer: 'false',
          order: 0,
          points: 1,
        },
      ],
    };

    it('should update a quiz successfully', async () => {
      const mockQuizRow = {
        id: 'quiz-123',
        title: 'Updated Quiz',
        description: 'Updated Description',
        creator_id: 'teacher-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuestionRow = {
        id: 'question-456',
        quiz_id: 'quiz-123',
        text: 'What is 3+3?',
        type: QuestionType.TRUE_FALSE,
        options: null,
        correct_answer: 'false',
        order: 0,
        points: 1,
        time_limit: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockClient.query.mockReset();
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'quiz-123' }] }) // Check ownership
        .mockResolvedValueOnce({ rows: [mockQuizRow] }) // UPDATE quiz
        .mockResolvedValueOnce({ rows: [] }) // DELETE old questions
        .mockResolvedValueOnce({ rows: [mockQuestionRow] }) // INSERT new question
        .mockResolvedValueOnce(undefined); // COMMIT

      const callback = jest.fn();

      await socketEventHandlers.updateQuiz(validUpdateData, callback);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id FROM quizzes WHERE id = $1 AND creator_id = $2'),
        ['quiz-123', 'teacher-123']
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(callback).toHaveBeenCalledWith({
        success: true,
        quiz: expect.objectContaining({
          id: 'quiz-123',
          title: 'Updated Quiz',
        }),
      });
      expect(mockIo.emit).toHaveBeenCalledWith('quizUpdated', expect.any(Object));
    });

    it('should reject if quiz does not exist or user does not own it', async () => {
      mockClient.query.mockReset();
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // Check ownership returns empty

      const callback = jest.fn();

      await socketEventHandlers.updateQuiz(validUpdateData, callback);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Quiz not found or you do not have permission to update it.',
      });
    });

    it('should reject if user is not a teacher', async () => {
      mockSocket.userRole = 'STUDENT';

      const callback = jest.fn();

      await socketEventHandlers.updateQuiz(validUpdateData, callback);

      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized. Only teachers can update quizzes.',
      });
      expect(mockClient.query).not.toHaveBeenCalled();
    });
  });

  describe('deleteQuiz', () => {
    it('should delete a quiz successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'quiz-123' }],
      });

      const callback = jest.fn();

      await socketEventHandlers.deleteQuiz({ quizId: 'quiz-123' }, callback);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM quizzes'),
        ['quiz-123', 'teacher-123']
      );
      expect(callback).toHaveBeenCalledWith({
        success: true,
      });
      expect(mockIo.emit).toHaveBeenCalledWith('quizDeleted', 'quiz-123');
    });

    it('should reject if quiz does not exist or user does not own it', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
      });

      const callback = jest.fn();

      await socketEventHandlers.deleteQuiz({ quizId: 'quiz-123' }, callback);

      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Quiz not found or you do not have permission to delete it.',
      });
      expect(mockIo.emit).not.toHaveBeenCalled();
    });

    it('should reject if user is not a teacher', async () => {
      mockSocket.userRole = 'STUDENT';

      const callback = jest.fn();

      await socketEventHandlers.deleteQuiz({ quizId: 'quiz-123' }, callback);

      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized. Only teachers can delete quizzes.',
      });
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should reject if quiz ID is missing', async () => {
      const callback = jest.fn();

      await socketEventHandlers.deleteQuiz({ quizId: '' }, callback);

      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'Quiz ID is required.',
      });
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });
});
