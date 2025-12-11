/**
 * Session service for managing quiz sessions
 * Handles in-memory session state and connected users
 */

// In-memory store for active sessions
// In production, this should be moved to Redis for scalability
interface ActiveSession {
  sessionId: string;
  quizId: string;
  accessCode: string;
  creatorId: string;
  isActive: boolean;
  currentQuestionIndex: number;
  connectedUsers: Set<string>; // Socket IDs
  userMap: Map<string, { userId: string; userName: string; socketId: string }>; // Map socket ID to user info
}

const activeSessions = new Map<string, ActiveSession>();
const accessCodeMap = new Map<string, string>(); // Map access code to session ID

/**
 * Generate a unique 6-character access code
 */
export function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new active session
 */
export function createActiveSession(
  sessionId: string,
  quizId: string,
  accessCode: string,
  creatorId: string
): void {
  const session: ActiveSession = {
    sessionId,
    quizId,
    accessCode,
    creatorId,
    isActive: false,
    currentQuestionIndex: 0,
    connectedUsers: new Set(),
    userMap: new Map(),
  };
  
  activeSessions.set(sessionId, session);
  accessCodeMap.set(accessCode, sessionId);
}

/**
 * Get active session by session ID
 */
export function getActiveSession(sessionId: string): ActiveSession | undefined {
  return activeSessions.get(sessionId);
}

/**
 * Get active session by access code
 */
export function getActiveSessionByCode(accessCode: string): ActiveSession | undefined {
  const sessionId = accessCodeMap.get(accessCode);
  return sessionId ? activeSessions.get(sessionId) : undefined;
}

/**
 * Update session active state
 */
export function updateSessionState(sessionId: string, isActive: boolean): void {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.isActive = isActive;
  }
}

/**
 * Update current question index
 */
export function updateCurrentQuestion(sessionId: string, questionIndex: number): void {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.currentQuestionIndex = questionIndex;
  }
}

/**
 * Add user to session
 */
export function addUserToSession(
  sessionId: string,
  socketId: string,
  userId: string,
  userName: string
): void {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.connectedUsers.add(socketId);
    session.userMap.set(socketId, { userId, userName, socketId });
  }
}

/**
 * Remove user from session
 */
export function removeUserFromSession(sessionId: string, socketId: string): void {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.connectedUsers.delete(socketId);
    session.userMap.delete(socketId);
  }
}

/**
 * Remove active session
 */
export function removeActiveSession(sessionId: string): void {
  const session = activeSessions.get(sessionId);
  if (session) {
    accessCodeMap.delete(session.accessCode);
    activeSessions.delete(sessionId);
  }
}

/**
 * Get all connected users in a session
 */
export function getConnectedUsers(sessionId: string): Array<{ userId: string; userName: string }> {
  const session = activeSessions.get(sessionId);
  if (!session) return [];
  
  return Array.from(session.userMap.values()).map(user => ({
    userId: user.userId,
    userName: user.userName,
  }));
}

/**
 * Check if access code is already in use
 */
export function isAccessCodeInUse(accessCode: string): boolean {
  return accessCodeMap.has(accessCode);
}
