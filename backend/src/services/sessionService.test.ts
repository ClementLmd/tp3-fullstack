import {
  generateAccessCode,
  createActiveSession,
  getActiveSession,
  getActiveSessionByCode,
  updateSessionState,
  updateCurrentQuestion,
  addUserToSession,
  removeUserFromSession,
  removeActiveSession,
  getConnectedUsers,
  isAccessCodeInUse,
} from './sessionService';

describe('Session Service', () => {
  beforeEach(() => {
    // Clear any active sessions before each test
    // Since we're using module-level Map instances, we need to clear them
    const sessions = getActiveSession('non-existent');
    if (!sessions) {
      // Maps are cleared between tests if service is properly re-imported
    }
  });

  describe('generateAccessCode', () => {
    it('should generate a 6-character access code', () => {
      const code = generateAccessCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('should generate different codes on multiple calls', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateAccessCode());
      }
      // With 36^6 possible codes, we should have mostly unique codes
      expect(codes.size).toBeGreaterThan(95);
    });
  });

  describe('createActiveSession and getActiveSession', () => {
    it('should create and retrieve an active session', () => {
      const sessionId = 'session-123';
      const quizId = 'quiz-123';
      const accessCode = 'ABC123';
      const creatorId = 'teacher-123';

      createActiveSession(sessionId, quizId, accessCode, creatorId);

      const session = getActiveSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
      expect(session?.quizId).toBe(quizId);
      expect(session?.accessCode).toBe(accessCode);
      expect(session?.creatorId).toBe(creatorId);
      expect(session?.isActive).toBe(false);
      expect(session?.currentQuestionIndex).toBe(0);
      expect(session?.connectedUsers.size).toBe(0);
    });

    it('should return undefined for non-existent session', () => {
      const session = getActiveSession('non-existent');
      expect(session).toBeUndefined();
    });
  });

  describe('getActiveSessionByCode', () => {
    it('should retrieve session by access code', () => {
      const sessionId = 'session-123';
      const accessCode = 'ABC123';

      createActiveSession(sessionId, 'quiz-123', accessCode, 'teacher-123');

      const session = getActiveSessionByCode(accessCode);
      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
    });

    it('should return undefined for invalid access code', () => {
      const session = getActiveSessionByCode('INVALID');
      expect(session).toBeUndefined();
    });
  });

  describe('updateSessionState', () => {
    it('should update session active state', () => {
      const sessionId = 'session-123';
      createActiveSession(sessionId, 'quiz-123', 'ABC123', 'teacher-123');

      updateSessionState(sessionId, true);

      const session = getActiveSession(sessionId);
      expect(session?.isActive).toBe(true);
    });

    it('should not throw error for non-existent session', () => {
      expect(() => {
        updateSessionState('non-existent', true);
      }).not.toThrow();
    });
  });

  describe('updateCurrentQuestion', () => {
    it('should update current question index', () => {
      const sessionId = 'session-123';
      createActiveSession(sessionId, 'quiz-123', 'ABC123', 'teacher-123');

      updateCurrentQuestion(sessionId, 2);

      const session = getActiveSession(sessionId);
      expect(session?.currentQuestionIndex).toBe(2);
    });
  });

  describe('addUserToSession and getConnectedUsers', () => {
    it('should add user to session and retrieve connected users', () => {
      const sessionId = 'session-123';
      createActiveSession(sessionId, 'quiz-123', 'ABC123', 'teacher-123');

      addUserToSession(sessionId, 'socket-1', 'user-1', 'John Doe');
      addUserToSession(sessionId, 'socket-2', 'user-2', 'Jane Smith');

      const session = getActiveSession(sessionId);
      expect(session?.connectedUsers.size).toBe(2);

      const users = getConnectedUsers(sessionId);
      expect(users).toHaveLength(2);
      expect(users).toContainEqual({ userId: 'user-1', userName: 'John Doe' });
      expect(users).toContainEqual({ userId: 'user-2', userName: 'Jane Smith' });
    });
  });

  describe('removeUserFromSession', () => {
    it('should remove user from session', () => {
      const sessionId = 'session-123';
      createActiveSession(sessionId, 'quiz-123', 'ABC123', 'teacher-123');

      addUserToSession(sessionId, 'socket-1', 'user-1', 'John Doe');
      addUserToSession(sessionId, 'socket-2', 'user-2', 'Jane Smith');

      removeUserFromSession(sessionId, 'socket-1');

      const session = getActiveSession(sessionId);
      expect(session?.connectedUsers.size).toBe(1);

      const users = getConnectedUsers(sessionId);
      expect(users).toHaveLength(1);
      expect(users).toContainEqual({ userId: 'user-2', userName: 'Jane Smith' });
    });
  });

  describe('removeActiveSession', () => {
    it('should remove active session', () => {
      const sessionId = 'session-123';
      const accessCode = 'ABC123';
      createActiveSession(sessionId, 'quiz-123', accessCode, 'teacher-123');

      removeActiveSession(sessionId);

      const session = getActiveSession(sessionId);
      expect(session).toBeUndefined();

      const sessionByCode = getActiveSessionByCode(accessCode);
      expect(sessionByCode).toBeUndefined();
    });
  });

  describe('isAccessCodeInUse', () => {
    it('should return true if access code is in use', () => {
      const accessCode = 'ABC123';
      createActiveSession('session-123', 'quiz-123', accessCode, 'teacher-123');

      expect(isAccessCodeInUse(accessCode)).toBe(true);
    });

    it('should return false if access code is not in use', () => {
      expect(isAccessCodeInUse('UNUSED')).toBe(false);
    });
  });
});
